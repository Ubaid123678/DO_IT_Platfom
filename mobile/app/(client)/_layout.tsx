import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/services/authService';
import { verificationService } from '@/src/services/verificationService';
import { JobCreationProvider } from '@/src/context/JobCreationContext';
import { Colors } from '@/src/theme/colors';

export default function ClientLayout() {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [gate, setGate] = useState<'loading' | 'profile' | 'approved'>('loading');

  const checkGate = useCallback(async () => {
    try {
      // Server is the source of truth for whether the profile is complete.
      const res = await authService.getMe();
      const shape = res.data as unknown as { data?: { user?: any }; user?: any };
      const user = shape.data?.user ?? shape.user;
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      setGate(user.client_profile?.completed ? 'approved' : 'profile');
    } catch {
      router.replace('/(auth)/login');
    }
  }, [router]);

  // Re-check on every focus so finishing the profile unlocks the tabs without
  // needing an app restart.
  useFocusEffect(
    useCallback(() => {
      void checkGate();
    }, [checkGate]),
  );

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
      <Tabs.Screen name="disputes" options={{ href: null }} />
      <Tabs.Screen name="job-proposals/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="wallet-withdraw" options={{ href: null }} />
      <Tabs.Screen name="wallet/topup" options={{ href: null }} />
      <Tabs.Screen name="verification" options={{ href: null }} />
      </Tabs>
    </JobCreationProvider>
    );
  }

  return null;
}