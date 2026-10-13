import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import KycFlow from '@/src/components/KycFlow';
import { authService } from '@/src/services/authService';
import { kycService } from '@/src/services/kycService';
import { verificationService } from '@/src/services/verificationService';
import { Colors } from '@/src/theme/colors';

export default function ProviderLayout() {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [gate, setGate] = useState<'loading' | 'kyc' | 'approved' | 'offline'>('loading');
  const attemptsRef = useRef(0);

  const checkGate = useCallback(async () => {
    try {
      // Guard against a stale/wrong-role session rendering this group. A client
      // token must never be pushed into the provider KYC/verification flow.
      const me = await authService.getMe();
      const shape = me.data as unknown as { data?: { user?: any }; user?: any };
      const currentUser = shape.data?.user ?? shape.user;
      if (!currentUser) {
        router.replace('/(auth)/login');
        return;
      }
      if (currentUser.role === 'client') {
        router.replace('/(client)/home');
        return;
      }
      if (currentUser.role && currentUser.role !== 'provider') {
        router.replace('/(auth)/login');
        return;
      }

      const kycStatus = await kycService.getProviderStatus();
      // Only the server saying "not approved" shows KYC. A network failure must
      // never be mistaken for "KYC required" or the provider gets trapped here.
      if (kycStatus.status !== 'approved') {
        setGate('kyc');
        return;
      }

      // KYC approved → require category + skill verification (server truth).
      const verif = await verificationService.getVerificationStatus();
      if (verif.overall_status !== 'verified') {
        router.replace('/(provider-verification)');
        return;
      }

      // Verified → require every *required* profile field for the track (server
      // truth). No device-local sentinel: a completed profile must unlock the
      // dashboard after any login/reload.
      const profile = await verificationService.getProfile();
      if (!profile.required_complete) {
        router.replace('/(provider-verification)');
        return;
      }

      attemptsRef.current = 0;
      setGate('approved');
    } catch {
      // Couldn't reach the server. Retry a few times (the request interceptor
      // already self-heals stale-role 403s by refreshing), then show an honest
      // retry screen instead of guessing KYC state.
      attemptsRef.current += 1;
      if (attemptsRef.current <= 5) {
        setGate('loading');
        setTimeout(() => { void checkGate(); }, 2000);
      } else {
        setGate('offline');
      }
    }
  }, [router]);

  // Re-check whenever the provider group regains focus so an approval (or a
  // recovered server) is picked up without an app restart.
  useFocusEffect(
    useCallback(() => {
      attemptsRef.current = 0;
      void checkGate();
    }, [checkGate]),
  );

  if (gate === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (gate === 'offline') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={48} color={C.textHint} />
          <Text style={{ marginTop: 12, fontSize: 15, color: C.textSecondary, textAlign: 'center' }}>
            Can&apos;t reach the server. Check your connection and try again.
          </Text>
          <TouchableOpacity
            onPress={() => { attemptsRef.current = 0; setGate('loading'); void checkGate(); }}
            style={{ marginTop: 20, backgroundColor: C.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
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
      <Tabs.Screen name="active-job/[id]" options={{ href: null }} />
      <Tabs.Screen name="submit-proposal/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="kyc" options={{ href: null }} />
      <Tabs.Screen name="withdraw" options={{ href: null }} />
    </Tabs>
    );
  }

  return null;
}

