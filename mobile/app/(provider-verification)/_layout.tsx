import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/src/theme/colors';
import { VerificationWizardProvider } from '@/src/context/VerificationWizardContext';

export default function ProviderVerificationLayout() {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <VerificationWizardProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </VerificationWizardProvider>
  );
}
