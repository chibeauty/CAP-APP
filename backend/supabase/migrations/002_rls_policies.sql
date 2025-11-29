-- CAP App Row Level Security (RLS) Policies
-- Strict security rules following PRD requirements

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearables ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE decoy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Function to check if user is security team member
CREATE OR REPLACE FUNCTION is_security_team(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role IN ('security_admin', 'security_team')
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is assigned to event
CREATE OR REPLACE FUNCTION is_assigned_to_event(user_id UUID, event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM event_assignments
    WHERE event_assignments.user_id = is_assigned_to_event.user_id
    AND event_assignments.event_id = is_assigned_to_event.event_id
  ) OR EXISTS (
    SELECT 1 FROM events
    WHERE events.id = is_assigned_to_event.event_id
    AND user_id = ANY(events.assigned_security_team)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user created the event
CREATE OR REPLACE FUNCTION is_event_creator(user_id UUID, event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events
    WHERE id = event_id
    AND created_by = user_id
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if alert is active
CREATE OR REPLACE FUNCTION is_active_alert(alert_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM alerts
    WHERE id = alert_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Officials can view their own profile
CREATE POLICY "Officials can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id AND deleted_at IS NULL);

-- Officials can update their own profile
CREATE POLICY "Officials can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id AND deleted_at IS NULL);

-- Security team can view profiles of assigned officials
CREATE POLICY "Security team can view assigned officials"
ON profiles FOR SELECT
USING (
  is_security_team(auth.uid())
  AND deleted_at IS NULL
  AND (
    -- Can see officials assigned to their events
    EXISTS (
      SELECT 1 FROM event_assignments ea
      JOIN events e ON e.id = ea.event_id
      WHERE ea.user_id = auth.uid()
      AND e.created_by = profiles.id
    )
    OR
    -- Can see officials with active alerts
    EXISTS (
      SELECT 1 FROM alerts
      WHERE alerts.user_id = profiles.id
      AND alerts.status = 'active'
    )
  )
);

-- Security admins can view all profiles
CREATE POLICY "Security admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'security_admin'
    AND deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

-- ============================================
-- EVENTS POLICIES
-- ============================================

-- Officials can view their own events
CREATE POLICY "Officials can view own events"
ON events FOR SELECT
USING (
  created_by = auth.uid()
  AND deleted_at IS NULL
);

-- Officials can create events
CREATE POLICY "Officials can create events"
ON events FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Officials can update their own events
CREATE POLICY "Officials can update own events"
ON events FOR UPDATE
USING (created_by = auth.uid() AND deleted_at IS NULL);

-- Officials can delete their own events
CREATE POLICY "Officials can delete own events"
ON events FOR UPDATE
USING (created_by = auth.uid() AND deleted_at IS NULL)
WITH CHECK (deleted_at IS NOT NULL);

-- Security team can view assigned events
CREATE POLICY "Security team can view assigned events"
ON events FOR SELECT
USING (
  is_security_team(auth.uid())
  AND deleted_at IS NULL
  AND (
    is_assigned_to_event(auth.uid(), id)
    OR is_event_creator(auth.uid(), id)
  )
);

-- Security team can view events with active alerts
CREATE POLICY "Security team can view events with active alerts"
ON events FOR SELECT
USING (
  is_security_team(auth.uid())
  AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM alerts
    WHERE alerts.event_id = events.id
    AND alerts.status = 'active'
  )
);

-- ============================================
-- ALERTS POLICIES
-- ============================================

-- Officials can view their own alerts
CREATE POLICY "Officials can view own alerts"
ON alerts FOR SELECT
USING (user_id = auth.uid());

-- Officials can create their own alerts
CREATE POLICY "Officials can create own alerts"
ON alerts FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Officials can update their own alerts
CREATE POLICY "Officials can update own alerts"
ON alerts FOR UPDATE
USING (user_id = auth.uid());

-- Security team can view active alerts
CREATE POLICY "Security team can view active alerts"
ON alerts FOR SELECT
USING (
  is_security_team(auth.uid())
  AND status = 'active'
);

-- Security team can view alerts for assigned events
CREATE POLICY "Security team can view assigned event alerts"
ON alerts FOR SELECT
USING (
  is_security_team(auth.uid())
  AND event_id IS NOT NULL
  AND is_assigned_to_event(auth.uid(), event_id)
);

-- Security team can acknowledge alerts
CREATE POLICY "Security team can acknowledge alerts"
ON alerts FOR UPDATE
USING (
  is_security_team(auth.uid())
  AND status = 'active'
)
WITH CHECK (
  acknowledged_by = auth.uid()
  AND acknowledged_at IS NOT NULL
);

-- Security team can resolve alerts
CREATE POLICY "Security team can resolve alerts"
ON alerts FOR UPDATE
USING (
  is_security_team(auth.uid())
  AND status IN ('active', 'acknowledged')
)
WITH CHECK (
  resolved_by = auth.uid()
  AND resolved_at IS NOT NULL
  AND status = 'resolved'
);

-- System can create silent duress alerts (bypasses user_id check)
CREATE POLICY "System can create silent duress alerts"
ON alerts FOR INSERT
WITH CHECK (
  is_silent_duress = true
  AND trigger_source = 'duress_password'
);

-- ============================================
-- WEARABLES POLICIES
-- ============================================

-- Officials can view their own wearables
CREATE POLICY "Officials can view own wearables"
ON wearables FOR SELECT
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Officials can create their own wearables
CREATE POLICY "Officials can create own wearables"
ON wearables FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Officials can update their own wearables
CREATE POLICY "Officials can update own wearables"
ON wearables FOR UPDATE
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Officials can delete their own wearables
CREATE POLICY "Officials can delete own wearables"
ON wearables FOR UPDATE
USING (user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (deleted_at IS NOT NULL);

-- ============================================
-- LOCATION LOGS POLICIES
-- ============================================

-- Officials can view their own location logs
CREATE POLICY "Officials can view own location logs"
ON location_logs FOR SELECT
USING (user_id = auth.uid());

-- Officials can create their own location logs
CREATE POLICY "Officials can create own location logs"
ON location_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Security team can view location logs during active alerts
CREATE POLICY "Security team can view location during active alerts"
ON location_logs FOR SELECT
USING (
  is_security_team(auth.uid())
  AND (
    is_emergency_tracking = true
    OR EXISTS (
      SELECT 1 FROM alerts
      WHERE alerts.id = location_logs.alert_id
      AND alerts.status = 'active'
    )
  )
);

-- Security team can view location logs for assigned events
CREATE POLICY "Security team can view location for assigned events"
ON location_logs FOR SELECT
USING (
  is_security_team(auth.uid())
  AND event_id IS NOT NULL
  AND is_assigned_to_event(auth.uid(), event_id)
);

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can view messages in threads they participate in
CREATE POLICY "Users can view messages in their threads"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM message_threads
    WHERE message_threads.thread_key = messages.thread_id
    AND auth.uid() = ANY(message_threads.participants)
  )
  AND deleted_at IS NULL
);

-- Users can create messages in threads they participate in
CREATE POLICY "Users can create messages in their threads"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM message_threads
    WHERE message_threads.thread_key = messages.thread_id
    AND auth.uid() = ANY(message_threads.participants)
  )
);

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid() AND deleted_at IS NULL);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (deleted_at IS NOT NULL);

-- ============================================
-- MESSAGE THREADS POLICIES
-- ============================================

-- Users can view threads they participate in
CREATE POLICY "Users can view their threads"
ON message_threads FOR SELECT
USING (auth.uid() = ANY(participants));

-- Users can create threads
CREATE POLICY "Users can create threads"
ON message_threads FOR INSERT
WITH CHECK (auth.uid() = ANY(participants));

-- Users can update threads they participate in
CREATE POLICY "Users can update their threads"
ON message_threads FOR UPDATE
USING (auth.uid() = ANY(participants));

-- ============================================
-- INCIDENT REPORTS POLICIES
-- ============================================

-- Officials can view their own incident reports
CREATE POLICY "Officials can view own incident reports"
ON incident_reports FOR SELECT
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Officials can create their own incident reports
CREATE POLICY "Officials can create own incident reports"
ON incident_reports FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Officials can update their own incident reports
CREATE POLICY "Officials can update own incident reports"
ON incident_reports FOR UPDATE
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Security team can view incident reports for assigned events
CREATE POLICY "Security team can view assigned event reports"
ON incident_reports FOR SELECT
USING (
  is_security_team(auth.uid())
  AND deleted_at IS NULL
  AND event_id IS NOT NULL
  AND is_assigned_to_event(auth.uid(), event_id)
);

-- Security team can view incident reports for active alerts
CREATE POLICY "Security team can view active alert reports"
ON incident_reports FOR SELECT
USING (
  is_security_team(auth.uid())
  AND deleted_at IS NULL
  AND alert_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM alerts
    WHERE alerts.id = incident_reports.alert_id
    AND alerts.status = 'active'
  )
);

-- ============================================
-- DECOY CONFIGS POLICIES
-- ============================================

-- Officials can view their own decoy config
CREATE POLICY "Officials can view own decoy config"
ON decoy_configs FOR SELECT
USING (user_id = auth.uid());

-- Officials can create their own decoy config
CREATE POLICY "Officials can create own decoy config"
ON decoy_configs FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Officials can update their own decoy config
CREATE POLICY "Officials can update own decoy config"
ON decoy_configs FOR UPDATE
USING (user_id = auth.uid());

-- System can read decoy configs for duress password validation
CREATE POLICY "System can read decoy configs for validation"
ON decoy_configs FOR SELECT
USING (true); -- System service role can access

-- ============================================
-- DEVICE SESSIONS POLICIES
-- ============================================

-- Users can view their own device sessions
CREATE POLICY "Users can view own device sessions"
ON device_sessions FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own device sessions
CREATE POLICY "Users can create own device sessions"
ON device_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own device sessions
CREATE POLICY "Users can update own device sessions"
ON device_sessions FOR UPDATE
USING (user_id = auth.uid());

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true); -- System service role can create

-- ============================================
-- EVENT ASSIGNMENTS POLICIES
-- ============================================

-- Security admins can view all assignments
CREATE POLICY "Security admins can view all assignments"
ON event_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'security_admin'
    AND deleted_at IS NULL
  )
);

-- Security admins can create assignments
CREATE POLICY "Security admins can create assignments"
ON event_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'security_admin'
    AND deleted_at IS NULL
  )
);

-- Security team can view their own assignments
CREATE POLICY "Security team can view own assignments"
ON event_assignments FOR SELECT
USING (user_id = auth.uid());

-- ============================================
-- AUDIO RECORDINGS POLICIES
-- ============================================

-- Officials can view their own audio recordings
CREATE POLICY "Officials can view own audio recordings"
ON audio_recordings FOR SELECT
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Officials can create their own audio recordings
CREATE POLICY "Officials can create own audio recordings"
ON audio_recordings FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Security team can view audio recordings for active alerts
CREATE POLICY "Security team can view active alert recordings"
ON audio_recordings FOR SELECT
USING (
  is_security_team(auth.uid())
  AND deleted_at IS NULL
  AND alert_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM alerts
    WHERE alerts.id = audio_recordings.alert_id
    AND alerts.status = 'active'
  )
);

-- ============================================
-- BROADCAST LOGS POLICIES
-- ============================================

-- Security team can view broadcast logs
CREATE POLICY "Security team can view broadcast logs"
ON broadcast_logs FOR SELECT
USING (is_security_team(auth.uid()));

-- Security team can create broadcast logs
CREATE POLICY "Security team can create broadcast logs"
ON broadcast_logs FOR INSERT
WITH CHECK (is_security_team(auth.uid()));

