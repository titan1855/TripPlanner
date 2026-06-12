import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { COLORS } from '../../src/utils/constants';

/** 今日模式完整功能在 Phase 4 實作 */
export default function TodayScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        emoji="📍"
        title="今日模式"
        subtitle="旅途中自動顯示今天的行程：現在去哪、怎麼去、一鍵導航。Phase 4 推出。"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
