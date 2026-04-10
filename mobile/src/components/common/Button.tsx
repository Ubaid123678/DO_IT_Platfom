import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, type ViewStyle } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

const Button: React.FC<ButtonProps> = ({ title, onPress, disabled = false, loading = false, style }) => {
  const isDisabled = disabled || loading;
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.container, isDisabled ? styles.disabled : undefined, style]}
    >
      {loading ? <ActivityIndicator color={C.card} /> : <Text style={styles.title}>{title}</Text>}
    </Pressable>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: C.primary,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: C.card,
      textAlign: 'center',
    },
    disabled: {
      opacity: 0.6,
    },
  });

export default Button;
