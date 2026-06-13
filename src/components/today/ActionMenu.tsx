import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../utils/constants';

export interface ActionItem {
  label: string;
  emoji: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  disabledHint?: string;
}

interface Props {
  visible: boolean;
  title: string;
  actions: ActionItem[];
  onClose: () => void;
}

/** 點擊式動作選單（取代左滑手勢，web 上手勢不可靠） */
export function ActionMenu({ visible, title, actions, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {actions.map((a) => (
            <Pressable
              key={a.label}
              disabled={a.disabled}
              onPress={() => {
                onClose();
                a.onPress();
              }}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.actionPressed,
                a.disabled && styles.actionDisabled,
              ]}
            >
              <Text style={styles.actionEmoji}>{a.emoji}</Text>
              <Text
                style={[styles.actionLabel, a.destructive && styles.actionDestructive]}
              >
                {a.label}
              </Text>
              {a.disabled && a.disabledHint ? (
                <Text style={styles.disabledHint}>{a.disabledHint}</Text>
              ) : null}
            </Pressable>
          ))}
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 28,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 8,
    gap: 12,
  },
  actionPressed: { opacity: 0.7 },
  actionDisabled: { opacity: 0.4 },
  actionEmoji: { fontSize: 20 },
  actionLabel: { fontSize: 17, fontWeight: '600', color: COLORS.text, flex: 1 },
  actionDestructive: { color: COLORS.danger },
  disabledHint: { fontSize: 12, color: COLORS.textSecondary },
  cancel: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelText: { fontSize: 17, fontWeight: '700', color: COLORS.textSecondary },
});
