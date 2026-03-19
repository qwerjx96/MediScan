import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCabinetStore } from '@/stores/cabinetStore';
import { useScheduleStore } from '@/stores/scheduleStore';
import {
  scheduleNotificationsForMedication,
  cancelNotificationsForMedication,
  requestNotificationPermission,
} from '@/services/notifications/scheduler';
import { Colors } from '@/constants/colors';
import { FREQUENCY_LABELS, FREQUENCY_DOSE_COUNT } from '@/constants/frequencies';
import type { FrequencyType } from '@/types';

const FREQUENCIES: FrequencyType[] = [
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'four_times_daily',
  'weekly',
  'as_needed',
];

const PILL_COLORS = ['#1A6FB4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function EditMedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const getMedication = useCabinetStore((s) => s.getMedication);
  const updateMedication = useCabinetStore((s) => s.updateMedication);
  const removeMedication = useCabinetStore((s) => s.removeMedication);
  const setNotificationIds = useScheduleStore((s) => s.setNotificationIds);
  const clearNotificationIds = useScheduleStore((s) => s.clearNotificationIds);
  const existingIds = useScheduleStore((s) => s.notificationIds[id] ?? []);

  const med = getMedication(id);

  const [brandName, setBrandName] = useState(med?.brandName ?? '');
  const [dosage, setDosage] = useState(med?.dosage ?? '');
  const [frequency, setFrequency] = useState<FrequencyType>(med?.frequency ?? 'once_daily');
  const [times, setTimes] = useState<string[]>(med?.times ?? ['08:00']);
  const [color, setColor] = useState(med?.color ?? PILL_COLORS[0]);
  const [notes, setNotes] = useState(med?.notes ?? '');
  const [saving, setSaving] = useState(false);

  if (!med) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Medication not found.</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!dosage.trim()) {
      Alert.alert('Required', 'Please enter the dosage.');
      return;
    }
    setSaving(true);
    try {
      // Cancel old notifications
      if (existingIds.length > 0) {
        await cancelNotificationsForMedication(existingIds);
        clearNotificationIds(id);
      }

      const updated = { ...med, brandName: brandName.trim() || undefined, dosage: dosage.trim(), frequency, times, color, notes: notes.trim() || undefined };
      updateMedication(id, updated);

      if (frequency !== 'as_needed') {
        const granted = await requestNotificationPermission();
        if (granted) {
          const ids = await scheduleNotificationsForMedication(updated);
          setNotificationIds(id, ids);
        }
      }

      router.back();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Remove Medication', `Remove ${med.brandName ?? med.inn} from your cabinet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (existingIds.length > 0) await cancelNotificationsForMedication(existingIds);
          clearNotificationIds(id);
          removeMedication(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.innLabel}>{med.inn}</Text>

      <Text style={styles.label}>Brand Name (optional)</Text>
      <TextInput style={styles.input} value={brandName} onChangeText={setBrandName} placeholder="e.g. Glucophage" placeholderTextColor={Colors.textSecondary} />

      <Text style={styles.label}>Dosage *</Text>
      <TextInput style={styles.input} value={dosage} onChangeText={setDosage} placeholder="e.g. 500mg" placeholderTextColor={Colors.textSecondary} />

      <Text style={styles.label}>Frequency</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.freqRow}>
        {FREQUENCIES.map((f) => (
          <Pressable key={f} onPress={() => { setFrequency(f); }} style={[styles.freqChip, frequency === f && styles.freqChipActive]}>
            <Text style={[styles.freqChipText, frequency === f && styles.freqChipTextActive]}>{FREQUENCY_LABELS[f]}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Reminder Times</Text>
      {times.map((t, idx) => (
        <TextInput key={idx} style={[styles.input, { marginBottom: 8 }]} value={t}
          onChangeText={(v) => { const next = [...times]; next[idx] = v; setTimes(next); }}
          placeholder="HH:MM" placeholderTextColor={Colors.textSecondary} />
      ))}

      <Text style={styles.label}>Pill Color</Text>
      <View style={styles.colorRow}>
        {PILL_COLORS.map((c) => (
          <Pressable key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]} />
        ))}
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput style={[styles.input, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Any additional notes..." placeholderTextColor={Colors.textSecondary} multiline numberOfLines={3} />

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
      </Pressable>

      <Pressable style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Remove from Cabinet</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.textSecondary, fontSize: 15 },
  innLabel: { fontSize: 22, fontWeight: '700', color: Colors.clinicalBlue, textTransform: 'capitalize', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.textPrimary },
  notesInput: { height: 80, textAlignVertical: 'top' },
  freqRow: { flexDirection: 'row', marginBottom: 4 },
  freqChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.white },
  freqChipActive: { backgroundColor: Colors.clinicalBlue, borderColor: Colors.clinicalBlue },
  freqChipText: { color: Colors.textSecondary, fontSize: 13 },
  freqChipTextActive: { color: Colors.white, fontWeight: '600' },
  colorRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.clinicalBlue, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  deleteBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: Colors.danger },
  deleteBtnText: { color: Colors.danger, fontWeight: '600', fontSize: 15 },
});
