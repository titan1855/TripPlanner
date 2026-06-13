import { useCallback, useEffect, useState } from 'react';
import {
  patchCachedBundleSpot,
  readCachedBundle,
  readCachedTrips,
  writeCachedBundle,
  writeCachedTrips,
  type TripBundle,
} from '../lib/tripCache';
import { enqueueSpotPatch, flushSpotQueue, pendingCount } from '../lib/writeQueue';
import { listAccommodations } from '../services/accommodations';
import { listChecklist } from '../services/checklist';
import { listDays } from '../services/days';
import { listMembers } from '../services/members';
import { listSpots } from '../services/spots';
import { listTickets } from '../services/tickets';
import { listTrips } from '../services/trips';
import type { Spot, Trip, TripDay } from '../types/database';
import { todayISO } from '../utils/date';
import { useOnlineStatus } from './useOnlineStatus';

type Status = 'loading' | 'ready' | 'no-active';

interface SpotPatchOp {
  spotId: string;
  patch: Partial<Spot>;
}

const TODAY = todayISO();

function pickActiveTrip(trips: Trip[]): Trip | null {
  const ongoing = trips.filter((t) => t.status === 'ongoing');
  if (ongoing.length > 0) return ongoing[0];
  const covering = trips
    .filter((t) => t.status !== 'completed' && t.start_date <= TODAY && TODAY <= t.end_date)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  return covering[0] ?? null;
}

function pickUpcomingTrip(trips: Trip[]): Trip | null {
  return (
    trips
      .filter((t) => t.status !== 'completed' && t.start_date > TODAY)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] ?? null
  );
}

async function fetchBundle(trip: Trip): Promise<TripBundle> {
  const [days, spots, accommodations, tickets, checklist, members] = await Promise.all([
    listDays(trip.id),
    listSpots(trip.id),
    listAccommodations(trip.id),
    listTickets(trip.id),
    listChecklist(trip.id),
    listMembers(trip.id),
  ]);
  return {
    trip,
    days,
    spots,
    accommodations,
    tickets,
    checklist,
    members,
    savedAt: Date.now(),
  };
}

export function useTodayTrip() {
  const online = useOnlineStatus();
  const [status, setStatus] = useState<Status>('loading');
  const [fromCache, setFromCache] = useState(false);
  const [pending, setPending] = useState(0);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<TripDay[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [upcomingTrip, setUpcomingTrip] = useState<Trip | null>(null);

  const refreshPending = useCallback(async () => {
    setPending(await pendingCount());
  }, []);

  const load = useCallback(async () => {
    // 1) cache-first：先用快取立即渲染
    const cachedTrips = await readCachedTrips();
    if (cachedTrips) {
      const active = pickActiveTrip(cachedTrips);
      if (active) {
        const bundle = await readCachedBundle(active.id);
        if (bundle) {
          setTrip(bundle.trip);
          setDays(bundle.days);
          setSpots(bundle.spots);
          setStatus('ready');
          setFromCache(true);
        }
      } else {
        setUpcomingTrip(pickUpcomingTrip(cachedTrips));
      }
    }

    // 2) 背景拉最新（離線就停在快取）
    try {
      const trips = await listTrips();
      await writeCachedTrips(trips);
      const active = pickActiveTrip(trips);
      if (!active) {
        setTrip(null);
        setUpcomingTrip(pickUpcomingTrip(trips));
        setStatus('no-active');
        setFromCache(false);
        return;
      }
      const bundle = await fetchBundle(active);
      await writeCachedBundle(bundle);
      setTrip(bundle.trip);
      setDays(bundle.days);
      setSpots(bundle.spots);
      setStatus('ready');
      setFromCache(false);
    } catch {
      // 離線：若先前沒有任何快取可顯示，標記為 no-active（會顯示提示）
      setStatus((prev) => (prev === 'loading' ? 'no-active' : prev));
    }
    await refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    load();
  }, [load]);

  // 回到線上時自動 flush 佇列
  useEffect(() => {
    if (online) {
      flushSpotQueue().then(refreshPending);
    }
  }, [online, refreshPending]);

  /** 樂觀更新本地 + 快取 + 入佇列，線上則立即嘗試送出 */
  const applySpotPatches = useCallback(
    async (ops: SpotPatchOp[]) => {
      setSpots((prev) =>
        prev.map((s) => {
          const op = ops.find((o) => o.spotId === s.id);
          return op ? { ...s, ...op.patch } : s;
        })
      );
      if (trip) {
        for (const op of ops) {
          await patchCachedBundleSpot(trip.id, op.spotId, op.patch);
          await enqueueSpotPatch(op.spotId, op.patch);
        }
      }
      if (online) await flushSpotQueue();
      await refreshPending();
    },
    [trip, online, refreshPending]
  );

  return {
    online,
    status,
    fromCache,
    pending,
    trip,
    days,
    spots,
    upcomingTrip,
    todayDate: TODAY,
    reload: load,
    applySpotPatches,
  };
}
