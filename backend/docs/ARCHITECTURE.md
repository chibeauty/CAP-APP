# CAP App Backend Architecture

## System Overview

The CAP App backend is built on **Supabase**, a PostgreSQL-based backend-as-a-service platform. The architecture follows a serverless, event-driven model with strict security controls.

## Technology Stack

- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with JWT
- **API Layer**: Supabase Edge Functions (Deno runtime)
- **Real-time**: Supabase Realtime (PostgreSQL replication)
- **Storage**: Supabase Storage (S3-compatible)
- **Security**: Row Level Security (RLS) policies

## Architecture Layers

### 1. Database Layer

**PostgreSQL Database** with the following key components:

- **Tables**: 14 main tables for data persistence
- **RLS Policies**: Row-level security for data isolation
- **Triggers**: Database triggers for real-time notifications
- **Functions**: PostgreSQL functions for business logic

**Key Tables**:
- `profiles` - User profiles and roles
- `events` - Event management
- `alerts` - Emergency alerts
- `wearables` - Wearable device data
- `location_logs` - GPS tracking data
- `messages` - Communication messages
- `message_threads` - Message threads
- `incident_reports` - Incident reports
- `decoy_configs` - Decoy mode configuration
- `notifications` - Push notifications
- `audio_recordings` - Audio file metadata
- `device_sessions` - Device session tracking
- `event_assignments` - Security team assignments
- `broadcast_logs` - Broadcast message logs

### 2. API Layer (Edge Functions)

**Supabase Edge Functions** provide RESTful API endpoints:

1. **emergency-alert** - Emergency alert management
2. **location-tracking** - GPS coordinate tracking
3. **communication** - Messaging and WebRTC
4. **event-management** - Event CRUD and risk assessment
5. **wearable-device** - Wearable device integration
6. **decoy-mode** - Duress password and decoy interface
7. **incident-reporting** - Incident report generation

Each function:
- Runs on Deno runtime
- Handles authentication via JWT
- Enforces RLS policies automatically
- Returns JSON responses

### 3. Real-Time Layer

**Supabase Realtime** provides:

- **PostgreSQL Replication**: Real-time database changes
- **Channels**: Pub/sub for specific events
- **WebSocket Connections**: Persistent connections for live updates

**Real-time Channels**:
- `alerts` - New alerts and status changes
- `location_logs` - Live GPS updates (emergency tracking)
- `messages` - New messages in threads
- `events` - Event status changes
- `notifications` - Push notifications

### 4. Storage Layer

**Supabase Storage** buckets:

- `audio-recordings` - Emergency audio recordings
- `incident-attachments` - Incident report attachments
- `event-documents` - Event-related documents

**Access Control**:
- Signed URLs for uploads
- RLS policies for downloads
- Private buckets (not public)

### 5. Security Layer

**Multi-layered Security**:

1. **Authentication**: JWT tokens via Supabase Auth
2. **Authorization**: Role-based access control (RBAC)
3. **Row Level Security**: Database-level data isolation
4. **API Security**: Edge function authentication checks
5. **Storage Security**: Bucket policies and signed URLs

## Data Flow

### Emergency Alert Flow

```
User → Frontend → Edge Function → Database
                              ↓
                         RLS Check
                              ↓
                         Create Alert
                              ↓
                         Trigger Notifications
                              ↓
                         Real-time Broadcast
                              ↓
                    Security Team Dashboard
```

### Location Tracking Flow

```
Device → Frontend → Location Edge Function → Database
                                              ↓
                                         RLS Check
                                              ↓
                                         Store Location
                                              ↓
                                         Real-time Update
                                              ↓
                                    Security Dashboard
```

### Communication Flow

```
User → Frontend → Communication Edge Function → Database
                                                ↓
                                           RLS Check
                                                ↓
                                           Store Message
                                                ↓
                                           Update Thread
                                                ↓
                                           Real-time Broadcast
                                                ↓
                                          Other Participants
```

## Security Model

### Role-Based Access Control

**Roles**:
- `official` - Event organizers (can create events, trigger alerts)
- `security_team` - Security personnel (can view assigned events/alerts)
- `security_admin` - Security administrators (full access)
- `system` - System service role (internal operations)

### Row Level Security Policies

**Key Principles**:
1. Officials can ONLY see their own data
2. Security team can see assigned events and active alerts
3. Silent duress alerts bypass UI restrictions
4. System role has full access for background operations

**Policy Examples**:
- `Officials can view own alerts` - Users see only their alerts
- `Security team can view active alerts` - Security sees all active alerts
- `Security team can view assigned events` - Security sees assigned events only

## Real-Time Architecture

### PostgreSQL Triggers

Database triggers publish events via `pg_notify`:
- `new_alert` - New alert created
- `alert_status_changed` - Alert status updated
- `location_update` - New location log (emergency tracking)
- `new_message` - New message in thread
- `event_status_changed` - Event status updated

### Supabase Realtime

Clients subscribe to channels:
```javascript
supabase
  .channel('alerts')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'alerts' 
  }, (payload) => {
    // Handle new alert
  })
  .subscribe()
```

## Integration Points

### External APIs

1. **Twilio** - SMS and voice calls
   - Emergency notifications
   - Silent duress alerts

2. **Web Push** - Browser push notifications
   - Alert notifications
   - Message notifications

3. **Google Maps API** - Geocoding and mapping
   - Location display
   - Route planning

4. **WebRTC** - Video/audio calls
   - Signaling server
   - Peer-to-peer connections

5. **Web Bluetooth** - Wearable device pairing
   - Device discovery
   - Data streaming

## Scalability Considerations

### Database
- Indexed queries for performance
- Partitioning for large tables (location_logs)
- Connection pooling via Supabase

### Edge Functions
- Stateless design
- Automatic scaling
- Regional deployment

### Real-time
- Channel-based subscriptions
- Efficient message routing
- Connection pooling

### Storage
- CDN for file delivery
- Automatic scaling
- Lifecycle policies (future)

## Monitoring & Observability

### Logging
- Edge function logs in Supabase dashboard
- Database query logs
- Error tracking

### Metrics
- Function execution time
- Database query performance
- Real-time connection counts

### Alerts
- Function errors
- Database performance issues
- Security violations

## Deployment

### Supabase Project Setup

1. Create Supabase project
2. Run migrations in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_storage_buckets.sql`
   - `004_realtime_triggers.sql`
3. Deploy Edge Functions
4. Configure environment variables
5. Enable Realtime for tables
6. Set up storage buckets

### Environment Variables

Required for Edge Functions:
- `SUPABASE_URL` - Project URL
- `SUPABASE_ANON_KEY` - Anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)
- `TWILIO_ACCOUNT_SID` - Twilio account (optional)
- `TWILIO_AUTH_TOKEN` - Twilio token (optional)
- `TWILIO_PHONE_NUMBER` - Twilio phone number (optional)

## Future Enhancements

1. **Machine Learning** - Risk assessment models
2. **Analytics** - Event and alert analytics
3. **Mobile Apps** - Native iOS/Android apps
4. **Offline Support** - Enhanced offline capabilities
5. **Multi-tenant** - Support for multiple organizations

