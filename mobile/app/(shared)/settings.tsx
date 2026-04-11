import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomSheet from '@/src/components/common/BottomSheet';
import { Colors, type AppColors } from '@/src/theme/colors';

type Tone = 'teal' | 'amber' | 'gray' | 'error';
type ThemeMode = 'light' | 'auto' | 'dark';

type SettingsRowProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  showChevron?: boolean;
  showBorder?: boolean;
  rightNode?: React.ReactNode;
  dangerLabel?: boolean;
  onPress?: () => void;
};

export default function SettingsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>('auto');

  const [language, setLanguage] = useState('English');
  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(true);

  const iconPalette = (tone: Tone) => {
    if (tone === 'amber') {
      return { bg: C.amberLight, color: C.amber };
    }
    if (tone === 'gray') {
      return { bg: C.background, color: C.textSecondary };
    }
    if (tone === 'error') {
      return { bg: isDark ? '#2E1010' : '#FDECEA', color: C.error };
    }
    return { bg: C.primaryLight, color: C.primary };
  };

  const SectionLabel = ({ text }: { text: string }) => (
    <Text style={styles.sectionLabel}>{text}</Text>
  );

  const SettingsRow = ({
    label,
    icon,
    tone = 'teal',
    showChevron = true,
    showBorder = true,
    rightNode,
    dangerLabel = false,
    onPress,
  }: SettingsRowProps) => {
    const palette = iconPalette(tone);

    return (
      <TouchableOpacity
        activeOpacity={onPress ? 0.85 : 1}
        onPress={onPress}
        style={[styles.row, !showBorder ? styles.rowNoBorder : null]}
      >
        <View style={[styles.rowIconWrap, { backgroundColor: palette.bg }]}>
          <Ionicons name={icon} size={20} color={palette.color} />
        </View>

        <Text style={[styles.rowLabel, dangerLabel ? styles.rowLabelDanger : null]}>{label}</Text>

        {rightNode ?? null}

        {showChevron ? <Ionicons name="chevron-forward" size={18} color={C.textHint} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionLabel text="Account" />
        <View style={styles.card}>
          <SettingsRow
            label="Edit Profile"
            icon="person-outline"
            tone="teal"
            onPress={() => router.back()}
          />
          <SettingsRow label="Change Password" icon="lock-closed-outline" tone="gray" />
          <SettingsRow
            label="Two-Factor Authentication"
            icon="shield-outline"
            tone="teal"
            rightNode={
              <View style={styles.rightInlineRow}>
                <Text style={styles.statusOnText}>ON</Text>
              </View>
            }
          />
          <SettingsRow
            label="Connected Accounts"
            icon="link-outline"
            tone="gray"
            showBorder={false}
            rightNode={
              <View style={styles.rightInlineRow}>
                <View style={styles.googleBadge}>
                  <Text style={styles.googleBadgeText}>G</Text>
                </View>
              </View>
            }
          />
        </View>

        <SectionLabel text="Preferences" />
        <View style={styles.card}>
          <SettingsRow
            label="Language"
            icon="globe-outline"
            tone="teal"
            rightNode={<Text style={styles.rightValueText}>{language}</Text>}
            onPress={() => setLanguageSheetVisible(true)}
          />
          <SettingsRow
            label="Currency"
            icon="cash-outline"
            tone="teal"
            rightNode={<Text style={styles.rightValueText}>USD - $</Text>}
          />
          <SettingsRow
            label="Theme"
            icon="moon-outline"
            tone="gray"
            showChevron={false}
            rightNode={
              <View style={styles.themeModesRow}>
                {[
                  { key: 'light', icon: 'sunny-outline' as const },
                  { key: 'auto', icon: 'phone-portrait-outline' as const },
                  { key: 'dark', icon: 'moon-outline' as const },
                ].map((item) => {
                  const active = selectedTheme === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.themeModeButton, active ? styles.themeModeButtonActive : null]}
                      onPress={() => setSelectedTheme(item.key as ThemeMode)}
                    >
                      <Ionicons
                        name={item.icon}
                        size={16}
                        color={active ? C.primary : C.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            }
          />

          <SettingsRow
            label="Notifications"
            icon="notifications-outline"
            tone="gray"
            showChevron={false}
            showBorder={!showNotifSettings}
            onPress={() => setShowNotifSettings((prev) => !prev)}
            rightNode={
              <Ionicons
                name={showNotifSettings ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={C.textHint}
              />
            }
          />

          {showNotifSettings ? (
            <View style={styles.toggleGroup}>
              {[
                { key: 'Push', value: pushNotif, setValue: setPushNotif },
                { key: 'Email', value: emailNotif, setValue: setEmailNotif },
                { key: 'SMS', value: smsNotif, setValue: setSmsNotif },
              ].map((toggle, idx, arr) => (
                <View
                  key={toggle.key}
                  style={[styles.toggleRow, idx === arr.length - 1 ? styles.rowNoBorder : null]}
                >
                  <Text style={styles.toggleLabel}>{toggle.key}</Text>
                  <Switch
                    value={toggle.value}
                    onValueChange={toggle.setValue}
                    trackColor={{ false: C.cardBorder, true: C.primary }}
                    thumbColor="white"
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <SectionLabel text="Privacy" />
        <View style={styles.card}>
          <SettingsRow label="Privacy Settings" icon="shield-outline" tone="gray" />
          <SettingsRow label="Blocked Users" icon="ban-outline" tone="gray" />
          <SettingsRow label="Data & Storage" icon="server-outline" tone="gray" />
          <SettingsRow
            label="Delete Account"
            icon="trash-outline"
            tone="error"
            dangerLabel
            showBorder={false}
          />
        </View>

        <SectionLabel text="About" />
        <View style={styles.card}>
          <SettingsRow
            label="App Version"
            icon="information-circle-outline"
            tone="gray"
            showChevron={false}
            rightNode={<Text style={styles.rightValueText}>v1.0.0</Text>}
          />
          <SettingsRow label="Terms of Service" icon="document-text-outline" tone="gray" />
          <SettingsRow label="Privacy Policy" icon="lock-closed-outline" tone="gray" />
          <SettingsRow label="Licenses" icon="reader-outline" tone="gray" showBorder={false} />
        </View>
      </ScrollView>

      <BottomSheet
        visible={languageSheetVisible}
        onClose={() => setLanguageSheetVisible(false)}
        title="Select Language"
      >
        {['English', 'Urdu'].map((lang) => {
          const active = language === lang;
          return (
            <TouchableOpacity
              key={lang}
              style={[styles.langOption, active ? styles.langOptionActive : null]}
              onPress={() => {
                setLanguage(lang);
                setLanguageSheetVisible(false);
              }}
            >
              <Text style={active ? styles.langOptionTextActive : styles.langOptionText}>{lang}</Text>
              {active ? <Ionicons name="checkmark" size={18} color={C.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    headerRow: {
      marginTop: 8,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    backButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    sectionLabel: {
      marginTop: 20,
      marginBottom: 6,
      fontSize: 12,
      fontWeight: '600',
      color: C.textHint,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      overflow: 'hidden',
    },
    row: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    rowNoBorder: {
      borderBottomWidth: 0,
    },
    rowIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      flex: 1,
      marginLeft: 12,
      fontSize: 14,
      color: C.textPrimary,
    },
    rowLabelDanger: {
      color: C.error,
    },
    rightInlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
      gap: 6,
    },
    statusOnText: {
      fontSize: 12,
      color: C.success,
      fontWeight: '600',
    },
    googleBadge: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#4285F4',
      alignItems: 'center',
      justifyContent: 'center',
    },
    googleBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: 'white',
      lineHeight: 12,
    },
    rightValueText: {
      marginRight: 8,
      fontSize: 13,
      color: C.textSecondary,
    },
    themeModesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
      gap: 6,
    },
    themeModeButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#0D1F1E' : C.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeModeButtonActive: {
      backgroundColor: C.primaryLight,
      borderColor: C.primary,
    },
    toggleGroup: {
      borderTopWidth: 1,
      borderTopColor: C.divider,
      backgroundColor: C.card,
    },
    toggleRow: {
      height: 48,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleLabel: {
      fontSize: 13,
      color: C.textPrimary,
      fontWeight: '500',
    },
    langOption: {
      minHeight: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.background,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    langOptionActive: {
      borderColor: C.primary,
      backgroundColor: C.primaryLight,
    },
    langOptionText: {
      fontSize: 13,
      color: C.textPrimary,
      fontWeight: '500',
    },
    langOptionTextActive: {
      fontSize: 13,
      color: C.primary,
      fontWeight: '600',
    },
  });
