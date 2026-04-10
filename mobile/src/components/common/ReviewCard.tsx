import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, type AppColors } from '@/src/theme/colors';
import Card from './Card';
import StarRating from './StarRating';

type ReviewCardProps = Readonly<{
  author: string;
  rating: number;
  comment: string;
  date: string;
}>;

const ReviewCard: React.FC<ReviewCardProps> = ({ author, rating, comment, date }) => {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.author}>{author}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <StarRating rating={rating} />
      <Text style={styles.comment}>{comment}</Text>
    </Card>
  );
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    author: {
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    date: {
      fontSize: 12,
      color: C.textHint,
    },
    comment: {
      marginTop: 8,
      fontSize: 14,
      color: C.textSecondary,
      lineHeight: 20,
    },
  });

export default ReviewCard;
