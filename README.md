# Soniox Speech-to-Text Web

Soniox Speech-to-Text Web is a Javascript client library for **real-time low-latency** automatic speech-to-text using [Soniox Speech-to-Text Service](https://soniox.com/docs/speech-to-text/get-started).

## Installation

```bash
npm install @soniox/speech-to-text-web
```

## Usage

Create new `RecordTranscribe` object:

```ts
const recordTranscribe = new RecordTranscribe({
  apiKey: '<SONIOX_API_KEY>',
});
```

And start transcription:

```ts
recordTranscribe.start({
  model: 'stt-rt-preview',

  onError: (status, message) => {
    console.error(status, message);
  },
  onPartialResult(result) {
    console.log('partial result', result.words);
  },
});
```

`RecordTranscribe` object will transcribe the audio input from microphone or a custom audio stream and return the transcribed data by calling the `onPartialResult` callback.

Stop or cancel transcription:

```ts
recordTranscribe.stop();
// or
recordTranscribe.cancel();
```

### `stop()` vs `cancel()`

The difference between `stop()` and `cancel()` is that `stop()` will wait for the transcription to finish receiving all final results, while `cancel()` will stop the transcription immediately.

For example, when user clicks the "stop" button, you can call `stop()` to wait for the transcription to finish. When you need to cancel the transcription immediately (for example, on component unmount), you can call `cancel()`.

### Additional parameters

You can pass additional model parameters to the `RecordTranscribe` constructor, such as `context` and `languageHints`. To learn more about those parameters, check the [Soniox Documentation](https://speechdev.soniox.com/docs/speech-to-text/guides).

```ts
recordTranscribe.start({
  model: 'stt-rt-preview',

  // Additional model parameters
  context: 'This is a context',
  languageHints: ['en', 'fr'],

  ...
});
```

### Buffering and temporary API keys

If you want to avoid exposing your API key to the client, you can use temporary API keys. To generate a temporary API key, you can use [temporary API key endpoint](https://soniox.com/docs/speech-to-text/api-reference/openapi/auth/create_temporary_api_key) in the Soniox API.

If you want to fetch a temporary API key only when recording starts, you can pass a function to the `apiKey` option. The function will be called when the recording starts and should return the API key.

```ts
const recordTranscribe = new RecordTranscribe({
  apiKey: async () => {
    // Call your backend to generated a temporary API key there.
    const response = await fetch('/api/get-temporary-api-key', {
      method: 'POST',
    });
    const { apiKey } = await response.json();
    return apiKey;
  },
});
```

Until the request is completed, audio data will be buffered in-memory. When the temporary API key is fetched, the buffered audio data will be sent to the server and the transcription will start.

For a full example with temporary API key generation, check the [NextJS Example](https://github.com/soniox/speech-to-text-web/tree/master/examples/nextjs).

### Callbacks

##### `onPartialResult(result: SpeechToTextAPIResponse)`

Called when the transcription returns partial results. Result contains `text` string of recognized words and a list of individual `tokens` which form the partial result.

##### `onStarted()`

Called when the transcription starts. This happens after the API key is fetched and WebSocket connection is established.

##### `onFinished()`

Called when the transcription (successfully) finishes. Wait for this callback after calling `stop()` to be sure that all final results are received.

##### `onStateChange(state: RecorderState)`

Called when the state of the transcription changes. Useful for rerendering the UI based on the state.

##### `onError(status: ErrorStatus, message: string, errorCode?: number)`

Called when the transcription encounters an error. Possible error statuses are:

- `get_user_media_failed`: If either user denied the permission to use the microphone or the browser does not support audio recording.
- `api_key_fetch_failed`: In case you passed a function to `apiKey` option and the function throws an error.
- `queue_limit_exceeded`: While waiting for the temporary API key to be fetched, the local queue is full. You can increase the queue size by setting `bufferQueueSize` option.
- `media_recorder_error`: An error occurred while recording the audio.
- `api_error`: Error returned by the Soniox API. In this case, the `errorCode` property contains the HTTP status code equivalent to the error.
- `websocket_error`: WebSocket error.

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
recordTranscribe.start({
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

- Minimal example, a single HTML file: [examples/html](https://github.com/soniox/speech-to-text-web/tree/master/examples/html)
- Vanilla Javascript: [examples/javascript](https://github.com/soniox/speech-to-text-web/tree/master/examples/javascript)
- A bit more advanced example in Next.js with temporary API key generation: [examples/nextjs](https://github.com/soniox/speech-to-text-web/tree/master/examples/nextjs)
