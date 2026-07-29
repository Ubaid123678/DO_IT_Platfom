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
      const prevStepMap: Record<string, string> = {
        'skill-selection': 'category-selection',
        'evidence-type-choice': 'skill-selection',
        'certificate-upload': 'evidence-type-choice',
        'prior-work-photos': 'evidence-type-choice',
        'portfolio-link': 'evidence-type-choice',
        'oauth-integration': 'evidence-type-choice',
        'resume-bio': 'evidence-type-choice',
        'status-hub': 'resume-bio',
        'rejection-detail': 'status-hub',
      };
      const prevStep = prevStepMap[state.currentStep];
      if (prevStep) {
        dispatch({ type: 'SET_STEP', step: prevStep as any });
        return true;
      }
      return false;
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
