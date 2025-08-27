'use client';

import { Button } from '@/components/button';
import useTranscribe from '@/lib/useTranscribe';
import getAPIKey from '@/lib/utils';
import { isActiveState } from '@soniox/speech-to-text-web';

const language_a = 'en';
const language_b = 'es';

export default function TranslateBetween() {
  const { state, finalTokens, nonFinalTokens, startTranscription, stopTranscription } = useTranscribe({
    apiKey: getAPIKey,
    // Translate everything from English to Spanish and from Spanish to English
    translationConfig: {
      type: 'two_way',
      language_a,
      language_b,
    },
  });

  const allTokens = [...finalTokens, ...nonFinalTokens];

  // If any of the languages that are not 'a' or 'b', we show it in both boxes.
  const languageATokens = allTokens.filter((token) => token.language !== language_b);
  const languageBTokens = allTokens.filter((token) => token.language !== language_a);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Language a */}
      <div>English</div>
      <div className="rounded-lg border border-primary px-4 py-2 min-h-32 w-full">
        {languageATokens.map((token, idx) => {
          return (
            <span key={idx} className={token.is_final ? 'text-black' : 'text-gray-500'}>
              {token.text}
            </span>
          );
        })}
      </div>

      {/* Language b */}
      <div>Spanish</div>
      <div className="rounded-lg border border-primary px-4 py-2 min-h-32 w-full">
        {languageBTokens.map((token, idx) => {
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
