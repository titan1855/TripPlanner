import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Trip } from '../../types/database';
import {
  COLORS,
  TRIP_STATUS_COLOR,
  TRIP_STATUS_LABEL,
} from '../../utils/constants';
import { daysUntil, formatDateRange, tripDayCount } from '../../utils/date';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface Props {
  trip: Trip;
  onPress: () => void;
}

export function TripCard({ trip, onPress }: Props) {
  const countdown = daysUntil(trip.start_date);
  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {trip.title}
        </Text>
        <Badge label={TRIP_STATUS_LABEL[trip.status]} color={TRIP_STATUS_COLOR[trip.status]} />
      </View>
      {trip.destination ? <Text style={styles.destination}>📍 {trip.destination}</Text> : null}
      <Text style={styles.dates}>
        {formatDateRange(trip.start_date, trip.end_date)} ・{' '}
        {tripDayCount(trip.start_date, trip.end_date)} 天
      </Text>
      {trip.status === 'planning' && countdown > 0 ? (
        <Text style={styles.countdown}>還有 {countdown} 天出發</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  destination: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  dates: { fontSize: 14, color: COLORS.textSecondary },
  countdown: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
