# CAP - Community Alert & Protection PWA

A Progressive Web App for community safety and emergency response.

## Features

- 🚨 Emergency alert system with multiple alert levels
- 📍 Real-time location tracking
- 💬 Real-time communications (chat, video, PTT)
- 📅 Event management
- 🔒 Decoy mode for discreet emergency access
- ⌚ Wearable device integration
- 👥 Security dashboard for security teams
- 📱 Fully responsive (mobile-first)
- 🌓 Dark mode support
- ♿ WCAG 2.1 AA accessible

## Tech Stack

- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Supabase (Auth, Realtime, Storage)
- Framer Motion (animations)
- PWA (Service Worker, Offline Support)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # Base UI components (Button, Card, Modal, etc.)
│   ├── navigation/  # Navigation components
│   ├── emergency/   # Emergency-specific components
│   ├── chat/        # Chat and communication components
│   ├── map/         # Map components
│   └── audio/       # Audio recording components
├── pages/           # Page components
│   ├── auth/        # Authentication pages
│   └── ...          # Other pages
├── contexts/        # React contexts (Auth, Theme)
├── hooks/           # Custom React hooks
├── lib/             # Utilities and configurations
├── types/           # TypeScript type definitions
└── App.tsx          # Main app component with routing
```

## Key Features Implementation

### Emergency Alert System
- Floating panic button (always visible)
- Alert level selector (Low/Medium/High/Critical)
- Real-time location sharing
- Audio recording capability
- Direct communication with security team

### Decoy Mode
- Setup interface for configuration
- Three app types: Calculator, Weather, Notes
- Activation gestures: Triple tap, Long press, Invisible button
- Completely hides emergency UI

### Communications
- Real-time chat with security team
- Push-to-talk (PTT) functionality
- Video call support (WebRTC)
- Thread-based messaging

### Security Dashboard
- Real-time alert monitoring
- User location tracking
- Active user count
- Response time metrics

## Accessibility

- WCAG 2.1 AA compliant
- Minimum 44px tap targets
- High contrast colors
- Keyboard navigation support
- Screen reader friendly
- ARIA labels throughout

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

