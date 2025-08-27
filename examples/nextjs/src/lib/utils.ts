import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fetch temporary API key from the server, so we can establish websocket connection.
// Read more on: https://soniox.com/docs/speech-to-text/guides/direct-stream#temporary-api-keys
export default async function getAPIKey() {
  const response = await fetch('/api/get-temporary-api-key', {
    method: 'POST',
  });
  const { apiKey } = await response.json();
  return apiKey;
}
