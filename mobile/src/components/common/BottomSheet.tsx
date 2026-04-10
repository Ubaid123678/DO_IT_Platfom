import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type BottomSheetProps = Readonly<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}>;

const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, title, children }) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </View>
    </Modal>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: C.overlay,
    },
    sheet: {
      backgroundColor: C.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderColor: C.cardBorder,
      borderWidth: 0.5,
      padding: 16,
      gap: 12,
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: C.textPrimary,
    },
  });

export default BottomSheet;
