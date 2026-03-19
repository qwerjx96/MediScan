import { useQuery } from '@tanstack/react-query';
import { fetchDrugInfo } from '../services/drug/aggregator';
import { useAppStore } from '../stores/appStore';
import type { DrugInfo } from '../types';

export function useDrugInfo(inn: string | null) {
  const userRegion = useAppStore((s) => s.userRegion);

  return useQuery<DrugInfo>({
    queryKey: ['drug', inn, userRegion],
    queryFn: () => fetchDrugInfo(inn!, userRegion),
    enabled: !!inn && inn.length > 1,
    staleTime: 1000 * 60 * 60 * 24, // 24 h — drug data rarely changes
    gcTime: 1000 * 60 * 60 * 48,    // keep in cache 48 h
  });
}
