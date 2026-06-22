import type {
  AccommodationBookingStatus,
  BookingStatus,
  ChecklistCategory,
  ChecklistStatus,
  Importance,
  SpotCategory,
  SpotPriority,
  TicketBookingStatus,
  TicketNeedsBooking,
  TicketType,
  TransportMode,
  TripStatus,
  VisitStatus,
} from './enums';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface Trip {
  id: string;
  owner_id: string;
  title: string;
  destination: string | null;
  start_date: string;
  end_date: string;
  key_reminders: string | null;
  status: TripStatus;
  created_at: string;
  updated_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string | null;
  nickname: string;
  avatar_color: string | null;
  is_owner: boolean;
  created_at: string;
}

export interface TripDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  area_summary: string | null;
  highlight: string | null;
  plan_b: string | null;
  memo: string | null;
}

export interface Spot {
  id: string;
  trip_id: string;
  trip_day_id: string | null;
  name: string;
  address: string | null;
  category: SpotCategory;
  priority: SpotPriority;
  visit_status: VisitStatus;
  arrival_time: string | null;
  departure_time: string | null;
  duration_note: string | null;
  sort_order: number;
  alternative_group: string | null;
  booking_status: BookingStatus;
  opening_hours_note: string | null;
  est_cost_per_person: number | null;
  cost_currency: string | null;
  notes: string | null;
  /**
   * 到下一站的交通，依序多段（轉乘）。空陣列 = 沒有交通資訊。
   * 取代舊的扁平 transport_* 欄位（DB 仍保留舊欄位作安全網，但程式只讀寫此欄）。
   */
  transport_legs: TransportLeg[];
  created_at: string;
}

/** 一段交通（多段串起來 = 一趟含轉乘的旅程） */
export interface TransportLeg {
  mode: TransportMode | null;
  line: string | null;
  departures: string | null;
  board_at: string | null;
  alight_at: string | null;
  minutes: number | null;
  frequency_note: string | null;
  booking_status: BookingStatus | null;
  cost_per_person: number | null;
  notes: string | null;
}

export function emptyTransportLeg(): TransportLeg {
  return {
    mode: null,
    line: null,
    departures: null,
    board_at: null,
    alight_at: null,
    minutes: null,
    frequency_note: null,
    booking_status: null,
    cost_per_person: null,
    notes: null,
  };
}

export interface Accommodation {
  id: string;
  trip_id: string;
  name: string;
  address: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  booking_reference: string | null;
  booking_status: AccommodationBookingStatus;
  est_cost: number | null;
  cost_currency: string | null;
  notes: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  trip_id: string;
  title: string;
  ticket_type: TicketType;
  price: number | null;
  currency: string | null;
  needs_booking: TicketNeedsBooking;
  booking_status: TicketBookingStatus;
  booking_deadline: string | null;
  booking_reference: string | null;
  linked_spot_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  trip_id: string;
  category: ChecklistCategory;
  title: string;
  status: ChecklistStatus;
  due_date: string | null;
  importance: Importance;
  assignee_member_id: string | null;
  notes: string | null;
  created_at: string;
}
