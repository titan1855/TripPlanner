import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { COLORS } from '../../utils/constants';
import { Button } from '../ui/Button';

interface Props {
  onAdd: (name: string) => Promise<void>;
}

export function QuickAddBar({ onAdd }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await onAdd(trimmed);
      setName('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="想去哪？輸入名稱快速加入"
        placeholderTextColor={COLORS.textSecondary}
        returnKeyType="done"
        onSubmitEditing={handleAdd}
      />
      <Button title="加入" onPress={handleAdd} loading={loading} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  button: { paddingHorizontal: 16 },
});
