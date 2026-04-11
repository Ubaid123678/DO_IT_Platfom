import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme, type ViewStyle } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';

type ProposalCardProps = Readonly<{
  compact?: boolean;
  providerName?: string;
  price?: number;
  rating?: number;
  eta?: string;
  style?: ViewStyle;
  onPress?: () => void;
}>;

const ProposalCard: React.FC<ProposalCardProps> = ({
  compact = false,
  providerName = 'Provider',
  price = 0,
  rating = 0,
  eta = 'Delivery in 1 day',
  style,
  onPress,
}) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={[styles.card, compact ? styles.cardCompact : null, style]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{providerName.slice(0, 1).toUpperCase()}</Text>
      </View>

      <View style={styles.contentWrap}>
        <View style={styles.topRow}>
          <Text style={styles.providerName} numberOfLines={1}>
            {providerName}
          </Text>
          <Text style={styles.priceText}>{`$${price.toFixed(0)}`}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={C.amber} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.etaText} numberOfLines={1}>
            {eta}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: C.background,
      borderColor: C.cardBorder,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    cardCompact: {
      minHeight: 68,
    },
    avatarCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primaryLight,
    },
    avatarText: {
      fontSize: 13,
      fontWeight: '700',
      color: C.primary,
    },
    contentWrap: {
      flex: 1,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    providerName: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: C.textPrimary,
    },
    priceText: {
      fontSize: 14,
      fontWeight: '700',
      color: C.primary,
    },
    bottomRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      fontSize: 12,
      color: C.textSecondary,
      fontWeight: '500',
    },
    etaText: {
      fontSize: 12,
      color: C.textSecondary,
      flexShrink: 1,
    },
  });

export default ProposalCard;
