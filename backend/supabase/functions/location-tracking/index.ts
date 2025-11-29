// Location Tracking Engine - Supabase Edge Function
// Handles GPS coordinate submission, real-time location streaming, and location history

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LocationRequest {
  action: 'submit' | 'subscribe' | 'history'
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  heading?: number
  speed?: number
  event_id?: string
  alert_id?: string
  user_id?: string
  start_time?: string
  end_time?: string
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

    const { action, ...data }: LocationRequest = await req.json()

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
      case 'submit':
        return await submitLocation(supabaseClient, user.id, data)
      
      case 'history':
        return await getLocationHistory(supabaseClient, user.id, data)
      
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

async function submitLocation(
  supabase: any,
  userId: string,
  data: Partial<LocationRequest>
) {
  const { latitude, longitude, accuracy, altitude, heading, speed, event_id, alert_id } = data

  if (!latitude || !longitude) {
    return new Response(
      JSON.stringify({ error: 'Latitude and longitude are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check if there's an active alert for emergency tracking
  let isEmergencyTracking = false
  if (!alert_id) {
    const { data: activeAlert } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (activeAlert) {
      isEmergencyTracking = true
    }
  } else {
    isEmergencyTracking = true
  }

  // Insert location log
  const { data: locationLog, error } = await supabase
    .from('location_logs')
    .insert({
      user_id: userId,
      event_id: event_id || null,
      alert_id: alert_id || null,
      latitude,
      longitude,
      accuracy: accuracy || null,
      altitude: altitude || null,
      heading: heading || null,
      speed: speed || null,
      is_emergency_tracking: isEmergencyTracking,
    })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update alert location if this is emergency tracking
  if (isEmergencyTracking && alert_id) {
    await supabase
      .from('alerts')
      .update({
        location: { lat: latitude, lng: longitude, accuracy, timestamp: new Date().toISOString() },
      })
      .eq('id', alert_id)
  }

  return new Response(
    JSON.stringify({ success: true, location: locationLog }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getLocationHistory(
  supabase: any,
  userId: string,
  data: Partial<LocationRequest>
) {
  const { start_time, end_time, event_id, alert_id, user_id } = data

  // Check if requesting other user's location (security team only)
  const targetUserId = user_id || userId
  if (targetUserId !== userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    const isSecurityTeam = profile?.role === 'security_admin' || profile?.role === 'security_team'
    if (!isSecurityTeam) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  let query = supabase
    .from('location_logs')
    .select('*')
    .eq('user_id', targetUserId)
    .order('timestamp', { ascending: false })
    .limit(1000)

  if (start_time) {
    query = query.gte('timestamp', start_time)
  }

  if (end_time) {
    query = query.lte('timestamp', end_time)
  }

  if (event_id) {
    query = query.eq('event_id', event_id)
  }

  if (alert_id) {
    query = query.eq('alert_id', alert_id)
  }

  const { data: locations, error } = await query

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, locations: locations || [] }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

