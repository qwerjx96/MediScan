import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scanner" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="drug/[name]" options={{ title: 'Drug Information' }} />
        <Stack.Screen name="search" options={{ title: 'Search Medicine' }} />
        <Stack.Screen name="medication/[id]" options={{ title: 'Medication' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
