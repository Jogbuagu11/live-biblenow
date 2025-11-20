// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'client' | 'proxy';
  avatar_url?: string;
  created_at?: string;
}

// Event types
export interface Event {
  id: string;
  user_id: string;
  event_type: 'funeral' | 'wedding' | 'court' | 'hospital' | 'other';
  title: string;
  description?: string;
  location: string;
  date: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  stand_in_id?: string;
  created_at: string;
  updated_at: string;
}

// Stand-in types
export interface StandIn {
  id: string;
  user_id: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  rating?: number;
  total_events?: number;
  specialties?: string[];
  available?: boolean;
  created_at: string;
}

// Payment types
export interface Payment {
  id: string;
  event_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripe_payment_intent_id?: string;
  created_at: string;
}

// Message types
export interface Message {
  id: string;
  event_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

