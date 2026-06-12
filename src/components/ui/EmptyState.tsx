import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../utils/constants';
import { Button } from './Button';

interface Props {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji = '🧳', title, subtitle, actionTitle, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  action: { marginTop: 24, minWidth: 180 },
});
