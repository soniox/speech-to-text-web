'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';

const Transcribe = dynamic(() => import('./transcribe'), { ssr: false });

export default function Home() {
  return (
    <main className="flex flex-row items-center justify-center min-h-screen gap-4 p-8 pb-24">
      <div className="flex flex-col gap-4 w-full max-w-xl">
        <Image src="/soniox_logo.svg" alt="Soniox Logo" width={180} height={38} priority />

        <Transcribe />
      </div>
    </main>
  );
}
