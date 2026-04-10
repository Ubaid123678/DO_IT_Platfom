import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type MapPreviewProps = Readonly<{
  latitude: number;
  longitude: number;
  onPress?: () => void;
}>;

const MapPreview: React.FC<MapPreviewProps> = ({ latitude, longitude, onPress }) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Ionicons name="location" size={20} color={C.primary} />
      <Text style={styles.title}>Map Preview</Text>
      <Text style={styles.subtitle}>{latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
    </Pressable>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      borderRadius: 16,
      borderWidth: 0.5,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      padding: 16,
      alignItems: 'center',
      gap: 4,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: C.textSecondary,
    },
  });

export default MapPreview;
