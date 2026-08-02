import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { verificationService, type OAuthConnectResult } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function OauthIntegrationStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OAuthConnectResult | null>(null);

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  const currentItems = state.selectedSkillItems.find(s => s.category_id === currentCat?.category_id);
  const currentSkillItem = currentItems?.skill_items[0];
  const currentSkillName = currentSkillItem?.name || '';

  const handleConnectGithub = async () => {
    if (!username.trim()) {
      Alert.alert('Username required', 'Please enter your GitHub username');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await verificationService.connectGithub(username.trim(), currentSkillName ? [currentSkillName] : undefined);
      setResult(res);
      if (res.verified) {
        dispatch({ type: 'MARK_OAUTH_CONNECTED', skillItemId: currentSkillItem?._id || '' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err.message || 'Failed to connect GitHub';
      Alert.alert('Connection failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (currentSkillItem?._id) {
      dispatch({ type: 'MARK_OAUTH_CONNECTED', skillItemId: currentSkillItem._id });
    }
    if (currentCat) {
      dispatch({ type: 'MARK_EVIDENCE_COMPLETE', categoryId: currentCat.category_id, evidenceKey: 'oauth' });
    }
  };

  const handleSkip = () => {
    if (currentCat) {
      dispatch({ type: 'MARK_EVIDENCE_COMPLETE', categoryId: currentCat.category_id, evidenceKey: 'oauth' });
    }
  };

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'GO_BACK' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Integration</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <View style={styles.illustration}>
          <Ionicons name="logo-github" size={64} color={C.textPrimary} />
        </View>

        <Text style={styles.title}>Connect GitHub</Text>
        <Text style={styles.subtitle}>
          Link your GitHub account as proof of your skills. We'll analyze your public repos and activity signals.
        </Text>

        {!result ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="GitHub username"
              placeholderTextColor={C.textHint}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.ghBtn, loading && { opacity: 0.6 }]}
              onPress={handleConnectGithub}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-github" size={20} color="#fff" />
                  <Text style={styles.ghBtnText}> Verify GitHub Profile</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.resultCard}>
            <Ionicons
              name={result.verified ? 'checkmark-circle' : 'warning'}
              size={32}
              color={result.verified ? '#34c759' : '#ff9500'}
            />
            <Text style={styles.resultTitle}>
              {result.verified ? 'Verified!' : 'Low confidence'}
            </Text>
            <Text style={styles.resultText}>
              {result.verified
                ? `GitHub profile ${result.username} looks good (score: ${Math.round((result.verification_score || 0) * 100)}%).`
                : `Could not fully verify ${result.username} (score: ${Math.round((result.verification_score || 0) * 100)}%). You can still continue.`}
            </Text>
            {result.repo_analysis && (
              <Text style={styles.resultDetail}>
                {result.repo_analysis.match_count} skill-relevant repos found · {result.repo_analysis.languages.length} languages
              </Text>
            )}
            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.8}>
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {!result && (
          <>
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip — I'll do this later</Text>
            </TouchableOpacity>

            <View style={styles.comingSoon}>
              <Ionicons name="time-outline" size={16} color={C.textHint} />
              <Text style={styles.comingSoonText}>Upwork & LinkedIn coming soon</Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  illustration: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 20 },
  input: { height: 50, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: C.textPrimary, marginBottom: 16, backgroundColor: C.card },
  ghBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#24292e', height: 52, borderRadius: 12, marginBottom: 12 },
  ghBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', marginLeft: 8 },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 14, color: C.textHint },
  resultCard: { backgroundColor: C.card, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  resultTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, marginTop: 12, marginBottom: 8 },
  resultText: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
  resultDetail: { fontSize: 12, color: C.textHint, textAlign: 'center', marginTop: 8, marginBottom: 16 },
  continueBtn: { backgroundColor: C.textPrimary, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, marginTop: 8 },
  continueBtnText: { fontSize: 15, fontWeight: '600', color: C.background },
  comingSoon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  comingSoonText: { fontSize: 12, color: C.textHint },
});

