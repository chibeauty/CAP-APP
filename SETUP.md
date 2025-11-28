# CAP PWA Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Set Up Supabase Database**
   
   You'll need to create the following tables in your Supabase database:

   ### profiles table
   ```sql
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users PRIMARY KEY,
     email TEXT,
     full_name TEXT,
     role TEXT DEFAULT 'user',
     phone TEXT,
     avatar_url TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

   ### events table
   ```sql
   CREATE TABLE events (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     description TEXT,
     location TEXT,
     start_time TIMESTAMP NOT NULL,
     end_time TIMESTAMP NOT NULL,
     status TEXT DEFAULT 'upcoming',
     created_by UUID REFERENCES profiles(id),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

   ### alerts table
   ```sql
   CREATE TABLE alerts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id),
     event_id UUID REFERENCES events(id),
     level TEXT NOT NULL,
     location JSONB,
     message TEXT,
     audio_recording_url TEXT,
     status TEXT DEFAULT 'active',
     created_at TIMESTAMP DEFAULT NOW(),
     resolved_at TIMESTAMP
   );
   ```

   ### messages table
   ```sql
   CREATE TABLE messages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     thread_id TEXT NOT NULL,
     sender_id UUID REFERENCES profiles(id),
     content TEXT NOT NULL,
     type TEXT DEFAULT 'chat',
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

   ### wearables table
   ```sql
   CREATE TABLE wearables (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id),
     name TEXT NOT NULL,
     device_type TEXT,
     mac_address TEXT,
     is_connected BOOLEAN DEFAULT false,
     battery_level INTEGER,
     last_sync TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

   ### incident_reports table
   ```sql
   CREATE TABLE incident_reports (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id),
     alert_id UUID REFERENCES alerts(id),
     event_id UUID REFERENCES events(id),
     title TEXT NOT NULL,
     description TEXT NOT NULL,
     location JSONB,
     attachments TEXT[],
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

4. **Enable Row Level Security (RLS)**
   
   Enable RLS on all tables and create policies as needed for your security requirements.

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## PWA Icons

Replace the placeholder icon files in `/public`:
- `pwa-192x192.png` - 192x192px icon
- `pwa-512x512.png` - 512x512px icon
- `apple-touch-icon.png` - 180x180px for iOS
- `mask-icon.svg` - SVG mask icon

## Map Integration

The `MapWidget` component is a placeholder. To integrate a real map:

1. **Google Maps**: Install `@react-google-maps/api`
2. **Mapbox**: Install `react-map-gl`
3. **Leaflet**: Install `react-leaflet`

Then update `src/components/map/MapWidget.tsx` with your chosen library.

## WebRTC Integration

For video/audio calls, integrate a WebRTC solution like:
- Agora.io
- Twilio Video
- Simple-peer
- Custom WebRTC implementation

## Web Bluetooth

For wearable device pairing, ensure:
- HTTPS is enabled (required for Web Bluetooth API)
- Browser supports Web Bluetooth (Chrome/Edge)

## Push Notifications

To enable push notifications:
1. Generate VAPID keys
2. Register service worker
3. Request notification permission
4. Subscribe to push service

## Testing

- Test on real devices for PWA features
- Test offline functionality
- Test geolocation permissions
- Test camera/microphone permissions
- Test Web Bluetooth (if applicable)

## Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Ensure HTTPS is enabled (required for PWA features)
4. Configure service worker caching strategies

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support (Web Bluetooth limited)
- Safari: Full support (iOS 16.4+ for PWA features)
- Mobile browsers: Full support

