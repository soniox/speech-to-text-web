/* eslint-disable @typescript-eslint/no-unused-vars */
import { ErrorStatus } from './errors';
import { isActiveState, isInactiveState, isWebSocketState, RecorderState } from './state';
import { SpeechToTextAPIRequest, SpeechToTextAPIResponse, TranslationConfig } from './types';

const defaultWebsocketUri = 'wss://stt-rt.soniox.com/transcribe-websocket';

const defaultBufferQueueSize = 1000;

const recorderTimeSliceMs = 120;

const finalizeMessage = '{ "type": "finalize" }';

type ApiKeyGetter = () => Promise<string>;

type Callbacks = {
  onStateChange?: (update: { oldState: RecorderState; newState: RecorderState }) => void;
  onStarted?: () => void;
  onPartialResult?: (result: SpeechToTextAPIResponse) => void;
  onFinished?: () => void;
  /**
   * Called when an error occurs.
   *
   * @param status - The error status.
   * @param message - More descriptive error message.
   * @param errorCode - The error code. Returned only if status is `api_error`.
   */
  onError?: (status: ErrorStatus, message: string, errorCode: number | undefined) => void;
};

type SonioxClientOptions = {
  /**
   * WebSocket URI. If not provided, the default URI will be used.
   */
  webSocketUri?: string;

  /**
   * Either a string or a an async function which returns api key.
   * Function can be used to generate a temporary API key, which is useful if you want to avoid exposing your API key to the client.
   */
  apiKey: string | ApiKeyGetter;

  /**
   * How many messages to queue before websocket is opened. If full, error will be thrown.
   * (opening websocket might take some time, especially if the API key fetching is slow or
   * the user has a slow connection)
   */
  bufferQueueSize?: number;
} & Callbacks;

type AudioOptions = {
  /**
   * One of the available Speech-to-Text models.
   */
  model: string;

  // Transcription options
  /**
   * List of language codes to hint the API on what language to transcribe.
   *
   * Example: `['en', 'fr', 'de']`
   */
  languageHints?: string[];

  /**
   * Context string to pass to the API.
   */
  context?: string;

  /**
   * When true, speakers are identified and separated in the transcription output.
   */
  enableSpeakerDiarization?: boolean;

  /** When true, language identification is enabled. */
  enableLanguageIdentification?: boolean;

  /** When true, endpoint detection is enabled. */
  enableEndpointDetection?: boolean;

  /**
   * Translation configuration. Can be one-way or two-way translation.
   */
  translation?: TranslationConfig;

  /**
   * The format of the streamed audio (e.g., "auto", "s16le").
   */
  audioFormat?: string;

  /**
   * Required for raw PCM formats.
   */
  sampleRate?: number;

  /**
   * Required for raw PCM formats. Typically 1 for mono audio, 2 for stereo.
   */
  numChannels?: number;

  /**
   * A client-defined identifier to track this stream. Can be any string. If not provided, it will be auto-generated.
   */
  clientReferenceId?: string;

  /**
   * Can be used to set the `echoCancellation` and `noiseSuppression` properties of the MediaTrackConstraints object.
   * See https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints for more details.
   */
  audioConstraints?: MediaTrackConstraints;

  /**
   * MediaRecorder options: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder
   */
  mediaRecorderOptions?: Record<string, any>;

  /**
   * If you don't want to transcribe audio from microphone, you can pass a MediaStream to the `stream` option.
   * This can be useful if you want to transcribe audio from a file or a custom source.
   */
  stream?: MediaStream;
} & Callbacks;

const getDefaultSonioxClientOptions = (): SonioxClientOptions => ({
  apiKey: '',
  bufferQueueSize: defaultBufferQueueSize,
});

const defaultAudioConstraints: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 1,
  sampleRate: 44100,
};

export class SonioxClient {
  static isSupported = Boolean('WebSocket' in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  _state: RecorderState = 'Init';
  _options: SonioxClientOptions;
  _audioOptions: AudioOptions | null;
  _websocket: WebSocket | null;
  _mediaRecorder: MediaRecorder | null;
  _queuedMessages: (Blob | string)[] = []; // Queued data (before websocket is opened)

  /**
   * SonioxClient connects to the Soniox Speech-to-Text API for real-time speech-to-text transcription and translation.
   * It provides a simple API for starting and stopping the transcription, as well as handling the transcription results.
   *
   * @example
   * const sonioxClient = new SonioxClient({
   *   apiKey: '<SONIOX_API_KEY>',
   *   onPartialResult: (result) => {
   *     console.log('partial result', result.text);
   *   },
   * });
   * sonioxClient.start();
   */
  constructor(options?: SonioxClientOptions) {
    if (!SonioxClient.isSupported) {
      throw 'Soniox Speech-to-Text is not supported on this browser.';
    }

    this._options = {
      ...getDefaultSonioxClientOptions(),
      ...options,
    };

    this._audioOptions = null;

    this._websocket = null;
    this._mediaRecorder = null;
  }

  _hasCallback = <T extends keyof Callbacks>(name: T): boolean => {
    return this._options[name] != null || this._audioOptions?.[name] != null;
  };

  _callback = <T extends keyof Callbacks>(name: T, ...args: Parameters<NonNullable<Callbacks[T]>>): void => {
    // @ts-ignore
    this._options[name]?.(...args);
    // @ts-ignore
    this._audioOptions?.[name]?.(...args);
  };

  _setState(newState: RecorderState): void {
    const oldState = this._state;
    this._state = newState;
    this._callback('onStateChange', {
      oldState,
      newState,
    });
  }

  get state(): RecorderState {
    return this._state;
  }

  /**
   * Start transcription. You can pass options to configure the transcription settings, source and callbacks.
   */
  start = async (audioOptions: AudioOptions): Promise<void> => {
    if (isActiveState(this._state)) {
      throw new Error('SonioxClient is already active');
    }

    this._audioOptions = { ...audioOptions };

    let stream: MediaStream | undefined = undefined;

    if (audioOptions.stream != null) {
      // User has provided a stream, don't request microphone access, simply transcribe the stream.
      // We need to clone the stream so internal stopping doesn't affect the user's stream.
      stream = audioOptions.stream.clone();
    } else {
      // Stream not given, request stream from microphone.
      this._setState('RequestingMedia');

      try {
        // Request microphone access and get stream
        stream = await navigator.mediaDevices.getUserMedia({
          audio: this._audioOptions.audioConstraints ? this._audioOptions.audioConstraints : defaultAudioConstraints,
        });
      } catch (e) {
        this._onError('get_user_media_failed', e?.toString());
      }
    }

    // Mostly here to make typescript happy
    if (stream == null) {
      throw new Error('Failed to create stream');
    }

    // New media stream
    this._mediaRecorder = new MediaRecorder(
      stream,
      audioOptions.mediaRecorderOptions ? audioOptions.mediaRecorderOptions : {},
    );

    // Start collecting data
    this._queuedMessages = [];
    this._mediaRecorder.addEventListener('dataavailable', this._onMediaRecorderData);
    this._mediaRecorder.addEventListener('error', this._onMediaRecorderError);
    this._mediaRecorder.addEventListener('pause', this._onMediaRecorderPause);
    this._mediaRecorder.addEventListener('stop', this._onMediaRecorderStop);

    // Start recording
    this._mediaRecorder.start(recorderTimeSliceMs);

    // Open websocket
    this._setState('OpeningWebSocket');
    this._websocket = new WebSocket(this._options.webSocketUri ?? defaultWebsocketUri);

    this._websocket.addEventListener('open', this._onWebSocketOpen);
    this._websocket.addEventListener('error', this._onWebSocketError);
    this._websocket.addEventListener('message', this._onWebSocketMessage);
  };

  /**
   * Stop transcription. Stopping transcription will send stop signal to the API and wait for the final results to be received.
   * Only after the final results are received, the transcription will be finished. If you want to cancel the transcription immediately,
   * (for example, on component unmount), you should probably use the `cancel()` method instead.
   */
  stop = (): void => {
    if (this._state == 'RequestingMedia' || this._state == 'OpeningWebSocket') {
      this._closeResources();
      this._handleFinished();
    } else if (this._state == 'Running') {
      // Finished recording, waiting for last events from api
      this._setState('FinishingProcessing');
      this._closeSource();
      // Send empty message to api to indicate that we're done
      this._websocket?.send('');
    }
  };

  /**
   * Cancel transcription. Cancelling transcription will stop the transcription immediately and close the resources.
   * For user initiated cancellation, you should probably use the `stop()` method instead.
   */
  cancel = (): void => {
    if (!isInactiveState(this._state)) {
      this._closeResources();
      this._setState('Canceled');
    }
  };

  /**
   * Trigger finalize. This will finalize all non-final tokens.
   */
  finalize = (): void => {
    if (this._state == 'RequestingMedia' || this._state == 'OpeningWebSocket') {
      // Still waiting for websocket to open, queue the event
      if (this._queuedMessages.length < (this._options.bufferQueueSize ?? defaultBufferQueueSize)) {
        this._queuedMessages.push(finalizeMessage);
      } else {
        this._onError('queue_limit_exceeded', 'Queue size exceeded before websocket connection was established.');
      }
    } else if (this._state == 'Running' || this._state == 'FinishingProcessing') {
      this._websocket?.send(finalizeMessage);
    }
  };

  // Media recorder events

  _onMediaRecorderData = async (event: BlobEvent): Promise<void> => {
    if (this._state === 'OpeningWebSocket') {
      // Still waiting for websocket to open, queue the event
      if (this._queuedMessages.length < (this._options.bufferQueueSize ?? defaultBufferQueueSize)) {
        this._queuedMessages.push(event.data);
      } else {
        this._onError('queue_limit_exceeded', 'Queue size exceeded before websocket connection was established.');
      }
    } else if (this._state === 'Running') {
      const data = await event.data.arrayBuffer();
      this._websocket?.send(data);
    }
  };

  _onMediaRecorderError = (event: Event): void => {
    this._onError('media_recorder_error', (event as ErrorEvent).error ?? 'Unknown error');
  };

  _onMediaRecorderPause = (_event: Event): void => {
    this.stop();
  };

  _onMediaRecorderStop = (_event: Event): void => {
    this.stop();
  };

  // Websocket events

  _onWebSocketOpen = (event: Event): void => {
    void this._onWebSocketOpenAsync(event);
  };

  _onWebSocketOpenAsync = async (_event: Event): Promise<void> => {
    if (this._state !== 'OpeningWebSocket' || this._audioOptions == null) {
      return;
    }

    const opts = this._audioOptions;

    // If api key is getter, call it to get the key, if not, use the key directly
    let apiKey: string;
    if (typeof this._options.apiKey === 'function') {
      try {
        apiKey = await this._options.apiKey();
      } catch (e) {
        this._onError('api_key_fetch_failed', e?.toString());
        return;
      }
    } else {
      apiKey = this._options.apiKey;
    }

    // Check state again (might be different if state changed during api key fetching)
    if (this._state !== 'OpeningWebSocket') {
      return;
    }

    const request: SpeechToTextAPIRequest = {
      api_key: apiKey,
      model: opts.model,
      audio_format: opts.audioFormat ? opts.audioFormat : 'auto',
      sample_rate: opts.sampleRate,
      num_channels: opts.numChannels,
      language_hints: opts.languageHints,
      context: opts.context,
      enable_speaker_diarization: opts.enableSpeakerDiarization,
      enable_language_identification: opts.enableLanguageIdentification,
      enable_endpoint_detection: opts.enableEndpointDetection,
      translation: opts.translation,
      client_reference_id: opts.clientReferenceId,
    };

    // Send initial request
    this._websocket?.send(JSON.stringify(request));

    // Send all queued messages (if any)
    for (const message of this._queuedMessages) {
      this._websocket?.send(message);
    }
    this._queuedMessages = [];

    this._setState('Running');
    this._callback('onStarted');
  };

  _onWebSocketError = (_event: Event): void => {
    if (!isWebSocketState(this._state)) {
      return;
    }
    this._onError('websocket_error', 'WebSocket error occurred.');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _onWebSocketMessage = (event: MessageEvent<any>): void => {
    if ((this._state != 'Running' && this._state != 'FinishingProcessing') || this._audioOptions == null) {
      return;
    }
    const response = JSON.parse(event.data) as SpeechToTextAPIResponse;

    if (response.error_code != null || response.error_message != null) {
      this._onError('api_error', response.error_message, response.error_code);
      return;
    }

    this._callback('onPartialResult', response);

    if (response.finished) {
      this._handleFinished();
    }
  };

  _onError = (status: ErrorStatus, message: string | undefined, errorCode: number | undefined = undefined): void => {
    this._setState('Error');
    this._closeResources();

    if (this._hasCallback('onError')) {
      this._callback('onError', status, message ?? 'Unknown error', errorCode);
    } else {
      throw new Error(`SonioxClient error: ${status}: ${message ?? 'Unknown error'}`);
    }
  };

  _closeSource = (): void => {
    // Close media recorder
    if (this._mediaRecorder != null) {
      this._mediaRecorder.removeEventListener('dataavailable', this._onMediaRecorderData);
      this._mediaRecorder.removeEventListener('error', this._onMediaRecorderError);
      this._mediaRecorder.removeEventListener('pause', this._onMediaRecorderPause);
      this._mediaRecorder.removeEventListener('stop', this._onMediaRecorderStop);

      this._mediaRecorder.stop();
      this._mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      this._mediaRecorder = null;
    }
  };

  _closeResources = (): void => {
    this._queuedMessages = [];

    // Close websocket
    if (this._websocket != null) {
      this._websocket.removeEventListener('open', this._onWebSocketOpen);
      this._websocket.removeEventListener('error', this._onWebSocketError);
      this._websocket.removeEventListener('message', this._onWebSocketMessage);
      this._websocket.close();
      this._websocket = null;
    }

    this._closeSource();
  };

  _handleFinished(): void {
    this._closeResources();
    this._setState('Finished');
    this._callback('onFinished');
  }
}

/**
 * @deprecated Use SonioxClient instead.
 *
 */
export const RecordTranscribe = SonioxClient;
