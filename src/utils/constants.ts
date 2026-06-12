import type {
  BookingStatus,
  SpotCategory,
  SpotPriority,
  TransportMode,
  TripStatus,
} from '../types/enums';

export const COLORS = {
  primary: '#2F6FED',
  primaryDark: '#1F4FB8',
  background: '#F5F6FA',
  card: '#FFFFFF',
  text: '#1A1D26',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  danger: '#E5484D',
  success: '#2FA968',
  warning: '#E89B2D',
} as const;

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  planning: '規劃中',
  ongoing: '旅行中',
  completed: '已結束',
};

export const TRIP_STATUS_COLOR: Record<TripStatus, string> = {
  planning: COLORS.primary,
  ongoing: COLORS.success,
  completed: COLORS.textSecondary,
};

export const CATEGORY_LABEL: Record<SpotCategory, string> = {
  sight: '景點',
  food: '美食',
  shopping: '購物',
  hotel: '住宿',
  transport_hub: '交通樞紐',
  other: '其他',
};

export const CATEGORY_EMOJI: Record<SpotCategory, string> = {
  sight: '🏞',
  food: '🍜',
  shopping: '🛍',
  hotel: '🏨',
  transport_hub: '🚉',
  other: '📌',
};

export const PRIORITY_LABEL: Record<SpotPriority, string> = {
  must: '非去不可',
  want: '想去',
  optional: '順路再說',
};

export const PRIORITY_COLOR: Record<SpotPriority, string> = {
  must: '#E5484D',
  want: '#2F6FED',
  optional: '#9CA3AF',
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  none: '不需預約',
  need_booking: '需預訂',
  suggested: '建議預約',
  booked: '已預約',
  on_site: '現場處理',
  tbd: '待確認',
};

export const BOOKING_STATUS_COLOR: Record<BookingStatus, string> = {
  none: COLORS.textSecondary,
  need_booking: COLORS.danger,
  suggested: COLORS.warning,
  booked: COLORS.success,
  on_site: COLORS.primary,
  tbd: COLORS.textSecondary,
};

export const TRANSPORT_MODE_LABEL: Record<TransportMode, string> = {
  walk: '步行',
  metro: '地鐵',
  train: '鐵路',
  bus: '巴士',
  car: '開車',
  taxi: '計程車',
  ferry: '渡輪',
  flight: '飛機',
  other: '其他',
};

export const TRANSPORT_MODE_EMOJI: Record<TransportMode, string> = {
  walk: '🚶',
  metro: '🚇',
  train: '🚆',
  bus: '🚌',
  car: '🚗',
  taxi: '🚕',
  ferry: '⛴',
  flight: '✈️',
  other: '➡️',
};
