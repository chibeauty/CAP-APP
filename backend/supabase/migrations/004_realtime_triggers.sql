-- Real-Time Triggers and Functions
-- Enables real-time updates for location streaming, alerts, and messaging

-- ============================================
-- FUNCTION TO PUBLISH REAL-TIME EVENTS
-- ============================================

-- Function to notify on new alerts
CREATE OR REPLACE FUNCTION notify_new_alert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_alert',
    json_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'level', NEW.level,
      'status', NEW.status,
      'is_silent_duress', NEW.is_silent_duress,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_created_notification
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_alert();

-- Function to notify on alert status changes
CREATE OR REPLACE FUNCTION notify_alert_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    PERFORM pg_notify(
      'alert_status_changed',
      json_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'updated_at', NEW.updated_at
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_status_notification
  AFTER UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_alert_status_change();

-- Function to notify on new location logs (for emergency tracking)
CREATE OR REPLACE FUNCTION notify_location_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_emergency_tracking = true THEN
    PERFORM pg_notify(
      'location_update',
      json_build_object(
        'user_id', NEW.user_id,
        'alert_id', NEW.alert_id,
        'latitude', NEW.latitude,
        'longitude', NEW.longitude,
        'timestamp', NEW.timestamp
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER location_update_notification
  AFTER INSERT ON location_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_location_update();

-- Function to notify on new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_message',
    json_build_object(
      'id', NEW.id,
      'thread_id', NEW.thread_id,
      'sender_id', NEW.sender_id,
      'type', NEW.type,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_created_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Function to update message thread last message
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at
  WHERE thread_key = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();

-- Function to notify on event status changes
CREATE OR REPLACE FUNCTION notify_event_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    PERFORM pg_notify(
      'event_status_changed',
      json_build_object(
        'id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'updated_at', NEW.updated_at
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_status_notification
  AFTER UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_status_change();

-- Function to notify on wearable device status changes
CREATE OR REPLACE FUNCTION notify_wearable_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_connected != NEW.is_connected OR OLD.battery_level != NEW.battery_level THEN
    PERFORM pg_notify(
      'wearable_status_changed',
      json_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'is_connected', NEW.is_connected,
        'battery_level', NEW.battery_level,
        'updated_at', NEW.updated_at
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wearable_status_notification
  AFTER UPDATE ON wearables
  FOR EACH ROW
  EXECUTE FUNCTION notify_wearable_status_change();

-- ============================================
-- ENABLE REAL-TIME FOR TABLES
-- ============================================
-- Note: In Supabase, real-time is enabled via the dashboard or API
-- These are the tables that should have real-time enabled:
-- - alerts
-- - location_logs (for emergency tracking)
-- - messages
-- - message_threads
-- - events
-- - notifications
-- - wearables

