import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { Colors } from '@/src/theme/colors';

export default function OauthIntegrationStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  const currentItems = state.selectedSkillItems.find(s => s.category_id === currentCat?.category_id);
  const currentSkillItem = currentItems?.skill_items[0];

  const handleConnectGithub = () => {
    dispatch({ type: 'MARK_OAUTH_CONNECTED', skillItemId: currentSkillItem?._id || '' });
    dispatch({ type: 'NEXT_CATEGORY' });
  };

  const handleSkip = () => {
    dispatch({ type: 'NEXT_CATEGORY' });
  };

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'SET_STEP', step: 'evidence-type-choice' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Integration</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20, flex: 1, justifyContent: 'center' }}>
        <View style={styles.illustration}>
          <Ionicons name="logo-github" size={64} color={C.textPrimary} />
        </View>

        <Text style={styles.title}>Connect GitHub</Text>
        <Text style={styles.subtitle}>
          Link your GitHub account as proof of your skills. We'll check your public repos, contributions, and activity signals.
        </Text>

        <TouchableOpacity style={styles.ghBtn} onPress={handleConnectGithub} activeOpacity={0.8}>
          <Ionicons name="logo-github" size={20} color="#fff" />
          <Text style={styles.ghBtnText}> Connect GitHub</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip — I'll do this later</Text>
        </TouchableOpacity>

        <View style={styles.comingSoon}>
          <Ionicons name="time-outline" size={16} color={C.textHint} />
          <Text style={styles.comingSoonText}>Upwork & LinkedIn coming soon</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  illustration: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 32, paddingHorizontal: 20 },
  ghBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#24292e', height: 52, borderRadius: 12, marginBottom: 12 },
  ghBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 14, color: C.textHint },
  comingSoon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  comingSoonText: { fontSize: 12, color: C.textHint },
});
