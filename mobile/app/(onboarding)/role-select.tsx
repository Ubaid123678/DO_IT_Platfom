import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type Role = 'client' | 'provider';

const clientBullets = [
  'Post jobs and receive proposals',
  'Pay securely with in-app wallet',
  'Rate and review providers',
];

const providerBullets = [
  'Browse and apply to jobs',
  'Get paid in your local currency',
  'Build your reputation with reviews',
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const clientScale = useRef(new Animated.Value(1)).current;
  const providerScale = useRef(new Animated.Value(1)).current;

  const animatePress = (value: Animated.Value, toValue: number) => {
    Animated.spring(value, {
      toValue,
      friction: 8,
      tension: 130,
      useNativeDriver: true,
    }).start();
  };

  const handleContinue = () => {
    if (!selectedRole) {
      return;
    }

    router.replace(selectedRole === 'client' ? '/(client)/home' : '/(provider)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.illustrationWrap}>
          <Ionicons name="person" size={48} color={C.primary} />
          <Ionicons name="person" size={48} color={C.primary} />
        </View>

        <Text style={styles.title}>How will you use Do It?</Text>
        <Text style={styles.subtitle}>You can switch roles later from Settings</Text>

        <View style={styles.cardsWrap}>
          <Animated.View style={{ transform: [{ scale: clientScale }] }}>
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => setSelectedRole('client')}
              onPressIn={() => animatePress(clientScale, 0.98)}
              onPressOut={() => animatePress(clientScale, 1)}
              style={[
                styles.card,
                selectedRole === 'client' ? styles.cardSelected : styles.cardIdle,
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.clientIconBubble}>
                  <Ionicons name="person" size={28} color={C.primary} />
                </View>
                <View
                  style={[
                    styles.selectionCircle,
                    selectedRole === 'client'
                      ? styles.selectionCircleSelected
                      : styles.selectionCircleIdle,
                  ]}
                >
                  {selectedRole === 'client' ? <View style={styles.selectionInner} /> : null}
                </View>
              </View>

              <Text style={styles.cardTitle}>I'm a Client</Text>
              <Text style={styles.cardDesc}>I want to hire providers and get tasks done.</Text>

              <View style={styles.bulletsWrap}>
                {clientBullets.map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle" size={16} color={C.primary} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: providerScale }] }}>
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => setSelectedRole('provider')}
              onPressIn={() => animatePress(providerScale, 0.98)}
              onPressOut={() => animatePress(providerScale, 1)}
              style={[
                styles.card,
                selectedRole === 'provider' ? styles.cardSelected : styles.cardIdle,
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.providerIconBubble}>
                  <Ionicons name="build" size={28} color={C.amber} />
                </View>
                <View
                  style={[
                    styles.selectionCircle,
                    selectedRole === 'provider'
                      ? styles.selectionCircleSelected
                      : styles.selectionCircleIdle,
                  ]}
                >
                  {selectedRole === 'provider' ? <View style={styles.selectionInner} /> : null}
                </View>
              </View>

              <Text style={styles.cardTitle}>I'm a Provider</Text>
              <Text style={styles.cardDesc}>I want to offer services and earn money.</Text>

              <View style={styles.bulletsWrap}>
                {providerBullets.map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle" size={16} color={C.primary} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      <View style={styles.bottomCtaWrap}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: selectedRole ? C.primary : C.textHint },
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <Text style={styles.continueText}>
            {selectedRole === 'client'
              ? 'Continue as Client'
              : selectedRole === 'provider'
                ? 'Continue as Provider'
                : 'Select a role to continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 140,
    },
    illustrationWrap: {
      marginTop: 40,
      height: 140,
      borderRadius: 20,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 16,
    },
    title: {
      marginTop: 28,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '700',
      color: C.textPrimary,
    },
    subtitle: {
      marginTop: 6,
      textAlign: 'center',
      fontSize: 13,
      color: C.textSecondary,
    },
    cardsWrap: {
      marginTop: 32,
      gap: 16,
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 20,
      position: 'relative',
    },
    cardIdle: {
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    cardSelected: {
      borderWidth: 2,
      borderColor: C.primary,
    },
    cardTopRow: {
      position: 'relative',
      minHeight: 52,
      justifyContent: 'center',
    },
    clientIconBubble: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    providerIconBubble: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: C.amberLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectionCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      position: 'absolute',
      right: 0,
      top: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectionCircleIdle: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: C.cardBorder,
    },
    selectionCircleSelected: {
      backgroundColor: C.primary,
    },
    selectionInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: 'white',
    },
    cardTitle: {
      marginTop: 14,
      fontSize: 17,
      fontWeight: '700',
      color: C.textPrimary,
    },
    cardDesc: {
      marginTop: 4,
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 20,
    },
    bulletsWrap: {
      marginTop: 10,
      gap: 6,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    bulletText: {
      flex: 1,
      fontSize: 13,
      color: C.textSecondary,
    },
    bottomCtaWrap: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 32,
    },
    continueButton: {
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });
