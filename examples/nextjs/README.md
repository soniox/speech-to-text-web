# Soniox Speech-to-Text Example in Next.js

This example shows how to use Soniox Speech-to-Text Web in a Next.js application.

## Getting Started

First install dependencies:

```bash
npm install
```

Prepare your `.env` file:

```bash
cp .env.example .env
```

Edit the `.env` file and add your Soniox API key. You can safely omit the `SONIOX_API_HOST` and `NEXT_PUBLIC_SONIOX_WSS_HOST_SPEECH_TO_TEXT` variables as they will default to the correct values.

```bash
SONIOX_API_KEY=<SONIOX_API_KEY>
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Transcribing microphone stream

To transcribe a microphone stream, you can use the `RecordTranscribe` component. See the `Transcribe` component in `src/app/transcribe.tsx` for a full example.

```ts
const transcribe = new RecordTranscribe({
  apiKey: '<SONIOX_API_KEY>',

  // Callbacks
  onStarted: () => {
    console.log('transcription started');
  },
  onError: (status, message) => {
    console.error(status, message);
  },
  onStateChange({ newState }) {
    console.log('state changed to', newState);
  },
  onPartialResult(result) {
    console.log('partial result', result.words);
  },
});
transcribe.start({
  model: 'stt-rt-preview',
});
```

## Why Next.js and not pure React?

This is a complete example which shows best practice on how to use temporary API keys (to not expose API keys to the client). For that, we use Next.js API routes (but could as well use any other backend).
