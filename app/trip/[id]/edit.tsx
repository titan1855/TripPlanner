import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { TripForm } from '../../../src/components/trip/TripForm';
import { Button } from '../../../src/components/ui/Button';
import { deleteTrip, getTrip, updateTrip } from '../../../src/services/trips';
import type { Trip } from '../../../src/types/database';
import { COLORS } from '../../../src/utils/constants';

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    getTrip(id)
      .then(setTrip)
      .catch((e) => Alert.alert('載入失敗', e.message));
  }, [id]);

  function confirmDelete() {
    Alert.alert('刪除行程', '行程內所有資料（每日排程、景點…）都會一併刪除，確定？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTrip(id);
            router.dismissAll();
            router.replace('/');
          } catch (e: any) {
            Alert.alert('刪除失敗', e.message ?? '請稍後再試');
          }
        },
      },
    ]);
  }

  if (!trip) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TripForm
        initial={trip}
        submitTitle="儲存變更"
        onSubmit={async (values) => {
          await updateTrip(id, values);
          router.back();
        }}
      />
      <View style={styles.deleteWrap}>
        <Button title="刪除行程" variant="danger" onPress={confirmDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  deleteWrap: { padding: 16, paddingTop: 0 },
});
