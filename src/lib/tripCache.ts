import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Accommodation,
  ChecklistItem,
  Spot,
  Ticket,
  Trip,
  TripDay,
  TripMember,
} from '../types/database';

/**
 * 離線快取（AsyncStorage / web localStorage）。
 * 讀取 cache-first：先讀快取立即渲染，背景拉新資料再覆蓋。
 * 旅途中沒網路也要能看完整行程，因此進入行程時整包預載。
 */

export interface TripBundle {
  trip: Trip;
  days: TripDay[];
  spots: Spot[];
  accommodations: Accommodation[];
  tickets: Ticket[];
  checklist: ChecklistItem[];
  members: TripMember[];
  savedAt: number;
}

const TRIPS_LIST_KEY = 'cache:trips:v1';
const bundleKey = (tripId: string) => `cache:bundle:${tripId}:v1`;

async function readJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 容量滿或私密瀏覽等情況：靜默略過，不影響線上操作
  }
}

export const readCachedTrips = () => readJSON<Trip[]>(TRIPS_LIST_KEY);
export const writeCachedTrips = (trips: Trip[]) => writeJSON(TRIPS_LIST_KEY, trips);

export const readCachedBundle = (tripId: string) =>
  readJSON<TripBundle>(bundleKey(tripId));
export const writeCachedBundle = (bundle: TripBundle) =>
  writeJSON(bundleKey(bundle.trip.id), bundle);

/** 套用一筆 spot 變更到已快取的 bundle（樂觀更新後同步快取，離線重整才看得到） */
export async function patchCachedBundleSpot(
  tripId: string,
  spotId: string,
  patch: Partial<Spot>
): Promise<void> {
  const bundle = await readCachedBundle(tripId);
  if (!bundle) return;
  bundle.spots = bundle.spots.map((s) =>
    s.id === spotId ? { ...s, ...patch } : s
  );
  await writeCachedBundle(bundle);
}
