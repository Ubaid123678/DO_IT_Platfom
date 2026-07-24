import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';

import KycFlow from '@/src/components/KycFlow';
import { kycService } from '@/src/services/kycService';

export default function KycRoute() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const check = async () => {
        try {
          const status = await kycService.getProviderStatus();
          if (status.status === 'approved') {
            router.replace('/(provider)/home');
            return;
          }
        } catch {
          // stay on this screen
        } finally {
          setChecking(false);
        }
      };
      void check();
    }, [router]),
  );

  if (checking) return null;

  return <KycFlow onApproved={() => router.replace('/(provider)/home')} />;
}
