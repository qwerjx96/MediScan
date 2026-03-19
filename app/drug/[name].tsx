import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDrugInfo } from '@/hooks/useDrugInfo';
import { useCabinetStore } from '@/stores/cabinetStore';
import { Colors } from '@/constants/colors';
import { MedicalDisclaimer } from '@/components/drug/MedicalDisclaimer';
import { DrugInfoCardSkeleton } from '@/components/drug/DrugInfoCardSkeleton';
import { BrandNameSection } from '@/components/drug/BrandNameSection';

export default function DrugInfoScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { data, isLoading, isError } = useDrugInfo(name ?? null);

  const alreadyInCabinet = useCabinetStore((s) =>
    s.medications.some((m) => m.inn === name)
  );

  if (isLoading) return <DrugInfoCardSkeleton />;

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Could not load drug information. Check your connection and try again.
        </Text>
        <Pressable style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.innName}>{data.inn}</Text>
        <Text style={styles.sourceLabel}>Source: {data.source}</Text>
      </View>

      <MedicalDisclaimer />

      {/* Brand Names */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Brand Names</Text>
        <BrandNameSection brandNames={data.brandNames} />
      </View>

      {/* Indications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Indications</Text>
        <Text style={styles.bodyText}>{data.indications}</Text>
      </View>

      {/* Side Effects */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Side Effects</Text>
        <Text style={styles.bodyText}>{data.sideEffects}</Text>
      </View>

      {/* Approval Status */}
      {Object.keys(data.approvalStatus).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Approval Status</Text>
          {Object.entries(data.approvalStatus).map(([country, status]) => (
            <View key={country} style={styles.approvalRow}>
              <Text style={styles.approvalCountry}>{country}</Text>
              <Text style={styles.approvalStatus}>{status}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Add to Cabinet CTA */}
      {!alreadyInCabinet && (
        <Pressable
          style={styles.addBtn}
          onPress={() =>
            router.push({
              pathname: '/medication/add',
              params: { inn: data.inn },
            })
          }
        >
          <Text style={styles.addBtnText}>Add to My Cabinet</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 48 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.clinicalBlue,
    padding: 24,
    paddingTop: 16,
    marginBottom: 12,
  },
  innName: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'capitalize',
  },
  sourceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.clinicalBlue,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bodyText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  approvalCountry: { fontWeight: '600', color: Colors.textPrimary },
  approvalStatus: { color: Colors.success },
  addBtn: {
    backgroundColor: Colors.clinicalBlue,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  errorText: { color: Colors.textSecondary, textAlign: 'center', fontSize: 15 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: Colors.clinicalBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: { color: Colors.white, fontWeight: '600' },
});
