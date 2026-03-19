import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useCabinetStore } from '@/stores/cabinetStore';
import { getDoseLogsForDate } from '@/db/doseLog';
import { Colors } from '@/constants/colors';
import type { DoseLog } from '@/types';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ScheduleScreen() {
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const medications = useCabinetStore((s) => s.medications);

  useEffect(() => {
    getDoseLogsForDate(todayISO())
      .then(setLogs)
      .catch(() => {});
  }, []);

  const getMedName = (medId: string) => {
    const med = medications.find((m) => m.id === medId);
    return med ? (med.brandName ?? med.inn) : medId;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Schedule</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No doses scheduled today</Text>
          <Text style={styles.emptySubtitle}>
            Add medications to your cabinet to see your daily schedule here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.doseCard, item.status === 'taken' && styles.doseCardTaken]}>
              <View style={styles.doseTime}>
                <Text style={styles.doseTimeText}>{formatTime(item.scheduledAt)}</Text>
              </View>
              <View style={styles.doseInfo}>
                <Text style={styles.doseMedName}>{getMedName(item.medicationId)}</Text>
                <Text style={[styles.doseStatus, item.status === 'taken' && styles.doseStatusTaken]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
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
  date: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  list: { padding: 16, gap: 10 },
  doseCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    flexDirection: 'row',
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  doseCardTaken: { opacity: 0.6 },
  doseTime: {
    backgroundColor: Colors.clinicalBlueLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doseTimeText: { color: Colors.clinicalBlue, fontWeight: '700', fontSize: 14 },
  doseInfo: { flex: 1, justifyContent: 'center' },
  doseMedName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, textTransform: 'capitalize' },
  doseStatus: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  doseStatusTaken: { color: Colors.success },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
