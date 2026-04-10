import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type Category = {
  id: string;
  name: string;
};

type CategoryGridProps = Readonly<{
  categories: Category[];
  selectedId?: string;
  onSelect: (id: string) => void;
}>;

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, selectedId, onSelect }) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => item.id}
      numColumns={3}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => {
        const selected = selectedId === item.id;

        return (
          <Pressable
            style={[styles.item, selected ? styles.selectedItem : undefined]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[styles.itemLabel, selected ? styles.selectedLabel : undefined]}>{item.name}</Text>
          </Pressable>
        );
      }}
    />
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    row: {
      gap: 8,
      marginBottom: 8,
    },
    item: {
      flex: 1,
      minHeight: 44,
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    selectedItem: {
      borderColor: C.primary,
      backgroundColor: C.primaryLight,
    },
    itemLabel: {
      fontSize: 12,
      color: C.textSecondary,
      textAlign: 'center',
    },
    selectedLabel: {
      color: C.primary,
      fontWeight: '600',
    },
  });

export default CategoryGrid;
