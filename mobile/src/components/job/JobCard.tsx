import React from 'react';
import { StyleSheet, Text, View, useColorScheme, type ViewStyle } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type JobCardProps = {
  title?: string;
  category?: string;
  budget?: string;
  status?: string;
  style?: ViewStyle;
};

const JobCard: React.FC<JobCardProps> = ({
  title = 'Need help with a task',
  category = 'General Service',
  budget = '$0.00',
  status = 'Open',
  style,
}) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.meta}>{category}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.budget}>{budget}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
    </View>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: C.card,
      borderColor: C.cardBorder,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      minHeight: 132,
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: C.textPrimary,
    },
    meta: {
      marginTop: 8,
      fontSize: 12,
      color: C.textSecondary,
    },
    footerRow: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    budget: {
      fontSize: 15,
      fontWeight: '700',
      color: C.primary,
    },
    statusPill: {
      backgroundColor: C.primaryLight,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: C.primary,
    },
  });

export default JobCard;
