/**
 * Gemini Flash Vision fallback — sends the image to Google Gemini 1.5 Flash
 * and asks it to identify the INN of the medicine.
 *
 * Requires EXPO_PUBLIC_GEMINI_API_KEY to be set in .env.local
 * User must explicitly consent before this service is called.
 */
import * as FileSystem from 'expo-file-system';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function identifyWithGemini(imageUri: string): Promise<string | null> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set. Cannot call Gemini Vision.');
  }

  // Read image as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const body = {
    contents: [
      {
        parts: [
          {
            text:
              'This is a photo of a medicine package or label. ' +
              'What is the INN (International Non-proprietary Name / generic name) of the active ingredient? ' +
              'Reply with ONLY the INN in lowercase, nothing else. ' +
              'If you cannot identify it, reply with the word "unknown".',
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64,
            },
          },
        ],
      },
    ],
  };

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}`);
  }

  const data = (await res.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
  if (!raw || raw === 'unknown') return null;
  return raw;
}
