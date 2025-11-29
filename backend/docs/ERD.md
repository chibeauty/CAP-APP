# CAP App Database ERD (Entity Relationship Diagram)

## Entity Relationships

```
┌─────────────────┐
│    profiles     │
├─────────────────┤
│ id (PK)         │
│ email           │
│ full_name       │
│ role            │
│ phone           │
│ avatar_url      │
│ emergency_contact_name│
│ emergency_contact_phone│
│ is_active       │
│ last_seen_at    │
│ created_at      │
│ updated_at      │
│ deleted_at      │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌───┴──────────────────────────────────────────────┐
    │                                                  │
    │                                                  │
┌───▼──────────┐                              ┌──────▼──────────┐
│   events      │                              │    alerts       │
├───────────────┤                              ├─────────────────┤
│ id (PK)       │                              │ id (PK)         │
│ name          │                              │ user_id (FK)    │
│ description   │                              │ event_id (FK)   │
│ location      │                              │ level           │
│ location_coords│                             │ location        │
│ start_time    │                              │ message         │
│ end_time      │                              │ audio_recording_url│
│ status        │                              │ is_silent_duress│
│ created_by (FK)│                             │ trigger_source  │
│ risk_assessment│                             │ status          │
│ threat_level  │                              │ acknowledged_by │
│ assigned_security_team│                      │ resolved_by     │
│ created_at    │                              │ created_at       │
│ updated_at    │                              │ resolved_at      │
│ deleted_at    │                              └──────────────────┘
└───────┬───────┘                                       │
        │                                               │
        │ 1:N                                           │ 1:N
        │                                               │
┌───────▼──────────┐                          ┌───────▼──────────────┐
│ event_assignments│                          │  location_logs       │
├──────────────────┤                          ├──────────────────────┤
│ id (PK)          │                          │ id (PK)              │
│ event_id (FK)    │                          │ user_id (FK)         │
│ user_id (FK)     │                          │ event_id (FK)        │
│ role             │                          │ alert_id (FK)        │
│ assigned_at      │                          │ latitude             │
│ assigned_by (FK) │                          │ longitude            │
└──────────────────┘                          │ accuracy             │
                                              │ timestamp            │
                                              │ is_emergency_tracking │
                                              └──────────────────────┘
                                                       │
                                                       │
┌──────────────────────────────────────────────────────┴──────────────┐
│                                                                      │
│                                                                      │
┌───────────────┐                                          ┌────────▼──────────┐
│   wearables    │                                          │ audio_recordings  │
├───────────────┤                                          ├───────────────────┤
│ id (PK)       │                                          │ id (PK)           │
│ user_id (FK)  │                                          │ user_id (FK)      │
│ name          │                                          │ alert_id (FK)     │
│ device_type   │                                          │ event_id (FK)     │
│ mac_address   │                                          │ file_url          │
│ is_connected  │                                          │ duration_seconds  │
│ battery_level │                                          │ is_emergency_recording│
│ last_heart_rate│                                         │ created_at        │
│ gesture_config│                                          └───────────────────┘
│ created_at    │
│ updated_at    │
│ deleted_at    │
└───────────────┘

┌──────────────────┐
│ message_threads  │
├──────────────────┤
│ id (PK)          │
│ thread_key (UK)  │
│ thread_type      │
│ participants[]   │
│ event_id (FK)    │
│ alert_id (FK)    │
│ last_message_id (FK)│
│ last_message_at  │
│ created_at       │
│ updated_at       │
└────────┬─────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│    messages     │
├─────────────────┤
│ id (PK)         │
│ thread_id       │
│ sender_id (FK)  │
│ content         │
│ type            │
│ audio_url       │
│ video_call_session_id│
│ is_read         │
│ created_at      │
│ deleted_at      │
└─────────────────┘

┌──────────────────┐
│ incident_reports │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ alert_id (FK)    │
│ event_id (FK)    │
│ title            │
│ description      │
│ location         │
│ attachments[]    │
│ timeline         │
│ audio_files[]    │
│ status           │
│ reviewed_by (FK) │
│ created_at       │
│ updated_at       │
│ deleted_at     │
└──────────────────┘

┌──────────────────┐
│  decoy_configs   │
├──────────────────┤
│ id (PK)          │
│ user_id (FK, UK) │
│ enabled          │
│ app_type         │
│ activation_gesture│
│ duress_password_hash│
│ silent_alert_enabled│
│ fake_interface_active│
│ created_at       │
│ updated_at       │
└──────────────────┘

┌──────────────────┐
│  notifications   │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ alert_id (FK)    │
│ event_id (FK)    │
│ type             │
│ title            │
│ body             │
│ data             │
│ is_read          │
│ sent_via[]       │
│ created_at       │
└──────────────────┘

┌──────────────────┐
│ device_sessions  │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ device_id        │
│ user_agent       │
│ ip_address       │
│ is_active        │
│ last_activity_at │
│ expires_at       │
│ created_at       │
└──────────────────┘

┌──────────────────┐
│ broadcast_logs   │
├──────────────────┤
│ id (PK)          │
│ sender_id (FK)   │
│ event_id (FK)    │
│ message          │
│ recipients[]     │
│ sent_via[]       │
│ success_count    │
│ failure_count    │
│ created_at       │
└──────────────────┘
```

## Key Relationships

### One-to-Many Relationships

1. **profiles → events** (1:N)
   - One user can create many events
   - Foreign key: `events.created_by`

2. **profiles → alerts** (1:N)
   - One user can have many alerts
   - Foreign key: `alerts.user_id`

3. **profiles → wearables** (1:N)
   - One user can have many wearable devices
   - Foreign key: `wearables.user_id`

4. **profiles → location_logs** (1:N)
   - One user can have many location entries
   - Foreign key: `location_logs.user_id`

5. **profiles → messages** (1:N)
   - One user can send many messages
   - Foreign key: `messages.sender_id`

6. **profiles → incident_reports** (1:N)
   - One user can create many incident reports
   - Foreign key: `incident_reports.user_id`

7. **events → alerts** (1:N)
   - One event can have many alerts
   - Foreign key: `alerts.event_id`

8. **events → location_logs** (1:N)
   - One event can have many location entries
   - Foreign key: `location_logs.event_id`

9. **alerts → location_logs** (1:N)
   - One alert can have many location entries
   - Foreign key: `location_logs.alert_id`

10. **alerts → audio_recordings** (1:N)
    - One alert can have many audio recordings
    - Foreign key: `audio_recordings.alert_id`

11. **message_threads → messages** (1:N)
    - One thread can have many messages
    - Foreign key: `messages.thread_id`

### Many-to-Many Relationships

1. **events ↔ profiles** (M:N via `event_assignments`)
   - Many events can have many security team members
   - Junction table: `event_assignments`

2. **message_threads ↔ profiles** (M:N via `participants` array)
   - Many threads can have many participants
   - Stored as array in `message_threads.participants`

## Indexes

Key indexes for performance:

- `idx_profiles_role` - Filter by user role
- `idx_events_status` - Filter events by status
- `idx_alerts_user_id` - Fast user alert lookup
- `idx_alerts_status` - Filter active alerts
- `idx_location_logs_user_id` - User location history
- `idx_location_logs_emergency` - Emergency tracking
- `idx_messages_thread_id` - Thread message lookup
- `idx_wearables_user_id` - User device lookup

## Constraints

### Foreign Key Constraints

All foreign keys have appropriate CASCADE or SET NULL behavior:
- `profiles.id` → CASCADE on delete
- `events.id` → SET NULL on delete (soft delete)
- `alerts.id` → SET NULL on delete (soft delete)

### Unique Constraints

- `wearables.mac_address` - Unique MAC address
- `decoy_configs.user_id` - One config per user
- `message_threads.thread_key` - Unique thread identifier

### Check Constraints

- `profiles.role` - Must be valid role
- `alerts.level` - Must be valid alert level
- `alerts.status` - Must be valid status
- `events.status` - Must be valid event status
- `events.threat_level` - Must be valid threat level

