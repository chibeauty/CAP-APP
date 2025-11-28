export type AlertLevel = 'low' | 'medium' | 'high' | 'critical';

export type UserRole = 'user' | 'security' | 'admin';

export type EventStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export type CommunicationType = 'chat' | 'video' | 'ptt' | 'audio';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
  created_by: string;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  event_id?: string;
  level: AlertLevel;
  location?: {
    lat: number;
    lng: number;
  };
  message?: string;
  audio_recording_url?: string;
  status: 'active' | 'resolved' | 'cancelled';
  created_at: string;
  resolved_at?: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  type: CommunicationType;
  created_at: string;
}

export interface Wearable {
  id: string;
  user_id: string;
  name: string;
  device_type: string;
  mac_address?: string;
  is_connected: boolean;
  battery_level?: number;
  last_sync?: string;
}

export interface IncidentReport {
  id: string;
  user_id: string;
  alert_id?: string;
  event_id?: string;
  title: string;
  description: string;
  location?: {
    lat: number;
    lng: number;
  };
  attachments?: string[];
  created_at: string;
}

export interface DecoyConfig {
  enabled: boolean;
  app_type: 'calculator' | 'weather' | 'notes';
  activation_gesture: 'triple_tap' | 'long_press' | 'invisible_button';
}

