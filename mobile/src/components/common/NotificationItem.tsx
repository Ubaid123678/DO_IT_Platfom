import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type NotificationItemProps = Readonly<{
  title: string;
  message: string;
  time: string;
  unread?: boolean;
  onPress?: () => void;
}>;

const NotificationItem: React.FC<NotificationItemProps> = ({ title, message, time, unread = false, onPress }) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.iconCircle}>
        <Ionicons name="notifications-outline" size={18} color={C.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
      {unread ? <View style={styles.dot} /> : null}
    </Pressable>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: C.card,
      borderColor: C.cardBorder,
      borderWidth: 0.5,
      borderRadius: 16,
      padding: 16,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { flex: 1 },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    time: {
      fontSize: 12,
      color: C.textHint,
    },
    message: {
      fontSize: 14,
      color: C.textSecondary,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.primary,
    },
  });

export default NotificationItem;
