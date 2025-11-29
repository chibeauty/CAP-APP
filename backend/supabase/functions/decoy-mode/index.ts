// Decoy Mode & Duress Workflow - Supabase Edge Function
// Handles duress password validation, silent alerts, fake interface, and background tracking

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DecoyRequest {
  action: 'validate_duress' | 'setup' | 'update' | 'get_config' | 'activate_fake_interface' | 'deactivate_fake_interface'
  duress_password?: string
  enabled?: boolean
  app_type?: 'calculator' | 'weather' | 'notes'
  activation_gesture?: 'triple_tap' | 'long_press' | 'invisible_button'
  silent_alert_enabled?: boolean
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

    const { action, ...data }: DecoyRequest = await req.json()

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
      case 'validate_duress':
        return await validateDuressPassword(supabaseClient, user.id, data)
      
      case 'setup':
        return await setupDecoyConfig(supabaseClient, user.id, data)
      
      case 'update':
        return await updateDecoyConfig(supabaseClient, user.id, data)
      
      case 'get_config':
        return await getDecoyConfig(supabaseClient, user.id)
      
      case 'activate_fake_interface':
        return await activateFakeInterface(supabaseClient, user.id)
      
      case 'deactivate_fake_interface':
        return await deactivateFakeInterface(supabaseClient, user.id)
      
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

async function validateDuressPassword(
  supabase: any,
  userId: string,
  data: Partial<DecoyRequest>
) {
  const { duress_password, location } = data

  if (!duress_password) {
    return new Response(
      JSON.stringify({ error: 'Duress password is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Use service role to access decoy config
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: config } = await supabaseAdmin
    .from('decoy_configs')
    .select('duress_password_hash, enabled, silent_alert_enabled')
    .eq('user_id', userId)
    .single()

  if (!config || !config.enabled) {
    return new Response(
      JSON.stringify({ error: 'Decoy mode not configured' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify password (in production, use proper hashing like bcrypt)
  // For now, simple comparison - REPLACE WITH PROPER HASHING
  const isValid = config.duress_password_hash === duress_password

  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid duress password', valid: false }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create silent duress alert if enabled
  if (config.silent_alert_enabled) {
    const { data: alert } = await supabaseAdmin
      .from('alerts')
      .insert({
        user_id: userId,
        level: 'critical',
        location: location || null,
        message: 'Silent duress alert triggered via decoy mode',
        status: 'active',
        trigger_source: 'duress_password',
        is_silent_duress: true,
      })
      .select()
      .single()

    // Send silent notifications (no UI indication)
    await sendSilentNotifications(supabaseAdmin, alert)

    // Start background location tracking
    if (location) {
      await supabaseAdmin.from('location_logs').insert({
        user_id: userId,
        alert_id: alert.id,
        latitude: location.lat,
        longitude: location.lng,
        is_emergency_tracking: true,
      })
    }
  }

  // Activate fake interface
  await supabaseAdmin
    .from('decoy_configs')
    .update({ fake_interface_active: true })
    .eq('user_id', userId)

  return new Response(
    JSON.stringify({ 
      success: true, 
      valid: true,
      fake_interface_active: true,
      silent_alert_triggered: config.silent_alert_enabled,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function setupDecoyConfig(
  supabase: any,
  userId: string,
  data: Partial<DecoyRequest>
) {
  const { enabled, app_type, activation_gesture, duress_password, silent_alert_enabled } = data

  if (!duress_password) {
    return new Response(
      JSON.stringify({ error: 'Duress password is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Hash password (in production, use proper hashing)
  // For now, simple storage - REPLACE WITH PROPER HASHING
  const passwordHash = duress_password // In production: await bcrypt.hash(duress_password, 10)

  // Check if config exists
  const { data: existing } = await supabase
    .from('decoy_configs')
    .select('id')
    .eq('user_id', userId)
    .single()

  let config
  if (existing) {
    // Update existing
    const { data: updated, error } = await supabase
      .from('decoy_configs')
      .update({
        enabled: enabled !== undefined ? enabled : true,
        app_type: app_type || 'calculator',
        activation_gesture: activation_gesture || 'triple_tap',
        duress_password_hash: passwordHash,
        silent_alert_enabled: silent_alert_enabled !== undefined ? silent_alert_enabled : true,
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    config = updated
  } else {
    // Create new
    const { data: created, error } = await supabase
      .from('decoy_configs')
      .insert({
        user_id: userId,
        enabled: enabled !== undefined ? enabled : true,
        app_type: app_type || 'calculator',
        activation_gesture: activation_gesture || 'triple_tap',
        duress_password_hash: passwordHash,
        silent_alert_enabled: silent_alert_enabled !== undefined ? silent_alert_enabled : true,
      })
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    config = created
  }

  // Remove password hash from response
  const { duress_password_hash, ...safeConfig } = config

  return new Response(
    JSON.stringify({ success: true, config: safeConfig }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateDecoyConfig(
  supabase: any,
  userId: string,
  data: Partial<DecoyRequest>
) {
  const updateData: any = {}

  if (data.enabled !== undefined) updateData.enabled = data.enabled
  if (data.app_type) updateData.app_type = data.app_type
  if (data.activation_gesture) updateData.activation_gesture = data.activation_gesture
  if (data.silent_alert_enabled !== undefined) updateData.silent_alert_enabled = data.silent_alert_enabled

  if (data.duress_password) {
    // Hash new password
    updateData.duress_password_hash = data.duress_password // In production: await bcrypt.hash(data.duress_password, 10)
  }

  const { data: config, error } = await supabase
    .from('decoy_configs')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { duress_password_hash, ...safeConfig } = config

  return new Response(
    JSON.stringify({ success: true, config: safeConfig }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getDecoyConfig(
  supabase: any,
  userId: string
) {
  const { data: config, error } = await supabase
    .from('decoy_configs')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!config) {
    return new Response(
      JSON.stringify({ success: true, config: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Remove password hash from response
  const { duress_password_hash, ...safeConfig } = config

  return new Response(
    JSON.stringify({ success: true, config: safeConfig }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function activateFakeInterface(
  supabase: any,
  userId: string
) {
  const { data: config, error } = await supabase
    .from('decoy_configs')
    .update({ fake_interface_active: true })
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
    JSON.stringify({ success: true, fake_interface_active: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deactivateFakeInterface(
  supabase: any,
  userId: string
) {
  const { data: config, error } = await supabase
    .from('decoy_configs')
    .update({ fake_interface_active: false })
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
    JSON.stringify({ success: true, fake_interface_active: false }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendSilentNotifications(supabase: any, alert: any) {
  // Get security team
  const { data: securityTeam } = await supabase
    .from('profiles')
    .select('id, email, phone')
    .in('role', ['security_admin', 'security_team'])
    .eq('is_active', true)

  // Create silent notifications (no UI indication to user)
  const notifications = (securityTeam || []).map((member: any) => ({
    user_id: member.id,
    alert_id: alert.id,
    type: 'emergency',
    title: 'SILENT DURESS ALERT',
    body: `Silent duress alert triggered - user may be under duress`,
    data: { 
      alert_id: alert.id, 
      level: alert.level, 
      is_silent_duress: true,
      silent: true, // Flag for UI to not show to user
    },
    sent_via: ['push'],
  }))

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications)
  }

  // Send SMS silently (no indication to user)
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
                Body: `🚨 SILENT DURESS: User may be under duress. Location: ${alert.location ? `${alert.location.lat}, ${alert.location.lng}` : 'Unknown'}`,
              }),
            }
          )
        } catch (error) {
          console.error('Twilio SMS error:', error)
        }
      }
    }
  }
}

