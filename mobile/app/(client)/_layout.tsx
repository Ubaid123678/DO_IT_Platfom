import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { authService } from '@/src/services/authService';
import { verificationService } from '@/src/services/verificationService';
import { JobCreationProvider } from '@/src/context/JobCreationContext';
import { Colors } from '@/src/theme/colors';

export default function ClientLayout() {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [gate, setGate] = useState<'loading' | 'profile' | 'approved'>('loading');
  const gateRanRef = useRef(false);

  const checkGate = useCallback(async () => {
    try {
      // First check if user is authenticated
      const userRaw = await AsyncStorage.getItem('user');
      if (!userRaw) {
        // Not logged in, let auth flow handle it
        router.replace('/(auth)/login');
        return;
      }

      const user = JSON.parse(userRaw);

      // Check if client profile is completed
      const hasCompletedProfile = await AsyncStorage.getItem('hasCompletedProfile');
      if (hasCompletedProfile !== 'true') {
        setGate('profile');
        return;
      }

      setGate('approved');
    } catch {
      router.replace('/(auth)/login');
    }
  }, [router]);

  // Runs once per mount
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

  if (gate === 'profile') {
    return <Redirect href="/(onboarding)/client-profile" />;
  }

  if (gate === 'approved') {
    return (
    <JobCreationProvider>
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
        name="post-job"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'My Jobs',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} color={color} size={size} />
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
      <Tabs.Screen name="disputes" options={{ href: null }} />
      <Tabs.Screen name="job-proposals/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="proposals/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="wallet-topup" options={{ href: null }} />
      <Tabs.Screen name="wallet-withdraw" options={{ href: null }} />
      <Tabs.Screen name="wallet/topup" options={{ href: null }} />
      <Tabs.Screen name="verification" options={{ href: null }} />
      </Tabs>
    </JobCreationProvider>
    );
  }

  return null;
}