import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type ChatBubbleProps = Readonly<{
  message: string;
  timestamp: string;
  isMine: boolean;
}>;

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, timestamp, isMine }) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <View style={[styles.container, isMine ? styles.mine : styles.theirs]}>
      <Text style={[styles.message, isMine ? styles.mineText : styles.theirsText]}>{message}</Text>
      <Text style={[styles.time, isMine ? styles.mineTime : styles.theirsTime]}>{timestamp}</Text>
    </View>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      maxWidth: '82%',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
    },
    mine: {
      alignSelf: 'flex-end',
      backgroundColor: C.primary,
      borderBottomRightRadius: 6,
    },
    theirs: {
      alignSelf: 'flex-start',
      backgroundColor: C.card,
      borderColor: C.cardBorder,
      borderWidth: 0.5,
      borderBottomLeftRadius: 6,
    },
    message: {
      fontSize: 14,
      marginBottom: 4,
    },
    mineText: {
      color: C.card,
    },
    theirsText: {
      color: C.textPrimary,
    },
    time: {
      fontSize: 10,
    },
    mineTime: {
      color: C.primaryLight,
      textAlign: 'right',
    },
    theirsTime: {
      color: C.textHint,
      textAlign: 'right',
    },
  });

export default ChatBubble;
