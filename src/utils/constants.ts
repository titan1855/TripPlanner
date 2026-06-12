import type { TripStatus } from '../types/enums';

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
