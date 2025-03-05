import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Soniox Speech-to-Text Example',
  description: 'Example of using Soniox Speech-to-Text Web with Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
