/**
 * Aggregates results from PubChem, ChEMBL, Wikidata, and a regional source
 * into a single DrugInfo object. Sources are fetched in parallel; later
 * sources fill in missing fields rather than overwriting.
 */
import type { DrugInfo } from '../../types';
import { fetchPubChem } from './pubchem';
import { fetchChEMBL } from './chembl';
import { fetchWikidata } from './wikidata';
import { fetchRegional } from './regional';

function merge(
  base: Partial<DrugInfo>,
  overlay: Partial<DrugInfo> | null
): Partial<DrugInfo> {
  if (!overlay) return base;
  return {
    ...base,
    brandNames: [
      ...new Set([...(base.brandNames ?? []), ...(overlay.brandNames ?? [])]),
    ],
    indications: base.indications || overlay.indications || '',
    sideEffects: base.sideEffects || overlay.sideEffects || '',
    approvalStatus: { ...(base.approvalStatus ?? {}), ...(overlay.approvalStatus ?? {}) },
    source: base.source ?? overlay.source ?? '',
  };
}

export async function fetchDrugInfo(
  inn: string,
  region: string
): Promise<DrugInfo> {
  const [pubchem, chembl, wikidata, regional] = await Promise.allSettled([
    fetchPubChem(inn),
    fetchChEMBL(inn),
    fetchWikidata(inn),
    fetchRegional(inn, region),
  ]);

  let result: Partial<DrugInfo> = { inn, brandNames: [], approvalStatus: {} };

  for (const settled of [pubchem, chembl, wikidata, regional]) {
    if (settled.status === 'fulfilled' && settled.value) {
      result = merge(result, settled.value);
    }
  }

  return {
    inn: result.inn ?? inn,
    brandNames: result.brandNames ?? [],
    indications: result.indications ?? 'No indications data available.',
    sideEffects: result.sideEffects ?? 'No side-effect data available.',
    approvalStatus: result.approvalStatus ?? {},
    source: result.source ?? 'Multiple sources',
  };
}
