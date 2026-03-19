/**
 * Wikidata SPARQL — brand names by region and approval status.
 */
import type { DrugInfo } from '../../types';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

const QUERY = (inn: string) => `
SELECT DISTINCT ?brandName ?countryCode WHERE {
  ?drug wdt:P31 wd:Q12140 ;
        wdt:P1990 ?brandName .
  OPTIONAL {
    ?drug wdt:P17 ?country .
    ?country wdt:P297 ?countryCode .
  }
  ?drug rdfs:label ?label .
  FILTER(LCASE(?label) = "${inn.toLowerCase()}"@en)
}
LIMIT 40
`;

export async function fetchWikidata(inn: string): Promise<Partial<DrugInfo> | null> {
  try {
    const url =
      `${SPARQL_ENDPOINT}?query=${encodeURIComponent(QUERY(inn))}&format=json`;

    const res = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent': 'MediScan/1.0 (mobile app)',
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      results: {
        bindings: Array<{
          brandName?: { value: string };
          countryCode?: { value: string };
        }>;
      };
    };

    const bindings = data.results?.bindings ?? [];
    const brandNames = [
      ...new Set(bindings.map((b) => b.brandName?.value).filter(Boolean)),
    ] as string[];

    return { inn, brandNames, source: 'Wikidata' };
  } catch {
    return null;
  }
}
