import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, View, useColorScheme } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type StarRatingProps = Readonly<{
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
}>;

const StarRating: React.FC<StarRatingProps> = ({ rating, onChange, size = 18 }) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }, (_, index) => {
        const value = index + 1;
        const iconName = rating >= value ? 'star' : 'star-outline';

        return (
          <Pressable key={value} onPress={() => onChange?.(value)} disabled={!onChange}>
            <Ionicons name={iconName} size={size} color={C.amber} />
          </Pressable>
        );
      })}
    </View>
  );
};

const makeStyles = (_C: AppColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
  });

export default StarRating;
