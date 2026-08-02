import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import KycFlow from '@/src/components/KycFlow';
import { kycService } from '@/src/services/kycService';
import { verificationService } from '@/src/services/verificationService';
import { Colors } from '@/src/theme/colors';

export default function ProviderLayout() {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [gate, setGate] = useState<'loading' | 'kyc' | 'verification' | 'approved'>('loading');
  const gateRanRef = useRef(false);

  const checkGate = useCallback(async () => {
    try {
      const kycStatus = await kycService.getProviderStatus();
      if (kycStatus.status !== 'approved') {
        setGate('kyc');
        return;
      }

      const verifDone = await verificationService.isVerificationComplete();
      if (verifDone) {
        setGate('approved');
        return;
      }

      // The verification wizard decides the correct starting step (category,
      // pending review, profile completion, etc.).
      router.replace('/(provider-verification)');
    } catch {
      const verifDone = await verificationService.isVerificationComplete().catch(() => false);
      if (verifDone) {
        setGate('approved');
      } else {
        router.replace('/(provider-verification)');
      }
    }
  }, [router]);

  // Runs once per mount (StrictMode-safe) so the wizard isn't entered twice.
  // A ref resets on a real remount, so re-entering the provider group after the
  // wizard still re-checks instead of being stuck on the loading gate.
  useEffect(() => {
    if (gateRanRef.current) return;
    gateRanRef.current = true;
    void checkGate();
  }, [checkGate]);

  if (gate === 'loading') {
    // No visible loader here — the wizard immediately shows its own single
    // loading spinner, so this only renders during the brief KYC check.
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <View style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (gate === 'kyc') {
    return <KycFlow onApproved={() => { void checkGate(); }} />;
  }

  if (gate === 'approved') {
    return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textHint,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: C.navBg,
          borderTopColor: C.navBorder,
          borderTopWidth: 0.5,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse-jobs"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="proposals"
        options={{
          title: 'Proposals',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="job-detail/[id]" options={{ href: null }} />
      <Tabs.Screen name="active-job/[id]" options={{ href: null }} />
      <Tabs.Screen name="kyc" options={{ href: null }} />
      <Tabs.Screen name="withdraw" options={{ href: null }} />
    </Tabs>
    );
  }
}

