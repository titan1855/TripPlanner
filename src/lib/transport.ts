import type { Spot, TransportLeg } from '../types/database';
import { TRANSPORT_MODE_EMOJI } from '../utils/constants';

/** 此段是否有任何內容（用來判斷空段、是否顯示交通條） */
export function legHasContent(leg: TransportLeg): boolean {
  return !!(
    leg.mode ||
    leg.line ||
    leg.departures ||
    leg.board_at ||
    leg.alight_at ||
    leg.minutes != null ||
    leg.frequency_note ||
    leg.booking_status ||
    leg.cost_per_person != null ||
    leg.notes
  );
}

/** 取得有內容的交通段（過濾掉全空的段） */
export function transportLegs(spot: Spot): TransportLeg[] {
  return (spot.transport_legs ?? []).filter(legHasContent);
}

export function hasTransportInfo(spot: Spot): boolean {
  return transportLegs(spot).length > 0;
}

/** 任一段需預訂（新幹線購票等）→ 用於紅色提醒聚合 */
export function transportNeedsBooking(spot: Spot): boolean {
  return transportLegs(spot).some((l) => l.booking_status === 'need_booking');
}

/** 各段移動時間加總（皆選填，沒有就回 null） */
export function transportTotalMinutes(spot: Spot): number | null {
  const mins = transportLegs(spot)
    .map((l) => l.minutes)
    .filter((m): m is number => m != null);
  if (mins.length === 0) return null;
  return mins.reduce((a, b) => a + b, 0);
}

/** 單段的精簡描述，如「🚇 日比谷線 ・ 09:03/09:16 ・ 8 分」 */
export function legSummary(leg: TransportLeg): string {
  const parts: string[] = [];
  if (leg.line) parts.push(leg.line);
  else if (leg.board_at || leg.alight_at)
    parts.push([leg.board_at, leg.alight_at].filter(Boolean).join('→'));
  if (leg.departures) parts.push(leg.departures);
  if (leg.minutes != null) parts.push(`${leg.minutes} 分`);
  const emoji = leg.mode ? TRANSPORT_MODE_EMOJI[leg.mode] : '➡️';
  return `${emoji} ${parts.join(' ・ ') || '交通'}`;
}
