/**
 * ChEMBL REST API — side effects (adverse events) and additional indications.
 * Docs: https://www.ebi.ac.uk/chembl/api/data/
 */
import type { DrugInfo } from '../../types';

const BASE = 'https://www.ebi.ac.uk/chembl/api/data';

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`ChEMBL ${res.status}`);
  return res.json();
}

export async function fetchChEMBL(inn: string): Promise<Partial<DrugInfo> | null> {
  try {
    // Search molecule by name
    const searchRes = (await fetchJson(
      `${BASE}/molecule?pref_name__iexact=${encodeURIComponent(inn)}&format=json&limit=1`
    )) as {
      molecules: Array<{ molecule_chembl_id: string }>;
    };

    const chemblId = searchRes.molecules?.[0]?.molecule_chembl_id;
    if (!chemblId) return null;

    // Fetch drug indications
    let indications = '';
    try {
      const indRes = (await fetchJson(
        `${BASE}/drug_indication?molecule_chembl_id=${chemblId}&format=json&limit=10`
      )) as {
        drug_indications: Array<{ indication_refs: unknown[]; efo_term?: string }>;
      };
      const terms = indRes.drug_indications
        ?.map((d) => d.efo_term)
        .filter(Boolean)
        .join(', ');
      if (terms) indications = `Indications: ${terms}`;
    } catch {
      // optional
    }

    // Fetch adverse events (side effects)
    let sideEffects = '';
    try {
      const aeRes = (await fetchJson(
        `${BASE}/drug_warning?molecule_chembl_id=${chemblId}&format=json&limit=20`
      )) as {
        drug_warnings: Array<{ description?: string }>;
      };
      const warnings = aeRes.drug_warnings
        ?.map((w) => w.description)
        .filter(Boolean)
        .slice(0, 5)
        .join('; ');
      if (warnings) sideEffects = warnings;
    } catch {
      // optional
    }

    return { inn, indications, sideEffects, source: 'ChEMBL' };
  } catch {
    return null;
  }
}
