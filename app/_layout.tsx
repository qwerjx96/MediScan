import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Localization from 'expo-localization';
import { initDatabase } from '@/db/database';
import { loadKvCache } from '@/db/kvStorage';
import { useAppStore } from '@/stores/appStore';
import { Colors } from '@/constants/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 min
      retry: 2,
    },
  },
});

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const setUserRegion = useAppStore((s) => s.setUserRegion);

  useEffect(() => {
    (async () => {
      await initDatabase();
      await loadKvCache();

      const locale = Localization.getLocales()[0];
      if (locale?.regionCode) {
        setUserRegion(locale.regionCode);
      }

      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.clinicalBlue} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppBootstrap>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="scanner/scan"
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="scanner/processing"
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen name="scanner/search" />
          <Stack.Screen
            name="drug/[name]"
            options={{ headerShown: true, title: 'Drug Information' }}
          />
          <Stack.Screen
            name="medication/add"
            options={{ presentation: 'modal', headerShown: true, title: 'Add Medication' }}
          />
          <Stack.Screen
            name="medication/[id]"
            options={{ presentation: 'modal', headerShown: true, title: 'Edit Medication' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </AppBootstrap>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
