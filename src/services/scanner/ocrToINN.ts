/**
 * NLM RxImage API — maps raw OCR text to an RxNorm INN.
 * Docs: https://rximage.nlm.nih.gov/docs/
 */

const NLM_BASE = 'https://rximage.nlm.nih.gov/api/rximage/1/rxnav';

interface RxNavResult {
  nlmRxImages: Array<{
    name?: string;
    rxcui?: string;
  }>;
  replyStatus: { success: boolean };
}

export async function ocrToINN(rawText: string): Promise<string | null> {
  // Extract the longest word as the most likely active ingredient name
  const words = rawText
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ''))
    .filter((w) => w.length > 3)
    .sort((a, b) => b.length - a.length);

  for (const word of words.slice(0, 3)) {
    try {
      const url = `${NLM_BASE}?name=${encodeURIComponent(word)}&resolution=150`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;

      const data = (await res.json()) as RxNavResult;
      if (data.replyStatus?.success && data.nlmRxImages?.length > 0) {
        const name = data.nlmRxImages[0].name;
        if (name) return name.toLowerCase();
      }
    } catch {
      continue;
    }
  }

  return null;
}
