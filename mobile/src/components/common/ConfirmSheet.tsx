import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

// Themed replacement for the native Alert.alert confirmation, which always
// renders in the OS (white/system) styling and ignores the app theme.
type ConfirmSheetProps = Readonly<{
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>;

const ConfirmSheet: React.FC<ConfirmSheetProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onCancel} disabled={busy}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, destructive ? styles.destructiveBtn : styles.confirmBtn, busy && styles.btnDisabled]}
              onPress={onConfirm}
              disabled={busy}
            >
              <Text style={styles.confirmText}>{busy ? 'Please wait...' : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.overlay },
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 20,
    },
    title: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
    message: { fontSize: 14, color: C.textSecondary, lineHeight: 20, marginTop: 8 },
    row: { flexDirection: 'row', gap: 12, marginTop: 20 },
    btn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cancelBtn: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder },
    confirmBtn: { backgroundColor: C.primary },
    destructiveBtn: { backgroundColor: C.error },
    btnDisabled: { opacity: 0.6 },
    cancelText: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
    confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });

export default ConfirmSheet;
