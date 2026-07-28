import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
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

  const checkGate = useCallback(async () => {
    try {
      const kycStatus = await kycService.getProviderStatus();
      if (kycStatus.status !== 'approved') {
        setGate('kyc');
        return;
      }
      const verifStatus = await verificationService.getVerificationStatus();
      if (verifStatus.overall_status === 'verified' || verifStatus.overall_status === 'partially_verified') {
        setGate('approved');
      } else {
        setGate('verification');
      }
    } catch {
      setGate('approved');
    }
  }, []);

  useEffect(() => { void checkGate(); }, [checkGate]);

  useEffect(() => {
    if (gate === 'verification') {
      router.replace('/(provider-verification)');
    }
  }, [gate, router]);

  if (gate === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (gate === 'kyc') {
    return <KycFlow onApproved={() => { void checkGate(); }} />;
  }

  if (gate === 'verification') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
