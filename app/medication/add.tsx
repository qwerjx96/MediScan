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
import { scheduleNotificationsForMedication, requestNotificationPermission } from '@/services/notifications/scheduler';
import { Colors } from '@/constants/colors';
import { FREQUENCY_LABELS, FREQUENCY_DOSE_COUNT } from '@/constants/frequencies';
import type { FrequencyType, Medication } from '@/types';

const FREQUENCIES: FrequencyType[] = [
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'four_times_daily',
  'weekly',
  'as_needed',
];

const PILL_COLORS = ['#1A6FB4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function generateId() {
  return `med_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultTimesForFrequency(freq: FrequencyType): string[] {
  const count = FREQUENCY_DOSE_COUNT[freq];
  if (!count) return ['08:00'];
  const base = [8, 12, 18, 22];
  return Array.from({ length: count }, (_, i) => `${String(base[i] ?? 8).padStart(2, '0')}:00`);
}

export default function AddMedicationScreen() {
  const { inn } = useLocalSearchParams<{ inn?: string }>();
  const router = useRouter();
  const addMedication = useCabinetStore((s) => s.addMedication);
  const setNotificationIds = useScheduleStore((s) => s.setNotificationIds);

  const [innValue, setInnValue] = useState(inn ?? '');
  const [brandName, setBrandName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('once_daily');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [color, setColor] = useState(PILL_COLORS[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFrequencyChange = (freq: FrequencyType) => {
    setFrequency(freq);
    setTimes(defaultTimesForFrequency(freq));
  };

  const handleSave = async () => {
    if (!innValue.trim()) {
      Alert.alert('Required', 'Please enter the medicine name (INN).');
      return;
    }
    if (!dosage.trim()) {
      Alert.alert('Required', 'Please enter the dosage.');
      return;
    }

    setSaving(true);
    try {
      const med: Medication = {
        id: generateId(),
        inn: innValue.trim().toLowerCase(),
        brandName: brandName.trim() || undefined,
        dosage: dosage.trim(),
        frequency,
        times,
        startDate: new Date().toISOString(),
        notes: notes.trim() || undefined,
        color,
      };

      addMedication(med);

      if (frequency !== 'as_needed') {
        const granted = await requestNotificationPermission();
        if (granted) {
          const ids = await scheduleNotificationsForMedication(med);
          setNotificationIds(med.id, ids);
        }
      }

      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Generic Name (INN) *</Text>
      <TextInput
        style={styles.input}
        value={innValue}
        onChangeText={setInnValue}
        placeholder="e.g. metformin"
        placeholderTextColor={Colors.textSecondary}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Brand Name (optional)</Text>
      <TextInput
        style={styles.input}
        value={brandName}
        onChangeText={setBrandName}
        placeholder="e.g. Glucophage"
        placeholderTextColor={Colors.textSecondary}
      />

      <Text style={styles.label}>Dosage *</Text>
      <TextInput
        style={styles.input}
        value={dosage}
        onChangeText={setDosage}
        placeholder="e.g. 500mg"
        placeholderTextColor={Colors.textSecondary}
      />

      <Text style={styles.label}>Frequency</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.freqRow}>
        {FREQUENCIES.map((f) => (
          <Pressable
            key={f}
            onPress={() => handleFrequencyChange(f)}
            style={[styles.freqChip, frequency === f && styles.freqChipActive]}
          >
            <Text style={[styles.freqChipText, frequency === f && styles.freqChipTextActive]}>
              {FREQUENCY_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Reminder Times</Text>
      {times.map((t, idx) => (
        <TextInput
          key={idx}
          style={[styles.input, { marginBottom: 8 }]}
          value={t}
          onChangeText={(v) => {
            const next = [...times];
            next[idx] = v;
            setTimes(next);
          }}
          placeholder="HH:MM"
          placeholderTextColor={Colors.textSecondary}
        />
      ))}

      <Text style={styles.label}>Pill Color</Text>
      <View style={styles.colorRow}>
        {PILL_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
          />
        ))}
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any additional notes..."
        placeholderTextColor={Colors.textSecondary}
        multiline
        numberOfLines={3}
      />

      <Pressable
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Medication'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  notesInput: { height: 80, textAlignVertical: 'top' },
  freqRow: { flexDirection: 'row', marginBottom: 4 },
  freqChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    backgroundColor: Colors.white,
  },
  freqChipActive: {
    backgroundColor: Colors.clinicalBlue,
    borderColor: Colors.clinicalBlue,
  },
  freqChipText: { color: Colors.textSecondary, fontSize: 13 },
  freqChipTextActive: { color: Colors.white, fontWeight: '600' },
  colorRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: Colors.textPrimary },
  saveBtn: {
    backgroundColor: Colors.clinicalBlue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
