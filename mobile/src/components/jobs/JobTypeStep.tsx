import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useJobCreation } from '@/src/context/JobCreationContext';
import { Colors, type AppColors } from '@/src/theme/colors';

const JOB_TYPES = [
  { id: 'physical', label: 'Physical Service', description: 'On-site work like repairs, cleaning, installation', icon: 'hammer-outline', color: '#1A9E8F' },
  { id: 'digital', label: 'Digital Service', description: 'Remote work like design, development, writing', icon: 'code-slash-outline', color: '#6C5CE7' },
  { id: 'errand', label: 'Errand & Delivery', description: 'Pickup, delivery, shopping, local tasks', icon: 'bicycle-outline', color: '#E17055' },
];

export default function JobTypeStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch, goNext } = useJobCreation();
  const router = useRouter();

  const handleSelect = (jobType: 'physical' | 'digital' | 'errand') => {
    dispatch({ type: 'SET_JOB_TYPE', jobType });
    goNext();
  };

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '12.5%' }]} />
        </View>

        <Text style={styles.title}>What type of job?</Text>
        <Text style={styles.subtitle}>Choose the category that best fits your needs</Text>

        {JOB_TYPES.map((type) => (
          <TouchableOpacity key={type.id} style={styles.typeCard} onPress={() => handleSelect(type.id as any)} activeOpacity={0.8}>
            <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
              <Ionicons name={type.icon as any} size={28} color="#fff" />
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeLabel}>{type.label}</Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={C.textHint} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    progressBar: { height: 4, backgroundColor: C.divider, borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 2 },
    title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 24 },
    typeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      marginBottom: 12,
    },
    typeIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    typeInfo: { flex: 1, marginLeft: 16 },
    typeLabel: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    typeDescription: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  });