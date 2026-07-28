import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, useColorScheme } from 'react-native';

import { Colors } from '@/src/theme/colors';
import { VerificationWizardProvider } from '@/src/context/VerificationWizardContext';

function useAndroidBackHandler() {
  const router = useRouter();
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/(provider)/home');
      return true;
    });
    return () => sub.remove();
  }, [router]);
}

function ProviderVerificationLayoutInner() {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;

  useAndroidBackHandler();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function ProviderVerificationLayout() {
  return (
    <VerificationWizardProvider>
      <ProviderVerificationLayoutInner />
    </VerificationWizardProvider>
  );
}
