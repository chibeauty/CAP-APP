// Wearable Device Integration - Supabase Edge Function
// Handles device pairing, alert triggers from wearables, and device status

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WearableRequest {
  action: 'pair' | 'unpair' | 'update_status' | 'trigger_button' | 'trigger_heartrate' | 'trigger_gesture' | 'get_devices'
  device_id?: string
  name?: string
  device_type?: 'watch' | 'button' | 'bracelet' | 'pendant' | 'other'
  mac_address?: string
  bluetooth_device_id?: string
  battery_level?: number
  firmware_version?: string
  heart_rate?: number
  gesture_type?: string
  location?: { lat: number; lng: number }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, ...data }: WearableRequest = await req.json()

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (action) {
      case 'pair':
        return await pairDevice(supabaseClient, user.id, data)
      
      case 'unpair':
        return await unpairDevice(supabaseClient, user.id, data)
      
      case 'update_status':
        return await updateDeviceStatus(supabaseClient, user.id, data)
      
      case 'trigger_button':
        return await triggerButtonAlert(supabaseClient, user.id, data)
      
      case 'trigger_heartrate':
        return await triggerHeartRateAlert(supabaseClient, user.id, data)
      
      case 'trigger_gesture':
        return await triggerGestureAlert(supabaseClient, user.id, data)
      
      case 'get_devices':
        return await getDevices(supabaseClient, user.id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function pairDevice(
  supabase: any,
  userId: string,
  data: Partial<WearableRequest>
) {
  const { name, device_type, mac_address, bluetooth_device_id } = data

  if (!name || !device_type) {
    return new Response(
      JSON.stringify({ error: 'Device name and type are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check if device already paired
  if (mac_address) {
    const { data: existing } = await supabase
      .from('wearables')
      .select('id')
      .eq('mac_address', mac_address)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Device already paired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  const { data: device, error } = await supabase
    .from('wearables')
    .insert({
      user_id: userId,
      name,
      device_type,
      mac_address: mac_address || null,
      bluetooth_device_id: bluetooth_device_id || null,
      is_paired: true,
      is_connected: false,
      last_sync: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, device }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function unpairDevice(
  supabase: any,
  userId: string,
  data: Partial<WearableRequest>
) {
  const { device_id } = data

  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'Device ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { error } = await supabase
    .from('wearables')
    .update({
      is_paired: false,
      is_connected: false,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', device_id)
    .eq('user_id', userId)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateDeviceStatus(
  supabase: any,
  userId: string,
  data: Partial<WearableRequest>
) {
  const { device_id, battery_level, firmware_version, is_connected, heart_rate } = data

  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'Device ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const updateData: any = {
    last_sync: new Date().toISOString(),
  }

  if (battery_level !== undefined) updateData.battery_level = battery_level
  if (firmware_version !== undefined) updateData.firmware_version = firmware_version
  if (is_connected !== undefined) updateData.is_connected = is_connected
  if (heart_rate !== undefined) updateData.last_heart_rate = heart_rate

  const { data: device, error } = await supabase
    .from('wearables')
    .update(updateData)
    .eq('id', device_id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, device }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function triggerButtonAlert(
  supabase: any,
  userId: string,
  data: Partial<WearableRequest>
) {
  const { device_id, location } = data

  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'Device ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify device belongs to user
  const { data: device } = await supabase
    .from('wearables')
    .select('id, name')
    .eq('id', device_id)
    .eq('user_id', userId)
    .eq('is_paired', true)
    .single()

  if (!device) {
    return new Response(
      JSON.stringify({ error: 'Device not found or not paired' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create critical alert
  const { data: alert, error } = await supabase
    .from('alerts')
    .insert({
      user_id: userId,
      level: 'critical',
      location: location || null,
      message: `Emergency button pressed on ${device.name}`,
      status: 'active',
      trigger_source: 'wearable_button',
    })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Send notifications
  await sendEmergencyNotifications(supabase, alert)

  // Log location
  if (location) {
    await supabase.from('location_logs').insert({
      user_id: userId,
      alert_id: alert.id,
      latitude: location.lat,
      longitude: location.lng,
      is_emergency_tracking: true,
    })
  }

  return new Response(
    JSON.stringify({ success: true, alert }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function triggerHeartRateAlert(
  supabase: any,
  userId: string,
  data: Partial<WearableRequest>
) {
  const { device_id, heart_rate, location } = data

  if (!device_id || !heart_rate) {
    return new Response(
      JSON.stringify({ error: 'Device ID and heart rate are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify device
  const { data: device } = await supabase
    .from('wearables')
    .select('id, name')
    .eq('id', device_id)
    .eq('user_id', userId)
    .eq('is_paired', true)
    .single()

  if (!device) {
    return new Response(
      JSON.stringify({ error: 'Device not found or not paired' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check if heart rate exceeds threshold (e.g., 150 bpm or sudden spike)
  const threshold = 150
  const { data: lastHeartRate } = await supabase
    .from('wearables')
    .select('last_heart_rate')
    .eq('id', device_id)
    .single()

  const isSpike = lastHeartRate?.last_heart_rate && 
    (heart_rate - lastHeartRate.last_heart_rate) > 30

  if (heart_rate < threshold && !isSpike) {
    // Update heart rate but don't create alert
    await supabase
      .from('wearables')
      .update({ last_heart_rate: heart_rate })
      .eq('id', device_id)

    return new Response(
      JSON.stringify({ success: true, message: 'Heart rate normal' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create alert for high heart rate or spike
  const { data: alert, error } = await supabase
    .from('alerts')
    .insert({
      user_id: userId,
      level: isSpike ? 'high' : 'medium',
      location: location || null,
      message: `Abnormal heart rate detected: ${heart_rate} bpm on ${device.name}`,
      status: 'active',
      trigger_source: 'wearable_heartrate',
    })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update device heart rate
  await supabase
    .from('wearables')
    .update({ last_heart_rate: heart_rate })
    .eq('id', device_id)

  // Send notifications
  await sendEmergencyNotifications(supabase, alert)

  return new Response(
    JSON.stringify({ success: true, alert }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function triggerGestureAlert(
  supabase: any,
  userId: string,
  data: Partial<WearableRequest>
) {
  const { device_id, gesture_type, location } = data

  if (!device_id || !gesture_type) {
    return new Response(
      JSON.stringify({ error: 'Device ID and gesture type are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify device
  const { data: device } = await supabase
    .from('wearables')
    .select('id, name, gesture_config')
    .eq('id', device_id)
    .eq('user_id', userId)
    .eq('is_paired', true)
    .single()

  if (!device) {
    return new Response(
      JSON.stringify({ error: 'Device not found or not paired' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check if gesture is configured as alert trigger
  const gestureConfig = device.gesture_config || {}
  const isAlertGesture = gestureConfig[gesture_type] === true

  if (!isAlertGesture) {
    return new Response(
      JSON.stringify({ success: true, message: 'Gesture not configured for alerts' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create alert
  const { data: alert, error } = await supabase
    .from('alerts')
    .insert({
      user_id: userId,
      level: 'high',
      location: location || null,
      message: `Emergency gesture (${gesture_type}) detected on ${device.name}`,
      status: 'active',
      trigger_source: 'wearable_gesture',
    })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Send notifications
  await sendEmergencyNotifications(supabase, alert)

  return new Response(
    JSON.stringify({ success: true, alert }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getDevices(
  supabase: any,
  userId: string
) {
  const { data: devices, error } = await supabase
    .from('wearables')
    .select('*')
    .eq('user_id', userId)
    .eq('is_paired', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, devices: devices || [] }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendEmergencyNotifications(supabase: any, alert: any) {
  // Get security team
  const { data: securityTeam } = await supabase
    .from('profiles')
    .select('id, email, phone')
    .in('role', ['security_admin', 'security_team'])
    .eq('is_active', true)

  // Create notifications
  const notifications = (securityTeam || []).map((member: any) => ({
    user_id: member.id,
    alert_id: alert.id,
    type: 'emergency',
    title: `Wearable Alert: ${alert.level.toUpperCase()}`,
    body: alert.message,
    data: { alert_id: alert.id, level: alert.level, trigger_source: alert.trigger_source },
    sent_via: ['push'],
  }))

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications)
  }
}

