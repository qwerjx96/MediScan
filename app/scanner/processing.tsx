import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { runScannerPipeline } from '@/services/scanner/pipeline';

const STEP_LABELS: Record<string, string> = {
  ocr: 'Reading text from image…',
  nlm: 'Identifying medicine via NLM…',
  gemini: 'AI-assisted identification…',
};

export default function ProcessingScreen() {
  const { imageUri, geminiConsented } = useLocalSearchParams<{
    imageUri: string;
    geminiConsented: string;
  }>();
  const router = useRouter();
  const [step, setStep] = React.useState('ocr');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const result = await runScannerPipeline(imageUri, {
        geminiConsented: geminiConsented === 'true',
        onStep: setStep,
      });

      if (result.candidateINN) {
        router.replace({
          pathname: '/drug/[name]',
          params: { name: result.candidateINN },
        });
      } else {
        router.replace({
          pathname: '/scanner/search',
          params: { prefill: result.rawText.split('\n')[0] ?? '' },
        });
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.clinicalBlue} />
      <Text style={styles.stepText}>{STEP_LABELS[step] ?? 'Processing…'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
