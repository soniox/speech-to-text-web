'use client';

import { Button } from '@/components/button';
import useTranscribe from '@/lib/useTranscribe';
import getAPIKey from '@/lib/utils';
import { isActiveState } from '@soniox/speech-to-text-web';

export default function TranslateTo() {
  const { state, finalTokens, nonFinalTokens, startTranscription, stopTranscription } = useTranscribe({
    apiKey: getAPIKey,
    // Translate everything to Spanish
    translationConfig: {
      type: 'one_way',
      target_language: 'es',
    },
  });

  const allTokens = [...finalTokens, ...nonFinalTokens];

  const transcriptionTokens = allTokens.filter((token) => token.translation_status !== 'translation');
  const translationTokens = allTokens.filter((token) => token.translation_status === 'translation');

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Show current transcription */}
      <div>Transcription</div>
      <div className="rounded-lg border border-primary px-4 py-2 min-h-32 w-full">
        {transcriptionTokens.map((token, idx) => {
          return (
            <span key={idx} className={token.is_final ? 'text-black' : 'text-gray-500'}>
              {token.text}
            </span>
          );
        })}
      </div>

      {/* Show translation */}
      <div>Translation</div>
      <div className="rounded-lg border border-primary px-4 py-2 min-h-32 w-full">
        {translationTokens.map((token, idx) => {
          return (
            <span key={idx} className={token.is_final ? 'text-black' : 'text-gray-500'}>
              {token.text}
            </span>
          );
        })}
      </div>

      {state === 'Error' ? <div className="text-red-500">Error occurred</div> : null}

      {isActiveState(state) ? (
        <Button onClick={stopTranscription} disabled={state === 'FinishingProcessing'}>
          ✋ Stop translation
        </Button>
      ) : (
        <Button onClick={startTranscription}>🎙️ Start translation</Button>
      )}
    </div>
  );
}
