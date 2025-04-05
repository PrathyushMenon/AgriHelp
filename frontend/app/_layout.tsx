import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Add more screens if you have other components */}
        <Stack.Screen name="+not-found" />
        {/* You can add more screens here like ScanScreen, HomePage etc. */}
        <Stack.Screen name="home" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
