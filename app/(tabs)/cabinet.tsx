import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCabinetStore } from '@/stores/cabinetStore';
import { Colors } from '@/constants/colors';
import { FREQUENCY_LABELS } from '@/constants/frequencies';
import type { Medication } from '@/types';

function MedicationCard({ med }: { med: Medication }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/medication/[id]', params: { id: med.id } })}
    >
      <View style={[styles.colorBar, { backgroundColor: med.color }]} />
      <View style={styles.cardBody}>
        <Text style={styles.medName} numberOfLines={1}>
          {med.brandName ?? med.inn}
        </Text>
        {med.brandName && (
          <Text style={styles.medInn}>{med.inn}</Text>
        )}
        <Text style={styles.medDetails}>
          {med.dosage} · {FREQUENCY_LABELS[med.frequency]}
        </Text>
      </View>
    </Pressable>
  );
}

export default function CabinetScreen() {
  const router = useRouter();
  const medications = useCabinetStore((s) => s.medications);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cabinet</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/medication/add')}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      {medications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>No medications yet</Text>
          <Text style={styles.emptySubtitle}>
            Scan a medicine label or tap + Add to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <MedicationCard med={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.clinicalBlue,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorBar: { width: 6 },
  cardBody: { padding: 14, flex: 1 },
  medName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, textTransform: 'capitalize' },
  medInn: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  medDetails: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
