import React from 'react';
import { StyleSheet, TextInput, View, useColorScheme } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type OTPInputProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  length?: number;
}>;

const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, length = 6 }) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const chars = Array.from({ length }, (_, index) => value[index] ?? '');

  return (
    <View style={styles.row}>
      {chars.map((char, index) => (
        <TextInput
          key={index}
          style={styles.box}
          value={char}
          keyboardType="number-pad"
          maxLength={1}
          onChangeText={(text) => {
            const next = value.split('');
            next[index] = text.slice(-1);
            onChange(next.join('').slice(0, length));
          }}
        />
      ))}
    </View>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    box: {
      width: 44,
      height: 52,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      textAlign: 'center',
      color: C.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
  });

export default OTPInput;
