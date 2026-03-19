import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Switch,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useAppStore } from '@/stores/appStore';
import { useCabinetStore } from '@/stores/cabinetStore';
import { Colors } from '@/constants/colors';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const geminiConsented = useAppStore((s) => s.geminiConsented);
  const setGeminiConsented = useAppStore((s) => s.setGeminiConsented);
  const userRegion = useAppStore((s) => s.userRegion);
  const medicationCount = useCabinetStore((s) => s.medications.length);

  const handleGeminiToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable AI Vision',
        'When enabled, unrecognised medicine images will be sent to Google Gemini AI for identification. Google may process this data per their Privacy Policy.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => setGeminiConsented(true) },
        ]
      );
    } else {
      setGeminiConsented(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Region</Text>
            <Text style={styles.rowValue}>{userRegion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Medications in cabinet</Text>
            <Text style={styles.rowValue}>{medicationCount}</Text>
          </View>
        </View>

        {/* AI Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI &amp; Privacy</Text>
          <View style={styles.row}>
            <View style={styles.rowTextGroup}>
              <Text style={styles.rowLabel}>Gemini Vision fallback</Text>
              <Text style={styles.rowHint}>
                Send unrecognised images to Google AI for identification
              </Text>
            </View>
            <Switch
              value={geminiConsented}
              onValueChange={handleGeminiToggle}
              trackColor={{ true: Colors.clinicalBlue, false: Colors.border }}
            />
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            MediScan is for informational purposes only. It is not a substitute
            for professional medical advice, diagnosis, or treatment. Always
            consult a qualified healthcare provider before making any medication
            decisions.
          </Text>
        </View>
      </ScrollView>
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
  content: { padding: 16 },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowTextGroup: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 15, color: Colors.textPrimary },
  rowValue: { fontSize: 15, color: Colors.textSecondary },
  rowHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  disclaimer: {
    padding: 16,
    backgroundColor: Colors.clinicalBlueLight,
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
});
