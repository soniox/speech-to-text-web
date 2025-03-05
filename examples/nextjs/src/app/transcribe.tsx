'use client';

import { Button } from '@/components/button';
import { isActiveState, RecorderState, RecordTranscribe } from '@soniox/speech-to-text-web';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function TranscribeMicrophone() {
  const { state, text, startTranscription, stopTranscription } = useTranscribe();

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Show current transcription */}
      <div className="rounded-lg border border-primary px-4 py-2 min-h-32 w-full">{text}</div>

      {state === 'Error' ? <div className="text-red-500">Error occurred</div> : null}

      {isActiveState(state) ? (
        <Button onClick={stopTranscription} disabled={state === 'FinishingProcessing'}>
          ✋ Stop transcription
        </Button>
      ) : (
        <Button onClick={startTranscription}>🎙️ Start transcription</Button>
      )}
    </div>
  );
}

function useTranscribe() {
  // Store RecordTranscribe instance in ref
  const recordTranscribe = useRef<RecordTranscribe>(null);

  // https://react.dev/reference/react/useRef#avoiding-recreating-the-ref-contents
  if (recordTranscribe.current == null) {
    recordTranscribe.current = new RecordTranscribe({
      webSocketUri: `${process.env.NEXT_PUBLIC_SONIOX_WSS_HOST_SPEECH_TO_TEXT}/transcribe-websocket`,

      // We could simply pass the API key directly, but we don't want to expose it to the client.
      // Instead, we generate a temporary API key and only pass ApiKeyGetter to the RecordTranscribe instance.
      // This allows us to start buffering requests even before API key is obtained and connection is established.
      apiKey: async () => {
        const response = await fetch('/api/get-temporary-api-key', {
          method: 'POST',
        });
        const { apiKey } = await response.json();
        return apiKey;
      },
    });
  }

  // On every state change, local state is also updated to render the latest state to the user
  const [state, setState] = useState<RecorderState>('Init');
  // Transcribed text
  const [text, setText] = useState<string>('');

  const startTranscription = useCallback(async () => {
    setText('');

    // Start the transcription.
    recordTranscribe.current?.start({
      model: 'stt-rt-preview',

      // Callbacks
      onFinished: () => {
        console.log('transcription finished');
      },
      onStarted: () => {
        console.log('transcription started');
      },
      onError: (status, message, code) => {
        console.error(status, message, code);
      },
      // Update local state to show current recorder state
      onStateChange({ newState }) {
        setState(newState);
      },
      // Add new words to the transcription
      // (we keep the final words and remove the non-final words)
      onPartialResult(result) {
        setText((text) => text + result.text);
      },
    });
  }, []);

  const stopTranscription = useCallback(() => {
    recordTranscribe.current?.stop();
  }, []);

  useEffect(() => {
    // Stop the transcription when the component unmounts
    return () => {
      recordTranscribe.current?.cancel();
    };
  }, []);

  return {
    startTranscription,
    stopTranscription,
    state,
    text,
  };
}
