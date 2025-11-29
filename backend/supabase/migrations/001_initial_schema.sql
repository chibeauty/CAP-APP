-- CAP App Database Schema
-- This migration creates all tables, relationships, and indexes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'official' CHECK (role IN ('official', 'security_admin', 'security_team', 'system')),
  phone TEXT,
  avatar_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  location_coords JSONB, -- {lat: number, lng: number}
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  risk_assessment JSONB, -- {level: 'low'|'medium'|'high'|'critical', factors: string[]}
  threat_level TEXT DEFAULT 'low' CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  assigned_security_team UUID[], -- Array of security team member IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- ALERTS TABLE
-- ============================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('low', 'medium', 'high', 'critical')),
  location JSONB, -- {lat: number, lng: number, accuracy: number, timestamp: timestamp}
  message TEXT,
  audio_recording_url TEXT,
  is_silent_duress BOOLEAN DEFAULT false, -- True if triggered via duress password
  trigger_source TEXT DEFAULT 'manual' CHECK (trigger_source IN ('manual', 'wearable_button', 'wearable_heartrate', 'wearable_gesture', 'duress_password', 'system')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'cancelled')),
  acknowledged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WEARABLES TABLE
-- ============================================
CREATE TABLE wearables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('watch', 'button', 'bracelet', 'pendant', 'other')),
  mac_address TEXT UNIQUE,
  bluetooth_device_id TEXT,
  is_connected BOOLEAN DEFAULT false,
  is_paired BOOLEAN DEFAULT false,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  firmware_version TEXT,
  last_sync TIMESTAMP WITH TIME ZONE,
  last_heart_rate INTEGER,
  gesture_config JSONB, -- Configuration for gesture-based alerts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- LOCATION LOGS TABLE
-- ============================================
CREATE TABLE location_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_emergency_tracking BOOLEAN DEFAULT false -- True if location is being tracked during active alert
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT NOT NULL, -- Can be user_id, event_id, or custom thread ID
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'chat' CHECK (type IN ('chat', 'video', 'ptt', 'audio', 'broadcast')),
  audio_url TEXT, -- For PTT and audio messages
  video_call_session_id TEXT, -- For WebRTC video calls
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- MESSAGE THREADS TABLE
-- ============================================
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_key TEXT UNIQUE NOT NULL, -- Unique identifier for the thread
  thread_type TEXT NOT NULL CHECK (thread_type IN ('direct', 'event', 'group', 'broadcast', 'emergency')),
  participants UUID[] NOT NULL, -- Array of user IDs
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INCIDENT REPORTS TABLE
-- ============================================
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location JSONB, -- {lat: number, lng: number}
  attachments TEXT[], -- Array of file URLs
  timeline JSONB, -- Chronological event timeline
  audio_files TEXT[], -- Array of audio recording URLs
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'archived')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- DECOY MODE CONFIGURATION TABLE
-- ============================================
CREATE TABLE decoy_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  app_type TEXT DEFAULT 'calculator' CHECK (app_type IN ('calculator', 'weather', 'notes')),
  activation_gesture TEXT DEFAULT 'triple_tap' CHECK (activation_gesture IN ('triple_tap', 'long_press', 'invisible_button')),
  duress_password_hash TEXT, -- Encrypted duress password
  silent_alert_enabled BOOLEAN DEFAULT true,
  fake_interface_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DEVICE SESSIONS TABLE
-- ============================================
CREATE TABLE device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL, -- Browser/device identifier
  user_agent TEXT,
  ip_address TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('alert', 'message', 'event', 'system', 'emergency')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Additional notification data
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  sent_via TEXT[], -- Array of channels: ['push', 'sms', 'email']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EVENT ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE event_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'security_team' CHECK (role IN ('security_team', 'coordinator', 'responder')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(event_id, user_id)
);

-- ============================================
-- AUDIO RECORDINGS TABLE
-- ============================================
CREATE TABLE audio_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration_seconds INTEGER,
  format TEXT DEFAULT 'webm',
  is_emergency_recording BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- BROADCAST LOGS TABLE
-- ============================================
CREATE TABLE broadcast_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  recipients UUID[] NOT NULL,
  sent_via TEXT[] NOT NULL, -- ['push', 'sms', 'email']
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_email ON profiles(email) WHERE deleted_at IS NULL;

CREATE INDEX idx_events_status ON events(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_created_by ON events(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_start_time ON events(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_threat_level ON events(threat_level) WHERE deleted_at IS NULL;

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_event_id ON alerts(event_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_level ON alerts(level);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_is_silent_duress ON alerts(is_silent_duress);

CREATE INDEX idx_wearables_user_id ON wearables(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_wearables_mac_address ON wearables(mac_address) WHERE deleted_at IS NULL;
CREATE INDEX idx_wearables_is_connected ON wearables(is_connected) WHERE deleted_at IS NULL;

CREATE INDEX idx_location_logs_user_id ON location_logs(user_id);
CREATE INDEX idx_location_logs_event_id ON location_logs(event_id);
CREATE INDEX idx_location_logs_alert_id ON location_logs(alert_id);
CREATE INDEX idx_location_logs_timestamp ON location_logs(timestamp DESC);
CREATE INDEX idx_location_logs_emergency ON location_logs(is_emergency_tracking) WHERE is_emergency_tracking = true;

CREATE INDEX idx_messages_thread_id ON messages(thread_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_sender_id ON messages(sender_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_created_at ON messages(created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX idx_message_threads_thread_key ON message_threads(thread_key);
CREATE INDEX idx_message_threads_event_id ON message_threads(event_id);
CREATE INDEX idx_message_threads_alert_id ON message_threads(alert_id);

CREATE INDEX idx_incident_reports_user_id ON incident_reports(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_incident_reports_alert_id ON incident_reports(alert_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_incident_reports_event_id ON incident_reports(event_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_event_assignments_event_id ON event_assignments(event_id);
CREATE INDEX idx_event_assignments_user_id ON event_assignments(user_id);

CREATE INDEX idx_audio_recordings_user_id ON audio_recordings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_audio_recordings_alert_id ON audio_recordings(alert_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_device_sessions_user_id ON device_sessions(user_id);
CREATE INDEX idx_device_sessions_is_active ON device_sessions(is_active) WHERE is_active = true;

-- ============================================
-- FUNCTIONS FOR UPDATED_AT TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wearables_updated_at BEFORE UPDATE ON wearables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON message_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_reports_updated_at BEFORE UPDATE ON incident_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decoy_configs_updated_at BEFORE UPDATE ON decoy_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION TO UPDATE LAST_SEEN_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_seen_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_seen_on_location_log
  AFTER INSERT ON location_logs
  FOR EACH ROW EXECUTE FUNCTION update_user_last_seen();

CREATE TRIGGER update_last_seen_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_user_last_seen();

