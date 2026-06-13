import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Ticket } from '../../types/database';
import {
  COLORS,
  TICKET_NEEDS_LABEL,
  TICKET_STATUS_COLOR,
  TICKET_STATUS_LABEL,
  TICKET_TYPE_EMOJI,
} from '../../utils/constants';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface Props {
  ticket: Ticket;
  linkedSpotName?: string | null;
  urgent?: boolean;
  onPress: () => void;
}

export function TicketCard({ ticket, linkedSpotName, urgent, onPress }: Props) {
  return (
    <Card onPress={onPress} style={urgent ? styles.urgentCard : undefined}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{TICKET_TYPE_EMOJI[ticket.ticket_type]}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {ticket.title}
        </Text>
        <Badge
          label={TICKET_STATUS_LABEL[ticket.booking_status]}
          color={TICKET_STATUS_COLOR[ticket.booking_status]}
        />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{TICKET_NEEDS_LABEL[ticket.needs_booking]}</Text>
        {ticket.price != null ? (
          <Text style={styles.meta}>
            💴 {ticket.price} {ticket.currency ?? ''}
          </Text>
        ) : null}
        {linkedSpotName ? <Text style={styles.meta}>📍 {linkedSpotName}</Text> : null}
      </View>
      {ticket.booking_deadline ? (
        <Text style={[styles.deadline, urgent && styles.deadlineUrgent]}>
          ⏰ {ticket.booking_deadline}
        </Text>
      ) : null}
      {ticket.booking_reference ? (
        <Text style={styles.reference} numberOfLines={1}>
          🔖 {ticket.booking_reference}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  urgentCard: { borderWidth: 1.5, borderColor: COLORS.danger },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 18 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  meta: { fontSize: 13, color: COLORS.textSecondary },
  deadline: { fontSize: 13, color: COLORS.warning, marginTop: 4 },
  deadlineUrgent: { color: COLORS.danger, fontWeight: '600' },
  reference: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
});
