# CAP App Backend

Complete backend implementation for the CAP (Community Alert & Protection) App, built on Supabase.

## 📁 Project Structure

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql      # Database schema
│   ├── 002_rls_policies.sql        # Row Level Security policies
│   ├── 003_storage_buckets.sql     # Storage bucket setup
│   └── 004_realtime_triggers.sql   # Real-time triggers
├── functions/
│   ├── emergency-alert/            # Emergency alert engine
│   ├── location-tracking/          # Location tracking engine
│   ├── communication/              # Communication engine
│   ├── event-management/           # Event management
│   ├── wearable-device/            # Wearable device integration
│   ├── decoy-mode/                 # Decoy mode & duress workflow
│   └── incident-reporting/         # Incident reporting
└── tests/
    ├── emergency-alert.test.ts     # Unit tests
    └── rls-security.test.ts        # Security tests

docs/
├── API_DOCUMENTATION.md            # API endpoint documentation
├── ARCHITECTURE.md                 # System architecture
└── ERD.md                          # Entity relationship diagram
```

## 🚀 Quick Start

### 1. Prerequisites

- Supabase account and project
- Supabase CLI installed (`npm install -g supabase`)
- Deno runtime (for Edge Functions)

### 2. Setup Supabase Project

1. Create a new Supabase project at https://supabase.com
2. Get your project URL and API keys from Settings → API

### 3. Run Migrations

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually run SQL files in Supabase SQL Editor in order:
1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_storage_buckets.sql`
4. `004_realtime_triggers.sql`

### 4. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy emergency-alert
supabase functions deploy location-tracking
supabase functions deploy communication
supabase functions deploy event-management
supabase functions deploy wearable-device
supabase functions deploy decoy-mode
supabase functions deploy incident-reporting
```

### 5. Configure Environment Variables

Set these in Supabase Dashboard → Edge Functions → Settings:

- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Your anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key
- `TWILIO_ACCOUNT_SID` - (Optional) Twilio account SID
- `TWILIO_AUTH_TOKEN` - (Optional) Twilio auth token
- `TWILIO_PHONE_NUMBER` - (Optional) Twilio phone number

### 6. Enable Real-time

In Supabase Dashboard → Database → Replication:
- Enable replication for: `alerts`, `location_logs`, `messages`, `events`, `notifications`

## 📚 Documentation

- [API Documentation](./docs/API_DOCUMENTATION.md) - Complete API reference
- [Architecture](./docs/ARCHITECTURE.md) - System architecture overview
- [ERD](./docs/ERD.md) - Database entity relationship diagram

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS enabled with strict policies:

- **Officials** can only see their own data
- **Security Team** can see assigned events and active alerts
- **Security Admins** have broader access
- **System** role has full access for background operations

### Authentication

All API endpoints require JWT authentication:
```
Authorization: Bearer <jwt-token>
```

## 🧪 Testing

Run tests with Deno:

```bash
deno test --allow-net --allow-env supabase/tests/
```

## 📦 Storage Buckets

Three storage buckets are created:

1. **audio-recordings** - Emergency audio recordings (100MB limit)
2. **incident-attachments** - Incident report attachments (50MB limit)
3. **event-documents** - Event-related documents (50MB limit)

All buckets are private with RLS policies for access control.

## 🔄 Real-time Features

Real-time updates are available for:

- New alerts and status changes
- Location updates (emergency tracking)
- New messages
- Event status changes
- Wearable device status changes

Subscribe using Supabase Realtime:

```javascript
supabase
  .channel('alerts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'alerts'
  }, (payload) => {
    console.log('New alert:', payload.new)
  })
  .subscribe()
```

## 🛠️ Development

### Local Development

1. Start Supabase locally:
```bash
supabase start
```

2. Run migrations:
```bash
supabase db reset
```

3. Deploy functions locally:
```bash
supabase functions serve emergency-alert
```

### Testing Edge Functions

Test functions using curl or Postman:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/emergency-alert \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "level": "high",
    "message": "Test alert"
  }'
```

## 📊 Database Schema

See [ERD.md](./docs/ERD.md) for complete entity relationship diagram.

Key tables:
- `profiles` - User profiles and roles
- `events` - Event management
- `alerts` - Emergency alerts
- `wearables` - Wearable devices
- `location_logs` - GPS tracking
- `messages` - Communication
- `incident_reports` - Incident reports
- `decoy_configs` - Decoy mode configuration

## 🔌 API Endpoints

All endpoints are available at:
```
https://your-project.supabase.co/functions/v1/{function-name}
```

See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for complete API reference.

## 🚨 Important Notes

1. **Password Hashing**: The duress password implementation uses simple comparison. **Replace with proper bcrypt hashing in production**.

2. **Service Role Key**: The service role key should only be used in Edge Functions, never exposed to clients.

3. **RLS Policies**: All RLS policies are strict. Test thoroughly before deploying to production.

4. **Real-time**: Enable real-time replication for tables that need live updates.

5. **Storage**: Configure bucket policies and CORS settings in Supabase Dashboard.

## 📝 License

MIT

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure RLS policies are maintained

## 📞 Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.

