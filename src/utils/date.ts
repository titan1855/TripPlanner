const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

/** 'YYYY-MM-DD' → 本地 Date（避免時區偏移） */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** start ~ end（含兩端）的所有日期，start > end 回傳空陣列 */
export function eachDateOfRange(startISO: string, endISO: string): string[] {
  const dates: string[] = [];
  const end = parseDate(endISO);
  for (let d = parseDate(startISO); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(toISODate(d));
  }
  return dates;
}

/** '2026-06-12' → '6/12 (五)' */
export function formatDateLabel(iso: string): string {
  const d = parseDate(iso);
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAYS_ZH[d.getDay()]})`;
}

/** '2026-06-12' → '2026/6/12' */
export function formatFullDate(iso: string): string {
  const d = parseDate(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateRange(startISO: string, endISO: string): string {
  return `${formatFullDate(startISO)} – ${formatFullDate(endISO)}`;
}

export function tripDayCount(startISO: string, endISO: string): number {
  return eachDateOfRange(startISO, endISO).length;
}

/** 距離出發還有幾天（今天出發 = 0，已出發為負） */
export function daysUntil(startISO: string): number {
  const ms = parseDate(startISO).getTime() - parseDate(todayISO()).getTime();
  return Math.round(ms / 86_400_000);
}

/** '09:30:00' 或 '09:30' → '09:30'；null → '' */
export function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  return time.slice(0, 5);
}
