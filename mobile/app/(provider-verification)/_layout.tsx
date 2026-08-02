import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, useColorScheme } from 'react-native';

import { Colors } from '@/src/theme/colors';
import { useWizard, VerificationWizardProvider } from '@/src/context/VerificationWizardContext';

function useAndroidBackHandler() {
  const { state, dispatch } = useWizard();
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (state.currentStep === 'category-selection') {
        BackHandler.exitApp();
        return true;
      }
      if (state.currentStep === 'pending-review') {
        // Verification is under review; the back gesture should close the app
        // rather than navigating back into the wizard.
        BackHandler.exitApp();
        return true;
      }
      dispatch({ type: 'GO_BACK' });
      return true;
    });
    return () => sub.remove();
  }, [state.currentStep, dispatch]);
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
