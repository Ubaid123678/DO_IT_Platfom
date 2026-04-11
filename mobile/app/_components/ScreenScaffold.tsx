import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type ScreenScaffoldProps = Readonly<{
  title: string;
  description?: string;
}>;

const ScreenScaffold: React.FC<ScreenScaffoldProps> = ({
  title,
  description = 'Screen scaffold in app folder.',
}) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    card: {
      backgroundColor: C.card,
      borderColor: C.cardBorder,
      borderWidth: 0.5,
      borderRadius: 16,
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: C.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: C.textSecondary,
      lineHeight: 20,
    },
  });

export default ScreenScaffold;
