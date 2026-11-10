export type ServiceCategory = "Todos" | "Cabelo" | "Barba" | "Combo" | "Estética";

export interface BarbershopService {
  id: string;
  name: string;
  category: Exclude<ServiceCategory, "Todos">;
  description: string;
  price: number;
  duration_minutes: number;
  loyalty_points: number;
}

export interface Barber {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  avatar_initials: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BarberAppointmentItem {
  id: string;
  date: string;
  time: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  price: number;
  duration_minutes: number;
  loyalty_points: number;
  barber_id: string;
  status: "confirmed" | "completed" | "cancelled";
  origin: "whatsapp_link" | "walk_in";
}

export interface ClientProfile {
  id?: string;
  full_name: string;
  phone: string;
  email: string;
  birth_date: string;
  preferred_barber_id: string;
  whatsapp_opt_in: boolean;
  notes?: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
}

export interface LoyaltyTransaction {
  id: string;
  type: "earn" | "redeem";
  points: number;
  description: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  sender_role: "client" | "barber";
  sender_name: string;
  content: string;
  timestamp: string;
  sent_via_whatsapp?: boolean;
}
