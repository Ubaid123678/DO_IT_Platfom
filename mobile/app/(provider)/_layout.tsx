import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import KycFlow from '@/src/components/KycFlow';
import { kycService } from '@/src/services/kycService';
import { Colors } from '@/src/theme/colors';

export default function ProviderLayout() {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [gate, setGate] = useState<'loading' | 'kyc'>('loading');
  const gateRanRef = useRef(false);

  const checkGate = useCallback(async () => {
    try {
      const kycStatus = await kycService.getProviderStatus();
      if (kycStatus.status !== 'approved') {
        setGate('kyc');
        return;
      }

      // KYC approved → always go to verification wizard first.
      // The wizard (provider-verification) checks backend status and routes to
      // category-selection, pending-review, profile completion, or dashboard.
      router.replace('/(provider-verification)');
    } catch {
      router.replace('/(provider-verification)');
    }
  }, [router]);

  // Runs once per mount (StrictMode-safe)
  useEffect(() => {
    if (gateRanRef.current) return;
    gateRanRef.current = true;
    void checkGate();
  }, [checkGate]);

  if (gate === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <View style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (gate === 'kyc') {
    return <KycFlow onApproved={() => { void checkGate(); }} />;
  }

  // Fallback (should not reach here - router.replace handles navigation)
  return null;
}

