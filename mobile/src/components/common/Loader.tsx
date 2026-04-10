import React from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type LoaderProps = Readonly<{
  fullscreen?: boolean;
}>;

const Loader: React.FC<LoaderProps> = ({ fullscreen = true }) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <View style={fullscreen ? styles.fullscreen : styles.inline}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    fullscreen: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.background,
    },
    inline: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
  });

export default Loader;
