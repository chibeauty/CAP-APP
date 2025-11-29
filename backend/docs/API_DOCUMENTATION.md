# CAP App Backend API Documentation

## Overview

The CAP App backend is built on Supabase and provides RESTful API endpoints via Edge Functions. All endpoints require authentication via JWT token in the Authorization header.

**Base URL**: `https://your-project.supabase.co/functions/v1/`

## Authentication

All API requests require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Emergency Alert Engine

### Create Alert
**Endpoint**: `POST /emergency-alert`

**Request Body**:
```json
{
  "action": "create",
  "event_id": "optional-event-id",
  "level": "low|medium|high|critical",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "accuracy": 10
  },
  "message": "Alert message"
}
```

**Response**:
```json
{
  "success": true,
  "alert": {
    "id": "alert-id",
    "user_id": "user-id",
    "level": "high",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Silent Duress Alert
**Endpoint**: `POST /emergency-alert`

**Request Body**:
```json
{
  "action": "silent_duress",
  "duress_password": "password",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

### Start Audio Recording
**Endpoint**: `POST /emergency-alert`

**Request Body**:
```json
{
  "action": "start_recording",
  "alert_id": "optional-alert-id"
}
```

**Response**:
```json
{
  "success": true,
  "upload_url": "signed-upload-url",
  "file_path": "user-id/alert-id/timestamp.webm",
  "alert_id": "alert-id"
}
```

### Stop Audio Recording
**Endpoint**: `POST /emergency-alert`

**Request Body**:
```json
{
  "action": "stop_recording",
  "alert_id": "alert-id",
  "file_path": "user-id/alert-id/timestamp.webm",
  "duration_seconds": 30
}
```

### Fetch Active Alert
**Endpoint**: `POST /emergency-alert`

**Request Body**:
```json
{
  "action": "fetch_active"
}
```

### Resolve Alert
**Endpoint**: `POST /emergency-alert`

**Request Body**:
```json
{
  "action": "resolve",
  "alert_id": "alert-id"
}
```

## Location Tracking Engine

### Submit Location
**Endpoint**: `POST /location-tracking`

**Request Body**:
```json
{
  "action": "submit",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "altitude": 100,
  "heading": 90,
  "speed": 5,
  "event_id": "optional-event-id",
  "alert_id": "optional-alert-id"
}
```

### Get Location History
**Endpoint**: `POST /location-tracking`

**Request Body**:
```json
{
  "action": "history",
  "start_time": "2024-01-01T00:00:00Z",
  "end_time": "2024-01-01T23:59:59Z",
  "event_id": "optional-event-id",
  "alert_id": "optional-alert-id",
  "user_id": "optional-user-id"
}
```

## Communication Engine

### Create Thread
**Endpoint**: `POST /communication`

**Request Body**:
```json
{
  "action": "create_thread",
  "thread_type": "direct|event|group|broadcast|emergency",
  "participants": ["user-id-1", "user-id-2"],
  "event_id": "optional-event-id",
  "alert_id": "optional-alert-id"
}
```

### Send Message
**Endpoint**: `POST /communication`

**Request Body**:
```json
{
  "action": "send_message",
  "thread_id": "thread-key",
  "content": "Message content",
  "type": "chat|video|ptt|audio",
  "audio_url": "optional-audio-url",
  "video_call_session_id": "optional-session-id"
}
```

### Get Threads
**Endpoint**: `POST /communication`

**Request Body**:
```json
{
  "action": "get_threads"
}
```

### Get Messages
**Endpoint**: `POST /communication`

**Request Body**:
```json
{
  "action": "get_messages",
  "thread_id": "thread-key"
}
```

## Event Management

### Create Event
**Endpoint**: `POST /event-management`

**Request Body**:
```json
{
  "action": "create",
  "name": "Event Name",
  "description": "Event description",
  "location": "Event location",
  "location_coords": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "start_time": "2024-01-01T10:00:00Z",
  "end_time": "2024-01-01T18:00:00Z"
}
```

### Update Event
**Endpoint**: `POST /event-management`

**Request Body**:
```json
{
  "action": "update",
  "event_id": "event-id",
  "name": "Updated name",
  "description": "Updated description"
}
```

### List Events
**Endpoint**: `POST /event-management`

**Request Body**:
```json
{
  "action": "list"
}
```

### Assess Risk
**Endpoint**: `POST /event-management`

**Request Body**:
```json
{
  "action": "assess_risk",
  "event_id": "event-id",
  "risk_factors": ["factor1", "factor2"]
}
```

### Assign Security Team
**Endpoint**: `POST /event-management`

**Request Body**:
```json
{
  "action": "assign_security",
  "event_id": "event-id",
  "assigned_security_team": ["user-id-1", "user-id-2"]
}
```

## Wearable Device Integration

### Pair Device
**Endpoint**: `POST /wearable-device`

**Request Body**:
```json
{
  "action": "pair",
  "name": "Device Name",
  "device_type": "watch|button|bracelet|pendant|other",
  "mac_address": "00:11:22:33:44:55",
  "bluetooth_device_id": "device-id"
}
```

### Trigger Button Alert
**Endpoint**: `POST /wearable-device`

**Request Body**:
```json
{
  "action": "trigger_button",
  "device_id": "device-id",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

### Trigger Heart Rate Alert
**Endpoint**: `POST /wearable-device`

**Request Body**:
```json
{
  "action": "trigger_heartrate",
  "device_id": "device-id",
  "heart_rate": 180,
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

## Decoy Mode

### Setup Decoy Config
**Endpoint**: `POST /decoy-mode`

**Request Body**:
```json
{
  "action": "setup",
  "enabled": true,
  "app_type": "calculator|weather|notes",
  "activation_gesture": "triple_tap|long_press|invisible_button",
  "duress_password": "password",
  "silent_alert_enabled": true
}
```

### Validate Duress Password
**Endpoint**: `POST /decoy-mode`

**Request Body**:
```json
{
  "action": "validate_duress",
  "duress_password": "password",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

## Incident Reporting

### Create Report
**Endpoint**: `POST /incident-reporting`

**Request Body**:
```json
{
  "action": "create",
  "alert_id": "optional-alert-id",
  "event_id": "optional-event-id",
  "title": "Report Title",
  "description": "Report description",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "attachments": ["url1", "url2"]
}
```

### Generate Timeline
**Endpoint**: `POST /incident-reporting`

**Request Body**:
```json
{
  "action": "generate_timeline",
  "alert_id": "alert-id",
  "event_id": "event-id",
  "report_id": "report-id"
}
```

### Export JSON
**Endpoint**: `POST /incident-reporting`

**Request Body**:
```json
{
  "action": "export_json",
  "report_id": "report-id"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message"
}
```

**Status Codes**:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

