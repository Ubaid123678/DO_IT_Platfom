import React from 'react';
import { StyleSheet, useColorScheme, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type CardProps = Readonly<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

const Card: React.FC<CardProps> = ({ children, style }) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return <View style={[styles.container, style]}>{children}</View>;
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: C.card,
      borderColor: C.cardBorder,
      borderWidth: 0.5,
      borderRadius: 16,
      padding: 16,
    },
  });

export default Card;
