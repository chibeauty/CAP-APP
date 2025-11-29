-- Storage Buckets Setup for CAP App
-- Creates buckets for audio recordings, incident attachments, and event documents

-- ============================================
-- AUDIO RECORDINGS BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings',
  false, -- Private bucket
  104857600, -- 100MB limit
  ARRAY['audio/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INCIDENT ATTACHMENTS BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident-attachments',
  'incident-attachments',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- EVENT DOCUMENTS BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-documents',
  'event-documents',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Audio Recordings Policies
CREATE POLICY "Users can upload their own audio recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own audio recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audio-recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Security team can view audio recordings for active alerts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audio-recordings'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('security_admin', 'security_team')
    AND deleted_at IS NULL
  )
  AND EXISTS (
    SELECT 1 FROM audio_recordings
    WHERE file_url LIKE '%' || name
    AND alert_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM alerts
      WHERE alerts.id = audio_recordings.alert_id
      AND alerts.status = 'active'
    )
  )
);

-- Incident Attachments Policies
CREATE POLICY "Users can upload their own incident attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'incident-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own incident attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'incident-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Security team can view attachments for assigned events"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'incident-attachments'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('security_admin', 'security_team')
    AND deleted_at IS NULL
  )
  AND EXISTS (
    SELECT 1 FROM incident_reports
    WHERE attachments @> ARRAY['%' || name]
    AND event_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM event_assignments
      WHERE event_assignments.event_id = incident_reports.event_id
      AND event_assignments.user_id = auth.uid()
    )
  )
);

-- Event Documents Policies
CREATE POLICY "Event creators can upload event documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-documents'
  AND EXISTS (
    SELECT 1 FROM events
    WHERE events.id::text = (storage.foldername(name))[1]
    AND events.created_by = auth.uid()
    AND events.deleted_at IS NULL
  )
);

CREATE POLICY "Users can view documents for their events"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-documents'
  AND (
    -- Event creator
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id::text = (storage.foldername(name))[1]
      AND events.created_by = auth.uid()
      AND events.deleted_at IS NULL
    )
    OR
    -- Assigned security team
    EXISTS (
      SELECT 1 FROM events
      JOIN event_assignments ON event_assignments.event_id = events.id
      WHERE events.id::text = (storage.foldername(name))[1]
      AND event_assignments.user_id = auth.uid()
      AND events.deleted_at IS NULL
    )
  )
);

