# CAP – Community Alert and Protection

**A Safety-Focused Progressive Web App for Political Leaders and Communities**

![CAP Dashboard](docs/assets/dashboard.png)

- **Live App**: [https://cap-i2hbxjh5a-ai-automation-of-supply-chain-ops-projects.vercel.app](https://cap-i2hbxjh5a-ai-automation-of-supply-chain-ops-projects.vercel.app)
- **Pitch Deck**: [View on Google Drive](https://drive.google.com/file/d/1tzeAWRQO-ermHfaGfx9rh7Ppw5dABqXH/view?usp=drivesdk)
- **Demo Video**: [View on Google Drive](https://drive.google.com/file/d/1tzeAWRQO-ermHfaGfx9rh7Ppw5dABqXH/view?usp=drivesdk)

## Project Description

**CAP (Community Alert and Protection)** is a cutting-edge Progressive Web Application (PWA) designed to ensure the safety and security of political leaders, public figures, and their communities. In an era of increasing political volatility, CAP provides a robust, real-time emergency response system that bridges the gap between individuals in danger and their security teams. By leveraging modern web technologies and wearable integration, CAP offers a seamless, reliable, and discreet way to signal for help and coordinate rapid responses.

## Problem Statement & Proposed Solution

### The Problem
Political leaders and public figures face unique security challenges, including targeted attacks, crowd violence, and stalking. Traditional security measures often rely on visible guards or slow communication channels (phone calls), which can be ineffective in sudden, high-stress emergencies. Furthermore, there is often a disconnect between the principal's real-time location and the security team's situational awareness.

### The Solution
CAP addresses these issues by providing a **comprehensive digital security ecosystem**:
1.  **Instant Alerting**: A panic button that triggers immediate notifications to security teams and designated contacts.
2.  **Real-Time Situational Awareness**: Live GPS tracking, audio streaming, and video feeds allow security teams to assess threats instantly.
3.  **Discreet Activation**: Integration with wearable devices and a "Decoy Mode" ensures alerts can be sent without drawing attention.
4.  **Coordinated Response**: Centralized dashboards for security teams to manage events, track assets, and coordinate interventions.

## Key Features

### 🚨 Panic Button & Duress Activation
- **One-Tap SOS**: prominent panic button for immediate emergency activation.
- **Silent Duress**: "I am Safe" check-ins and silent alarms for discreet signaling.
- **Wearable Trigger**: Activate alerts directly from a Bluetooth-connected smartwatch or fitness tracker.

### 📍 Real-Time Tracking & Monitoring
- **Live Location**: High-precision GPS tracking with real-time updates on an interactive map.
- **Live Audio/Video**: Automatically starts recording and streaming audio/video evidence upon alert activation.
- **Geofencing**: (Planned) Automatic alerts when entering or leaving designated safe zones.

### 🛡️ Security Team Dashboard
- **Centralized Command**: A comprehensive view of all active alerts, team member locations, and ongoing events.
- **Event Management**: Tools to plan routes, assign security personnel, and monitor political rallies or public appearances.
- **Decoy Mode**: A fully functional calculator interface that hides the security app, allowing discreet access via a secret PIN.

## Tech Stack

CAP is built using a modern, scalable, and performance-oriented technology stack:

### Frontend
- **React 18**: For building a dynamic and responsive user interface.
- **Tailwind CSS**: For rapid, utility-first styling and a sleek, modern aesthetic.
- **Vite**: For lightning-fast development and optimized production builds.
- **Lucide React**: For beautiful, consistent iconography.

### Backend & Infrastructure
- **Supabase**: An open-source Firebase alternative providing:
    - **PostgreSQL Database**: For robust and relational data storage.
    - **Authentication**: Secure user management and Role-Based Access Control (RBAC).
    - **Realtime**: For instant data synchronization (alerts, chat, location).
    - **Edge Functions**: For serverless backend logic (e.g., Twilio integration).
    - **Storage**: For secure hosting of audio/video evidence.

### Advanced APIs
- **WebRTC**: For real-time peer-to-peer video and audio communication.
- **Web Bluetooth API**: For direct integration with wearable devices.
- **Geolocation API**: For precise location tracking.
- **Web Push API**: For delivering critical alerts even when the app is in the background.
- **Google Maps API**: For advanced mapping, routing, and geocoding.
- **Twilio API**: For SMS and voice call notifications.

## Setup Instructions

Follow these steps to set up the CAP project locally:

### Prerequisites
- Node.js 18+
- A Supabase account
- A Google Maps API Key
- A Twilio Account (optional for SMS)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CAP-HACKATON
```

### 2. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `frontend` directory based on `.env.example`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_VAPID_PUBLIC_KEY=your_vapid_key
```

### 4. Backend Setup
1.  Create a new project on Supabase.
2.  Run the database schema script located in `backend/schema.sql` in your Supabase SQL Editor.
3.  Create storage buckets named `avatars` and `audio-recordings`.

### 5. Run the Application
Start the development server:
```bash
npm run dev
```
Access the app at `http://localhost:5173`.

## Usage Guide

### Emergency Alert Flow
1.  **Activation**: User presses the large red "SOS" button or triggers via wearable.
2.  **Countdown**: A 5-second countdown allows for cancellation of accidental presses.
3.  **Alert Mode**: App enters "Alert Mode", streaming location and audio to the server.
4.  **Notification**: Security team receives immediate push notifications and SMS.

![Mobile Panic Interface](docs/assets/mobile_panic.png)

### Event Management
Security teams can create and manage events:
1.  Navigate to the **Events** tab.
2.  Click **Create Event**.
3.  Define the route, safe zones, and assign personnel.
4.  Monitor the event in real-time on the map.

![Event Map View](docs/assets/event_map.png)

## Team Roles

- **Gloria Ngwu - Project Team Lead**: Oversees project timeline, requirements, and stakeholder communication.
- **Ruth Moraa Nyandika - UI/UX Designer**: Crafts the user interface, ensuring accessibility, ease of use under stress, and visual consistency.
- **Mungudit Perrymason Frontend Developer**: Implements the React application, integrates APIs (Maps, Bluetooth, WebRTC), and ensures PWA functionality.
- **Zama Zimu & Vanessa Charles - Backend Engineer**: Manages Supabase infrastructure, database schema, Edge Functions, and security policies (RLS).
- **Vicky Chumo - QA / Security Tester**: Conducts rigorous testing of alert reliability, penetration testing, and offline functionality verification.

## Future Improvements

- **Geo-Fencing**: Automated alerts when a principal deviates from a planned route or enters a high-risk zone.
- **AI-Powered Threat Analysis**: Analyzing patterns in location data and historical incidents to predict potential threats.
- **SOS Drone Integration**: Automatically deploying a camera drone to the alert location for aerial surveillance.
- **Offline Mesh Networking**: Enabling device-to-device communication for alerts in areas with no cellular coverage.

## Visual Assets

### Security Dashboard
![Security Dashboard](docs/assets/dashboard.png)

### Mobile Panic Interface
![Mobile Panic Interface](docs/assets/mobile_panic.png)

### Event Map & Routing
![Event Map View](docs/assets/event_map.png)

---

*Built for the PLP CAP Hackathon 2025.*
