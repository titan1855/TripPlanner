export type TripStatus = 'planning' | 'ongoing' | 'completed';

export type SpotCategory =
  | 'sight'
  | 'food'
  | 'shopping'
  | 'hotel'
  | 'transport_hub'
  | 'other';

export type SpotPriority = 'must' | 'want' | 'optional';

export type VisitStatus = 'pending' | 'done' | 'skipped';

export type BookingStatus =
  | 'none'
  | 'need_booking'
  | 'suggested'
  | 'booked'
  | 'on_site'
  | 'tbd';

export type TransportMode =
  | 'walk'
  | 'metro'
  | 'train'
  | 'bus'
  | 'car'
  | 'taxi'
  | 'ferry'
  | 'flight'
  | 'other';

export type AccommodationBookingStatus = 'booked' | 'tbd' | 'cancelled';

export type TicketType = 'transport' | 'admission' | 'pass' | 'other';

export type TicketNeedsBooking = 'required' | 'on_site' | 'included';

export type TicketBookingStatus = 'not_booked' | 'booked' | 'collected';

export type ChecklistCategory =
  | 'document'
  | 'transport'
  | 'ticket'
  | 'packing'
  | 'other';

export type ChecklistStatus = 'todo' | 'done';

export type Importance = 'high' | 'medium' | 'low';
