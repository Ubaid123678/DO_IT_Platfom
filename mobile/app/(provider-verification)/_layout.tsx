import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, useColorScheme } from 'react-native';

import { Colors } from '@/src/theme/colors';
import { verificationService } from '@/src/services/verificationService';
import { useWizard, VerificationWizardProvider } from '@/src/context/VerificationWizardContext';

function useAndroidBackHandler() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const isCompletionStep =
        state.currentStep === 'review-approved' || state.currentStep === 'resume-bio';
      // First-class screens (category pick, pending review, profile completion)
      // have no in-wizard back path.
      if (
        state.currentStep === 'category-selection' ||
        state.currentStep === 'pending-review' ||
        isCompletionStep
      ) {
        // If the profile is already complete (server truth), the back gesture
        // returns to the dashboard; otherwise close the app (no in-wizard back).
        verificationService.getProfile()
          .then((p) => {
            if (p.required_complete) {
              router.replace('/(provider)/home');
            } else {
              BackHandler.exitApp();
            }
          })
          .catch(() => BackHandler.exitApp());
        return true;
      }
      dispatch({ type: 'GO_BACK' });
      return true;
    });
    return () => sub.remove();
  }, [state.currentStep, dispatch, router]);
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
