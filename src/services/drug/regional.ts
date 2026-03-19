/**
 * Regional drug approval connectors:
 *   US  → OpenFDA
 *   EU  → EMA FHIR
 *   GB  → NHS dm+d (OpenFDA fallback)
 *   MY / IN / AU → Wikidata fallback (already covered)
 */
import type { DrugInfo } from '../../types';

// ─── OpenFDA ──────────────────────────────────────────────────────────────────

async function fetchOpenFDA(inn: string): Promise<Partial<DrugInfo> | null> {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(inn)}"&limit=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      results: Array<{
        openfda?: { brand_name?: string[] };
        indications_and_usage?: string[];
        adverse_reactions?: string[];
      }>;
    };

    const result = data.results?.[0];
    if (!result) return null;

    return {
      inn,
      brandNames: result.openfda?.brand_name ?? [],
      indications: result.indications_and_usage?.[0] ?? '',
      sideEffects: result.adverse_reactions?.[0] ?? '',
      approvalStatus: { US: 'Approved' },
      source: 'OpenFDA',
    };
  } catch {
    return null;
  }
}

// ─── EMA (EU) ─────────────────────────────────────────────────────────────────

async function fetchEMA(inn: string): Promise<Partial<DrugInfo> | null> {
  try {
    const url = `https://www.ema.europa.eu/en/search/search?search_api_views_fulltext=${encodeURIComponent(inn)}&f%5B0%5D=field_ema_web_content_sub_category%3A14647&format=json`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;

    // EMA returns a list; mark as EU-approved if any result found
    const data = (await res.json()) as { count?: number };
    if ((data.count ?? 0) > 0) {
      return { inn, approvalStatus: { EU: 'Approved' }, source: 'EMA' };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── NHS dm+d (GB) ────────────────────────────────────────────────────────────

async function fetchNHS(inn: string): Promise<Partial<DrugInfo> | null> {
  try {
    const url = `https://dmd.medicines.org.uk/api/v1/dtps/?q=${encodeURIComponent(inn)}&format=json`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;

    const data = (await res.json()) as { count?: number };
    if ((data.count ?? 0) > 0) {
      return { inn, approvalStatus: { GB: 'Approved' }, source: 'NHS dm+d' };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function fetchRegional(
  inn: string,
  region: string
): Promise<Partial<DrugInfo> | null> {
  switch (region) {
    case 'US':
      return fetchOpenFDA(inn);
    case 'GB':
      return fetchNHS(inn) ?? fetchOpenFDA(inn);
    default:
      // EU / AU / MY / IN — use EMA as best available REST source
      return fetchEMA(inn);
  }
}
