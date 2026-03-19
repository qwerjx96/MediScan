/**
 * Full scanner identification pipeline:
 *   1. ML Kit OCR → raw text
 *   2. NLM RxImage → INN candidate (high confidence)
 *   3. Gemini Flash Vision → INN candidate (medium confidence, requires consent)
 *   4. Return null → user falls back to manual search
 */
import type { ScanResult } from '../../types';
import { runMLKitOCR } from './mlkitOCR';
import { ocrToINN } from './ocrToINN';
import { identifyWithGemini } from './geminiVision';

export interface PipelineOptions {
  geminiConsented: boolean;
  onStep?: (step: string) => void;
}

export async function runScannerPipeline(
  imageUri: string,
  options: PipelineOptions
): Promise<ScanResult> {
  const { geminiConsented, onStep } = options;

  // Step 1: OCR
  onStep?.('ocr');
  let rawText = '';
  try {
    rawText = await runMLKitOCR(imageUri);
  } catch {
    rawText = '';
  }

  // Step 2: NLM RxImage
  if (rawText) {
    onStep?.('nlm');
    try {
      const inn = await ocrToINN(rawText);
      if (inn) {
        return { rawText, candidateINN: inn, confidence: 'high', method: 'ocr+nlm' };
      }
    } catch {
      // continue to gemini
    }
  }

  // Step 3: Gemini Vision (requires explicit user consent)
  if (geminiConsented) {
    onStep?.('gemini');
    try {
      const inn = await identifyWithGemini(imageUri);
      if (inn) {
        return { rawText, candidateINN: inn, confidence: 'medium', method: 'gemini' };
      }
    } catch {
      // continue to manual
    }
  }

  // Step 4: Manual fallback
  return { rawText, candidateINN: null, confidence: 'low', method: 'manual' };
}
