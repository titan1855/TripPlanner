import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { Spot } from '../types/database';

/**
 * 寫入佇列（local-first）：
 * 1. 所有寫入先樂觀更新本地 + 快取
 * 2. 同時把這筆變更推進 pending queue（AsyncStorage）
 * 3. 有網路時依序 flush 到 Supabase，失敗保留 queue 下次重試
 * 4. 衝突策略 last-write-wins（個人旅遊場景足夠）
 *
 * Phase 4 的旅途操作（完成/跳過/移到明天/退回口袋/候選選定）全是 spots 的
 * 欄位更新，因此佇列只處理 spot patch；多筆 row 的操作拆成多筆 patch。
 */

const KEY = 'queue:spots:v1';

export interface SpotOp {
  opId: string;
  spotId: string;
  patch: Partial<Spot>;
  ts: number;
}

async function readQueue(): Promise<SpotOp[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SpotOp[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(ops: SpotOp[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(ops));
}

export async function enqueueSpotPatch(
  spotId: string,
  patch: Partial<Spot>
): Promise<void> {
  const ops = await readQueue();
  ops.push({
    opId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    spotId,
    patch,
    ts: Date.now(),
  });
  await writeQueue(ops);
}

export async function pendingCount(): Promise<number> {
  return (await readQueue()).length;
}

/**
 * 依序送出佇列。成功的移除，失敗的保留（離線時整批會留著下次重試）。
 * 回傳剩餘未送出筆數。
 */
export async function flushSpotQueue(): Promise<number> {
  const ops = await readQueue();
  if (ops.length === 0) return 0;

  const remaining: SpotOp[] = [];
  for (const op of ops) {
    const { error } = await supabase
      .from('spots')
      .update(op.patch)
      .eq('id', op.spotId);
    if (error) remaining.push(op);
  }
  await writeQueue(remaining);
  return remaining.length;
}
