# Soniox Speech-to-Text Web SDK

## Overview

Soniox [speech-to-text-web](https://github.com/soniox/speech-to-text-web) is the official JavaScript/TypeScript SDK for using the Soniox [Real-time API](https://soniox.com/docs/stt/api-reference/websocket-api) directly in the browser.
It lets you:

- Capture audio from the user’s microphone
- Stream audio to Soniox in real time
- Receive transcription and translation results instantly

Enable advanced features such as [language identification](https://soniox.com/docs/stt/concepts/language-identification), [speaker diarization](https://soniox.com/docs/stt/concepts/speaker-diarization), [context](https://soniox.com/docs/stt/concepts/context), [endpoint detection](https://soniox.com/docs/stt/rt/endpoint-detection), and more.

👉 Use cases: live captions, multilingual meetings, dictation tools, accessibility overlays, customer support dashboards, education apps.

## Installation

```bash
npm install @soniox/speech-to-text-web
```

or use via CDN:

```html
<script type="module">
  import { SonioxClient } from 'https://unpkg.com/@soniox/speech-to-text-web?module';
  ...
</script>
```

## Quickstart

Use `SonioxClient` to start session:

```ts
const sonioxClient = new SonioxClient({
  // Your Soniox API key or temporary API key.
  apiKey: '<SONIOX_API_KEY>',
});

sonioxClient.start({
  // Select the model to use.
  model: 'stt-rt-preview',

  // Set language hints when possible to significantly improve accuracy.
  languageHints: ['en', 'es'],

  // Context is a string that can include words, phrases, or sentences to improve the
  // recognition of rare or specific terms.
  context: {
    general: [
      { key: 'domain', value: 'Healthcare' },
      { key: 'topic', value: 'Diabetes management consultation' },
    ],
    terms: ['Celebrex', 'Zyrtec', 'Xanax', 'Prilosec', 'Amoxicillin Clavulanate Potassium'],
  },

  // Enable speaker diarization. Each token will include a "speaker" field.
  enableSpeakerDiarization: true,

  // Enable language identification. Each token will include a "language" field.
  enableLanguageIdentification: true,

  // Use endpoint detection to detect when a speaker has finished talking.
  // It finalizes all non-final tokens right away, minimizing latency.
  enableEndpointDetection: true,

  // Callbacks when the transcription starts, finishes, or encounters an error.
  onError: (status, message) => {
    console.error(status, message);
  },
  // Callback when the transcription returns partial results (tokens).
  onPartialResult(result) {
    console.log('partial result', result.tokens);
  },
});
```

The `SonioxClient` object processes audio from the user's microphone or a custom audio stream. It returns results by invoking the `onPartialResult` callback with transcription and translation data, depending on the configuration.

Stop or cancel transcription:

```ts
sonioxClient.stop();
// or
sonioxClient.cancel();
```

### Translation

To enable [real-time translation](https://soniox.com/docs/stt/rt/real-time-translation), you can add a `TranslationConfig` object to the parameters of the `start` method.

```ts
// One-way translation: translate all spoken languages into a single target language.
translation: {
  type: 'one_way',
  target_language: 'en',
}

// Two-way translation: translate back and forth between two specified languages.
translation: {
  type: 'two_way',
  language_a: 'en',
  language_b: 'es',
}
```

### `stop()` vs `cancel()`

The key difference is that `stop()` gracefully waits for the server to process all buffered audio and send back final results. In contrast, `cancel()` terminates the session immediately without waiting.

For example, when a user clicks a "Stop Recording" button, you should call `stop()`. If you need to discard the session immediately (e.g., when a component unmounts in a web framework), call `cancel()`.

### Buffering and temporary API keys

If you want to avoid exposing your API key to the client, you can use temporary API keys. To generate a temporary API key, you can use [temporary API key endpoint](https://soniox.com/docs/stt/api-reference/auth/create_temporary_api_key) in the Soniox API.

If you want to fetch a temporary API key only when recording starts, you can pass a function to the `apiKey` option. The function will be called when the recording starts and should return the API key.

```ts
const sonioxClient = new SonioxClient({
  apiKey: async () => {
    // Call your backend to generate a temporary API key there.
    const response = await fetch('/api/get-temporary-api-key', {
      method: 'POST',
    });
    const { apiKey } = await response.json();
    return apiKey;
  },
});
```

Until this function resolves and returns an API key, audio data is buffered in memory. When the temporary API key is fetched, the buffered audio data will be sent to the server and the processing will start.

For a full example with temporary API key generation, check the [NextJS Example](https://github.com/soniox/speech-to-text-web/tree/master/examples/nextjs).

### Custom audio streams

To transcribe audio from a custom source, you can pass a custom `MediaStream` to the `stream` option.

If you provide a custom `MediaStream` to the `stream` option, you are responsible for managing its lifecycle, including starting and stopping the stream. For instance, when using an HTML5 `<audio>` element (as shown below), you may want to pause playback when transcription is complete or an error occurs.

```ts
// Create a new audio element
const audioElement = new Audio();
audioElement.volume = 1;
audioElement.crossOrigin = 'anonymous';
audioElement.src = 'https://soniox.com/media/examples/coffee_shop.mp3';

// Create a media stream from the audio element
const audioContext = new AudioContext();
const source = audioContext.createMediaElementSource(audioElement);
const destination = audioContext.createMediaStreamDestination();
source.connect(destination); // Connect to media stream
source.connect(audioContext.destination); // Connect to playback

// Start transcription
sonioxClient.start({
  model: 'stt-rt-preview',
  stream: destination.stream,

  onFinished: () => {
    audioElement.pause();
  },
  onError: (status, message) => {
    audioElement.pause();
  },
});

// Play the audio element to activate the stream
audioElement.play();
```

## Examples

- **Minimal JavaScript example**: Simple transcription example in vanilla JavaScript.
  [View on GitHub](https://github.com/soniox/speech-to-text-web/tree/master/examples/javascript)
- **Next.js example**: Transcription and translation example with temporary API key generation.
  [View on GitHub](https://github.com/soniox/speech-to-text-web/tree/master/examples/nextjs)
- **Complete React example**: A complete example rendering speaker tags, detected languages, and translations.
  [View on GitHub](https://github.com/soniox/soniox_examples/tree/master/speech_to_text/apps/react)

## API Reference

### `SonioxClient`

#### `constructor(options)`

Creates a new `SonioxClient` instance.

```ts
new SonioxClient({
  // Your Soniox API key or temporary API key.
  apiKey: SONIOX_API_KEY,

  // Maximum number of audio chunks to buffer in memory before the WebSocket connection is established.
  bufferQueueSize: 1000,

  // Callbacks on state changes, partial results and errors.
  onStarted: () => {
    console.log('transcription started');
  },
  onFinished: () => {
    console.log('transcription finished');
  },
  onPartialResult: (result) => {
    console.log('partial result', result.tokens);
  },
  onStateChange: ({ newState, oldState }) => {
    console.log('state changed from', oldState, 'to', newState);
  },
  onError: (status, message) => {
    console.error(status, message);
  },
});
```

##### `apiKey`

Soniox API key or an async function that returns the API key (see [Buffering and temporary API keys](#buffering-and-temporary-api-keys)).

##### `bufferQueueSize`

Maximum number of audio chunks to buffer in memory before the WebSocket connection is established. If this limit is exceeded, an error will be thrown.

##### `onStarted()`

Called when the transcription starts. This happens after the API key is fetched and WebSocket connection is established.

##### `onFinished()`

Called when the transcription finishes successfully. After calling `stop()`, you should wait for this callback to ensure all final results have been received.

##### `onPartialResult(result: SpeechToTextAPIResponse)`

Called when the transcription returns partial results. The result contains a list recognized `tokens`. To learn more about the `tokens` structure, see [Speech-to-Text Websocket API reference](https://soniox.com/docs/stt/api-reference/websocket-api#response).

##### `onStateChange(state: RecorderState)`

Called when the state of the transcription changes. Useful for rerendering the UI based on the state.

##### `onError(status: ErrorStatus, message: string, errorCode?: number)`

Called when the transcription encounters an error. Possible error statuses are:

- `get_user_media_failed`: If the user denies the permission to use the microphone or the browser does not support audio recording.
- `api_key_fetch_failed`: In case you passed a function to `apiKey` option and the function throws an error.
- `queue_limit_exceeded`: While waiting for the temporary API key to be fetched, the local queue is full. You can increase the queue size by setting `bufferQueueSize` option.
- `media_recorder_error`: An error occurred while recording the audio.
- `api_error`: Error returned by the Soniox API. In this case, the `errorCode` property contains the HTTP status code equivalent to the error. For a list of possible error codes, see [Speech-to-Text Websocket API reference](https://soniox.com/docs/stt/api-reference/websocket-api#response).
- `websocket_error`: WebSocket error.

#### `start(audioOptions)`

Starts transcription or translation.

```ts
sonioxClient.start({
  // Soniox Real-Time API parameters

  // Real-time model to use. See models: https://soniox.com/docs/stt/models
  model: 'stt-rt-preview',

  // Audio format to use and related fields.
  // See audio formats: https://soniox.com/docs/stt/rt/real-time-transcription#audio-formats
  audioFormat: 's16le',
  numChannels: 1,
  sampleRate: 16000,

  languageHints: ['en', 'es'],

  // Improve recognition of rare or specific terms with context.
  // https://soniox.com/docs/stt/concepts/context
  context: {
    general: [
        { key: 'domain', value: 'Healthcare' },
        { key: 'topic', value: 'Diabetes management consultation' },
      ],
      terms: ['Celebrex', 'Zyrtec', 'Xanax', 'Prilosec', 'Amoxicillin Clavulanate Potassium'],
  },

  enableSpeakerDiarization: true,
  enableLanguageIdentification: true,
  enableEndpointDetection: true,
  clientReferenceId: '123',
  translation: {
    type: 'one_way',
    target_language: 'en',
  },

  // All callbacks from the SonioxClient constructor can also be provided here.
  onPartialResult: (result) => {
    console.log('partial result', result.tokens);
  },
  ...

  // Audio stream configuration
  stream: customAudioStream,
  audioConstraints: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
    sampleRate: 44100,
  },
  mediaRecorderOptions: {},
});
```

##### Callbacks `onStarted`, `onFinished`, `onPartialResult`, `onError`, `onStateChange`

All callbacks which can be passed to `SonioxClient` constructor are also available in `start` method.

##### `model`

Real-time model to use. See [models](https://soniox.com/docs/stt/models).

##### `audioFormat`

Audio format to use. Using `auto` should be sufficient for microphone streams in all modern browsers.
If using custom audio streams, see [audio formats](https://soniox.com/docs/stt/rt/real-time-transcription#audio-formats).

##### `numChannels`

Required for raw audio formats. See [audio formats](https://soniox.com/docs/stt/rt/real-time-transcription#audio-formats).

##### `sampleRate`

Required for raw audio formats. See [audio formats](https://soniox.com/docs/stt/rt/real-time-transcription#audio-formats).

##### `languageHints`

See [language hints](https://soniox.com/docs/stt/concepts/language-hints).

##### `context`

See [context](https://soniox.com/docs/stt/concepts/context).

##### `enableSpeakerDiarization`

See [speaker diarization](https://soniox.com/docs/stt/concepts/speaker-diarization).

##### `enableLanguageIdentification`

See [language identification](https://soniox.com/docs/stt/concepts/language-identification).

##### `enableEndpointDetection`

See [endpoint detection](https://soniox.com/docs/stt/rt/endpoint-detection).

##### `clientReferenceId`

Optional identifier to track this request (client-defined).

##### `translation`

Translation configuration. See [real-time translation](https://soniox.com/docs/stt/rt/real-time-translation).

##### `stream`

If you don't want to transcribe audio from microphone, you can pass a `MediaStream` to the stream option. This can be useful if you want to transcribe audio from a file or a custom source.

##### `audioConstraints`

Can be used to set the properties, such as `echoCancellation` and `noiseSuppression` properties of the `MediaTrackConstraints` object. See [MDN docs for MediaTrackConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints).

##### `mediaRecorderOptions`

MediaRecorder options. See [MDN docs for MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder).

#### `stop()`

Gracefully stops transcription, waiting for the server to process all audio and return final results. For a detailed comparison, see the [stop() vs cancel()](#stop-vs-cancel) section.

#### `cancel()`

Immediately terminates the transcription and closes all resources without waiting for final results. For a detailed comparison, see the [stop() vs cancel()](#stop-vs-cancel) section.

#### `finalize()`

Trigger manual finalization. See [manual finalization](https://soniox.com/docs/stt/rt/manual-finalization).
