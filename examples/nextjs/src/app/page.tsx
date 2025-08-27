'use client';

import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState } from 'react';

const Transcribe = dynamic(() => import('./transcribe'), { ssr: false });
const TranslateTo = dynamic(() => import('./translate-to'), { ssr: false });
const TranslateBetween = dynamic(() => import('./translate-between'), { ssr: false });

export default function Home() {
  const [mode, setMode] = useState<'transcribe' | 'translate-one-way' | 'translate-two-way'>('transcribe');

  return (
    <main className="flex flex-row items-center justify-center min-h-screen gap-4 p-8 pb-24">
      <div className="flex flex-col gap-4 w-full max-w-xl">
        <Image src="/soniox_logo.svg" alt="Soniox Logo" width={180} height={38} priority />

        <div className="flex flex-row gap-4">
          <button
            className={cn(
              'rounded-lg border border-primary px-4 py-2 flex-1',
              mode === 'transcribe' ? 'bg-primary text-white' : 'bg-white text-primary',
            )}
            onClick={() => setMode('transcribe')}>
            Transcribe
          </button>
          <button
            className={cn(
              'rounded-lg border border-primary px-4 py-2 flex-1',
              mode === 'translate-one-way' ? 'bg-primary text-white' : 'bg-white text-primary',
            )}
            onClick={() => setMode('translate-one-way')}>
            Translate to
          </button>
          <button
            className={cn(
              'rounded-lg border border-primary px-4 py-2 flex-1',
              mode === 'translate-two-way' ? 'bg-primary text-white' : 'bg-white text-primary',
            )}
            onClick={() => setMode('translate-two-way')}>
            Translate between
          </button>
        </div>

        {mode === 'transcribe' ? <Transcribe /> : null}
        {mode === 'translate-one-way' ? <TranslateTo /> : null}
        {mode === 'translate-two-way' ? <TranslateBetween /> : null}
      </div>
    </main>
  );
}
