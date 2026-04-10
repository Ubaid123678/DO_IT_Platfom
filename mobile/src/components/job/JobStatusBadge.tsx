import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type JobStatus = 'open' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';

type JobStatusBadgeProps = Readonly<{
  status: JobStatus;
}>;

const getPalette = (status: JobStatus, C: AppColors, isDark: boolean) => {
  switch (status) {
    case 'open':
      return { bg: C.primaryLight, text: C.primary, label: 'Open' };
    case 'in_progress':
      return { bg: C.amberLight, text: C.amber, label: 'In Progress' };
    case 'completed':
      return { bg: isDark ? '#0F2E1F' : '#E8F8F2', text: C.success, label: 'Completed' };
    case 'disputed':
      return { bg: isDark ? '#2E1010' : '#FDECEA', text: C.error, label: 'Disputed' };
    default:
      return { bg: C.divider, text: C.textHint, label: 'Cancelled' };
  }
};

const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const palette = getPalette(status, C, isDark);

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}> 
      <Text style={[styles.text, { color: palette.text }]}>{palette.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
});

export default JobStatusBadge;
