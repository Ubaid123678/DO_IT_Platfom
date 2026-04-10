import React from 'react';
import { StyleSheet, Text, TextInput, View, useColorScheme, type TextInputProps } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

const Input: React.FC<InputProps> = ({ label, error, style, ...props }) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput style={[styles.input, style]} placeholderTextColor={C.textHint} {...props} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
      marginBottom: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: C.textPrimary,
      marginBottom: 6,
    },
    input: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 10,
      backgroundColor: C.inputBg,
      paddingHorizontal: 12,
      color: C.textPrimary,
    },
    error: {
      marginTop: 4,
      fontSize: 12,
      color: C.error,
    },
  });

export default Input;
