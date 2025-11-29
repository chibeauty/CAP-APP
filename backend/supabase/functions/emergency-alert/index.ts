// Emergency Alert Engine - Supabase Edge Function
// Handles alert creation, silent duress, audio recording, and notifications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertRequest {
  action: 'create' | 'silent_duress' | 'start_recording' | 'stop_recording' | 'fetch_active' | 'resolve'
  user_id?: string
  event_id?: string
  level?: 'low' | 'medium' | 'high' | 'critical'
  location?: { lat: number; lng: number; accuracy?: number }
  message?: string
  alert_id?: string
  duress_password?: string
}

serve(async (req) => {
  // Handle CORS preflight
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

    const { action, ...data }: AlertRequest = await req.json()

    // Get authenticated user
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
      case 'create':
        return await createAlert(supabaseClient, user.id, data)
      
      case 'silent_duress':
        return await createSilentDuressAlert(supabaseClient, user.id, data)
      
      case 'start_recording':
        return await startAudioRecording(supabaseClient, user.id, data)
      
      case 'stop_recording':
        return await stopAudioRecording(supabaseClient, user.id, data)
      
      case 'fetch_active':
        return await fetchActiveAlert(supabaseClient, user.id)
      
      case 'resolve':
        return await resolveAlert(supabaseClient, user.id, data)
      
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

async function createAlert(
  supabase: any,
  userId: string,
  data: Partial<AlertRequest>
) {
  const { event_id, level, location, message } = data

  if (!level) {
    return new Response(
      JSON.stringify({ error: 'Alert level is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create alert
  const { data: alert, error } = await supabase
    .from('alerts')
    .insert({
      user_id: userId,
      event_id: event_id || null,
      level,
      location: location || null,
      message: message || null,
      status: 'active',
      trigger_source: 'manual',
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

  // Log location if provided
  if (location) {
    await supabase.from('location_logs').insert({
      user_id: userId,
      event_id: event_id || null,
      alert_id: alert.id,
      latitude: location.lat,
      longitude: location.lng,
      accuracy: location.accuracy || null,
      is_emergency_tracking: true,
    })
  }

  return new Response(
    JSON.stringify({ success: true, alert }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createSilentDuressAlert(
  supabase: any,
  userId: string,
  data: Partial<AlertRequest>
) {
  const { duress_password, location } = data

  if (!duress_password) {
    return new Response(
      JSON.stringify({ error: 'Duress password is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify duress password using service role
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: decoyConfig } = await supabaseAdmin
    .from('decoy_configs')
    .select('duress_password_hash')
    .eq('user_id', userId)
    .single()

  if (!decoyConfig) {
    return new Response(
      JSON.stringify({ error: 'Decoy config not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify password (in production, use proper hashing like bcrypt)
  // For now, simple comparison - REPLACE WITH PROPER HASHING
  const isValid = decoyConfig.duress_password_hash === duress_password

  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid duress password' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create silent duress alert
  const { data: alert, error } = await supabaseAdmin
    .from('alerts')
    .insert({
      user_id: userId,
      level: 'critical',
      location: location || null,
      message: 'Silent duress alert triggered',
      status: 'active',
      trigger_source: 'duress_password',
      is_silent_duress: true,
    })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Send silent notifications (no UI indication)
  await sendEmergencyNotifications(supabaseAdmin, alert, true)

  // Log location
  if (location) {
    await supabaseAdmin.from('location_logs').insert({
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

async function startAudioRecording(
  supabase: any,
  userId: string,
  data: Partial<AlertRequest>
) {
  const { alert_id } = data

  // Get or create active alert
  let alertId = alert_id
  if (!alertId) {
    const { data: activeAlert } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!activeAlert) {
      return new Response(
        JSON.stringify({ error: 'No active alert found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    alertId = activeAlert.id
  }

  // Generate signed URL for audio upload
  const fileName = `${userId}/${alertId}/${Date.now()}.webm`
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('audio-recordings')
    .createSignedUploadUrl(fileName)

  if (uploadError) {
    return new Response(
      JSON.stringify({ error: uploadError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      upload_url: uploadData.signedUrl,
      file_path: fileName,
      alert_id: alertId,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function stopAudioRecording(
  supabase: any,
  userId: string,
  data: Partial<AlertRequest>
) {
  const { alert_id, file_path, duration_seconds } = data

  if (!file_path) {
    return new Response(
      JSON.stringify({ error: 'File path is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get public URL
  const { data: urlData } = await supabase
    .storage
    .from('audio-recordings')
    .getPublicUrl(file_path)

  // Create audio recording record
  const { data: recording, error } = await supabase
    .from('audio_recordings')
    .insert({
      user_id: userId,
      alert_id: alert_id || null,
      file_url: urlData.publicUrl,
      duration_seconds: duration_seconds || null,
      is_emergency_recording: !!alert_id,
    })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update alert with audio URL if alert_id provided
  if (alert_id) {
    await supabase
      .from('alerts')
      .update({ audio_recording_url: urlData.publicUrl })
      .eq('id', alert_id)
  }

  return new Response(
    JSON.stringify({ success: true, recording }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function fetchActiveAlert(
  supabase: any,
  userId: string
) {
  const { data: alert, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, alert: alert || null }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function resolveAlert(
  supabase: any,
  userId: string,
  data: Partial<AlertRequest>
) {
  const { alert_id } = data

  if (!alert_id) {
    return new Response(
      JSON.stringify({ error: 'Alert ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check if user is security team
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const isSecurityTeam = profile?.role === 'security_admin' || profile?.role === 'security_team'

  if (!isSecurityTeam) {
    // Officials can only resolve their own alerts
    const { data: alert } = await supabase
      .from('alerts')
      .select('user_id')
      .eq('id', alert_id)
      .single()

    if (alert?.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  const { data: alert, error } = await supabase
    .from('alerts')
    .update({
      status: 'resolved',
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alert_id)
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, alert }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendEmergencyNotifications(
  supabase: any,
  alert: any,
  silent: boolean = false
) {
  // Get user profile
  const { data: user } = await supabase
    .from('profiles')
    .select('full_name, phone, emergency_contact_name, emergency_contact_phone')
    .eq('id', alert.user_id)
    .single()

  // Get security team members
  const { data: securityTeam } = await supabase
    .from('profiles')
    .select('id, email, phone')
    .in('role', ['security_admin', 'security_team'])
    .eq('is_active', true)

  // Create notifications for security team
  const notifications = (securityTeam || []).map((member: any) => ({
    user_id: member.id,
    alert_id: alert.id,
    type: 'emergency',
    title: `Emergency Alert: ${alert.level.toUpperCase()}`,
    body: `${user?.full_name || 'User'} has triggered a ${alert.level} alert`,
    data: { alert_id: alert.id, level: alert.level },
    sent_via: ['push'],
  }))

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications)
  }

  // Send SMS via Twilio (if configured)
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

  if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    for (const member of securityTeam || []) {
      if (member.phone) {
        try {
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                From: twilioPhoneNumber,
                To: member.phone,
                Body: `🚨 EMERGENCY ALERT: ${user?.full_name || 'User'} - ${alert.level.toUpperCase()} alert triggered. Location: ${alert.location ? `${alert.location.lat}, ${alert.location.lng}` : 'Unknown'}`,
              }),
            }
          )
        } catch (error) {
          console.error('Twilio SMS error:', error)
        }
      }
    }
  }

  // Send email notifications (if configured)
  // This would integrate with an email service like SendGrid, Resend, etc.
}

