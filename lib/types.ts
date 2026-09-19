export type ServiceCategory = "auto" | "textile" | "location";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

export type Service = {
  id: string;
  slug: string;
  category: ServiceCategory;
  emoji: string;
  name: string;
  tagline: string;
  description: string;
  details: string[];
  price_from: number;
  price_to: number | null;
  duration_min: number;
  image_path: string | null;
  is_active: boolean;
  is_bookable: boolean;
  sort_order: number;
};

export type ServiceOption = {
  id: string;
  service_id: string | null;
  slug: string;
  name: string;
  description: string;
  price: number;
  duration_min: number;
  sort_order: number;
};

export type VehicleCategory = {
  id: string;
  slug: string;
  label: string;
  description: string;
  price_delta: number;
  duration_delta: number;
  applies_to: ServiceCategory;
  sort_order: number;
};

export type Faq = { id: string; question: string; answer: string; sort_order: number };

export type Testimonial = {
  id: string;
  author: string;
  city: string;
  rating: number;
  content: string;
  service: string;
  is_demo: boolean;
};

export type GalleryItem = {
  id: string;
  title: string;
  subtitle: string;
  category: ServiceCategory;
  image_path: string;
};

export type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  notes: string;
  created_at: string;
};

export type Booking = {
  id: string;
  reference: string;
  customer_id: string;
  service_id: string;
  service_name: string;
  vehicle_slug: string | null;
  vehicle_label: string | null;
  options: { slug: string; name: string; price: number }[];
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_min: number;
  status: BookingStatus;
  address: string;
  postal_code: string;
  city: string;
  access_notes: string;
  customer_notes: string;
  admin_notes: string;
  price_estimate: number;
  deposit_amount: number;
  deposit_status: PaymentStatus;
  source: string;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  customers?: Customer | null;
};

export type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  provider: string;
  provider_reference: string;
  card_brand: string;
  card_last4: string;
  cardholder: string;
  is_demo: boolean;
  paid_at: string | null;
  created_at: string;
  bookings?: Pick<Booking, "reference" | "service_name" | "scheduled_date"> | null;
};

export type BookingEvent = {
  id: string;
  booking_id: string;
  kind: string;
  message: string;
  actor: string;
  created_at: string;
};

export type Slot = { slot_start: string; slot_end: string };
