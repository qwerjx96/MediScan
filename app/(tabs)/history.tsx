import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useCabinetStore } from '@/stores/cabinetStore';
import { getDoseLogsForMedication } from '@/db/doseLog';
import { Colors } from '@/constants/colors';
import type { DoseLog } from '@/types';

export default function HistoryScreen() {
  const medications = useCabinetStore((s) => s.medications);
  const [logs, setLogs] = useState<DoseLog[]>([]);

  useEffect(() => {
    (async () => {
      const all: DoseLog[] = [];
      for (const med of medications) {
        const medLogs = await getDoseLogsForMedication(med.id, 10);
        all.push(...medLogs);
      }
      all.sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );
      setLogs(all.slice(0, 50));
    })();
  }, [medications]);

  const getMedName = (medId: string) => {
    const med = medications.find((m) => m.id === medId);
    return med ? (med.brandName ?? med.inn) : medId;
  };

  const STATUS_COLOR: Record<string, string> = {
    taken: Colors.success,
    missed: Colors.danger,
    skipped: Colors.textSecondary,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dose History</Text>
      </View>

      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySubtitle}>
            Your dose history will appear here once you start tracking medications.
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.logRow}>
              <View style={styles.logLeft}>
                <Text style={styles.logMedName}>{getMedName(item.medicationId)}</Text>
                <Text style={styles.logDate}>
                  {new Date(item.scheduledAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={[styles.logStatus, { color: STATUS_COLOR[item.status] }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  list: { padding: 16 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logLeft: { flex: 1 },
  logMedName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, textTransform: 'capitalize' },
  logDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  logStatus: { fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
