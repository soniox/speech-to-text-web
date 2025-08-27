# Soniox Speech-to-Text Example in Next.js

This minimal example shows how to use Soniox Speech-to-Text Web in a Next.js application.
If you want to see a more advanced example, check the [React example from soniox_examples repository](https://github.com/soniox/soniox_examples/tree/master/speech_to_text/apps/react).

## Getting Started

First install dependencies:

```bash
npm install
```

Prepare your `.env` file:

```bash
cp .env.example .env
```

Edit the `.env` file and add your Soniox API key.

```bash
SONIOX_API_KEY=<SONIOX_API_KEY>
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Transcribing microphone stream

To transcribe a microphone stream, you can use the `SonioxClient` component. See the `Transcribe` component in `src/app/transcribe.tsx` for a full example.

```ts
const sonioxClient = new SonioxClient({
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
sonioxClient.start({
  model: 'stt-rt-preview',
});
```

## Live translation

To enable live translation, you can pass a `TranslationConfig` object to the `start` method.

```ts
sonioxClient.start({
  model: 'stt-rt-preview',

  // Translate everything to English
  translation: {
    type: 'one_way',
    target_language: 'en',
  },
});
```

Full example can be found in `src/app/translate-to.tsx`.

You can enable two-way translation in a similar way:

```ts
sonioxClient.start({
  model: 'stt-rt-preview',

  // Translate everything to German
  translation: {
    type: 'two_way',
    language_a: 'en',
    language_b: 'de',
  },
});
```

Full example can be found in `src/app/translate-between.tsx`.

You can learn more about translation concepts [here](https://soniox.com/docs/stt/rt/real-time-translation).

## Why Next.js and not pure React?

This is a complete example which shows best practice on how to use temporary API keys (to not expose API keys to the client). For that, we use Next.js API routes (but could as well use any other backend, see a [FastAPI example](https://github.com/soniox/soniox_examples/tree/master/speech_to_text/apps/server)).
