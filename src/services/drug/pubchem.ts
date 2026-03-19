/**
 * PubChem PUG REST — generic name, synonyms (brand names).
 * Docs: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
 */
import type { DrugInfo } from '../../types';

const BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`PubChem ${res.status}: ${url}`);
  return res.json();
}

export async function fetchPubChem(inn: string): Promise<Partial<DrugInfo> | null> {
  try {
    // 1. Resolve CID by name
    const cidRes = (await fetchJson(
      `${BASE}/compound/name/${encodeURIComponent(inn)}/cids/JSON`
    )) as { IdentifierList: { CID: number[] } };

    const cid = cidRes.IdentifierList?.CID?.[0];
    if (!cid) return null;

    // 2. Fetch synonyms for brand names
    const synRes = (await fetchJson(
      `${BASE}/compound/cid/${cid}/synonyms/JSON`
    )) as { InformationList: { Information: Array<{ Synonym: string[] }> } };

    const allSynonyms: string[] = synRes.InformationList?.Information?.[0]?.Synonym ?? [];

    // 3. Fetch description for indications
    let indications = '';
    try {
      const descRes = (await fetchJson(
        `${BASE}/compound/cid/${cid}/description/JSON`
      )) as {
        InformationList: {
          Information: Array<{ Description?: string; DescriptionSourceName?: string }>;
        };
      };
      indications =
        descRes.InformationList?.Information?.find((i) => i.Description)
          ?.Description ?? '';
    } catch {
      // description endpoint is optional
    }

    // Filter synonyms — keep all-caps or Title Case short entries as brand names
    const brandNames = allSynonyms
      .filter(
        (s) =>
          s !== inn &&
          s.length < 40 &&
          /^[A-Z]/.test(s) &&
          !/^\d/.test(s)
      )
      .slice(0, 10);

    return {
      inn,
      brandNames,
      indications,
      source: 'PubChem',
    };
  } catch {
    return null;
  }
}
