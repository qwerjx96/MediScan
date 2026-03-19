/**
 * ML Kit text recognition wrapper.
 * Falls back gracefully if the native module is unavailable (simulator / web).
 */
import type { ScanResult } from '../../types';

type TextRecognitionModule = {
  recognize: (imagePath: string) => Promise<{ text: string }>;
};

let TextRecognition: TextRecognitionModule | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  TextRecognition = require('@react-native-ml-kit/text-recognition').default as TextRecognitionModule;
} catch {
  // Native module not available (e.g., Expo Go, simulator without native build)
}

export async function runMLKitOCR(imageUri: string): Promise<string> {
  if (!TextRecognition) {
    throw new Error('ML Kit Text Recognition is not available on this device/build.');
  }
  const result = await TextRecognition.recognize(imageUri);
  return result.text;
}
