// Event Management Engine - Supabase Edge Function
// Handles event CRUD, risk assessment, threat indicators, and security team assignment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EventRequest {
  action: 'create' | 'update' | 'delete' | 'get' | 'list' | 'assess_risk' | 'update_threat' | 'assign_security' | 'activate' | 'complete'
  event_id?: string
  name?: string
  description?: string
  location?: string
  location_coords?: { lat: number; lng: number }
  start_time?: string
  end_time?: string
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled'
  risk_factors?: string[]
  threat_level?: 'low' | 'medium' | 'high' | 'critical'
  assigned_security_team?: string[]
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

    const { action, ...data }: EventRequest = await req.json()

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
        return await createEvent(supabaseClient, user.id, data)
      
      case 'update':
        return await updateEvent(supabaseClient, user.id, data)
      
      case 'delete':
        return await deleteEvent(supabaseClient, user.id, data)
      
      case 'get':
        return await getEvent(supabaseClient, user.id, data)
      
      case 'list':
        return await listEvents(supabaseClient, user.id)
      
      case 'assess_risk':
        return await assessRisk(supabaseClient, user.id, data)
      
      case 'update_threat':
        return await updateThreatLevel(supabaseClient, user.id, data)
      
      case 'assign_security':
        return await assignSecurityTeam(supabaseClient, user.id, data)
      
      case 'activate':
        return await activateEvent(supabaseClient, user.id, data)
      
      case 'complete':
        return await completeEvent(supabaseClient, user.id, data)
      
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

async function createEvent(
  supabase: any,
  userId: string,
  data: Partial<EventRequest>
) {
  const { name, description, location, location_coords, start_time, end_time } = data

  if (!name || !location || !start_time || !end_time) {
    return new Response(
      JSON.stringify({ error: 'Name, location, start_time, and end_time are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Perform initial risk assessment
  const riskAssessment = await performRiskAssessment(data)

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      name,
      description: description || null,
      location,
      location_coords: location_coords || null,
      start_time,
      end_time,
      created_by: userId,
      status: 'upcoming',
      risk_assessment: riskAssessment,
      threat_level: riskAssessment.level,
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
    JSON.stringify({ success: true, event }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateEvent(
  supabase: any,
  userId: string,
  data: Partial<EventRequest>
) {
  const { event_id, ...updateData } = data

  if (!event_id) {
    return new Response(
      JSON.stringify({ error: 'Event ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check permissions
  const { data: event } = await supabase
    .from('events')
    .select('created_by')
    .eq('id', event_id)
    .single()

  if (!event || event.created_by !== userId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Reassess risk if location or time changed
  if (updateData.location || updateData.start_time || updateData.end_time) {
    const riskAssessment = await performRiskAssessment({ ...event, ...updateData })
    updateData.risk_assessment = riskAssessment
    if (!updateData.threat_level) {
      updateData.threat_level = riskAssessment.level
    }
  }

  const { data: updatedEvent, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', event_id)
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, event: updatedEvent }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteEvent(
  supabase: any,
  userId: string,
  data: Partial<EventRequest>
) {
  const { event_id } = data

  if (!event_id) {
    return new Response(
      JSON.stringify({ error: 'Event ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check permissions
  const { data: event } = await supabase
    .from('events')
    .select('created_by, status')
    .eq('id', event_id)
    .single()

  if (!event || event.created_by !== userId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Soft delete
  const { error } = await supabase
    .from('events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', event_id)

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

async function getEvent(
  supabase: any,
  userId: string,
  data: Partial<EventRequest>
) {
  const { event_id } = data

  if (!event_id) {
    return new Response(
      JSON.stringify({ error: 'Event ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', event_id)
    .is('deleted_at', null)
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, event }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function listEvents(
  supabase: any,
  userId: string
) {
  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  let query = supabase
    .from('events')
    .select('*')
    .is('deleted_at', null)
    .order('start_time', { ascending: true })

  // Officials see only their events
  if (profile?.role === 'official') {
    query = query.eq('created_by', userId)
  }
  // Security team sees assigned events
  else if (profile?.role === 'security_team' || profile?.role === 'security_admin') {
    // Get assigned events
    const { data: assignments } = await supabase
      .from('event_assignments')
      .select('event_id')
      .eq('user_id', userId)

    const assignedEventIds = assignments?.map((a: any) => a.event_id) || []
    
    if (assignedEventIds.length > 0) {
      query = query.in('id', assignedEventIds)
    } else {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000') // Return empty
    }
  }

  const { data: events, error } = await query

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, events: events || [] }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function assessRisk(
  supabase: any,
  userId: string,
  data: Partial<EventRequest>
) {
  const { event_id, risk_factors } = data

  if (!event_id) {
    return new Response(
      JSON.stringify({ error: 'Event ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get event data
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', event_id)
    .single()

  if (!event) {
    return new Response(
      JSON.stringify({ error: 'Event not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Perform risk assessment
  const riskAssessment = await performRiskAssessment({ ...event, risk_factors })

  // Update event
  const { data: updatedEvent, error } = await supabase
    .from('events')
    .update({
      risk_assessment: riskAssessment,
      threat_level: riskAssessment.level,
    })
    .eq('id', event_id)
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, risk_assessment: riskAssessment, event: updatedEvent }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateThreatLevel(
  supabase: any,
  userId: string,
  data: Partial<EventRequest>
) {
  const { event_id, threat_level } = data

  if (!event_id || !threat_level) {
    return new Response(
      JSON.stringify({ error: 'Event ID and threat level are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check if user is security admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role !== 'security_admin') {
    return new Response(
      JSON.stringify({ error: 'Only security admins can update threat levels' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: event, error } = await supabase
    .from('events')
    .update({ threat_level })
    .eq('id', event_id)
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, event }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function assignSecurityTeam(
  supabase: any,
  userId: string,
  data: Partial<EventRequest>
) {
  const { event_id, assigned_security_team } = data

  if (!event_id || !assigned_security_team) {
    return new Response(
      JSON.stringify({ error: 'Event ID and assigned security team are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check if user is security admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role !== 'security_admin') {
    return new Response(
      JSON.stringify({ error: 'Only security admins can assign security team' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Remove existing assignments
  await supabase
    .from('event_assignments')
    .delete()
    .eq('event_id', event_id)

  // Create new assignments
  const assignments = assigned_security_team.map((memberId: string) => ({
    event_id,
    user_id: memberId,
    assigned_by: userId,
  }))

  const { error } = await supabase
    .from('event_assignments')
    .insert(assignments)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update event
  await supabase
    .from('events')
    .update({ assigned_security_team })
    .eq('id', event_id)

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function activateEvent(
  supabase: any,
  userId: string,
  data: Partial<EventRequest>
) {
  const { event_id } = data

  if (!event_id) {
    return new Response(
      JSON.stringify({ error: 'Event ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: event, error } = await supabase
    .from('events')
    .update({ status: 'active' })
    .eq('id', event_id)
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, event }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function completeEvent(
  supabase: any,
  userId: string,
  data: Partial<EventRequest>
) {
  const { event_id } = data

  if (!event_id) {
    return new Response(
      JSON.stringify({ error: 'Event ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update event status
  const { data: event, error } = await supabase
    .from('events')
    .update({ status: 'completed' })
    .eq('id', event_id)
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Generate automatic incident report
  await generateEventReport(supabase, event_id)

  return new Response(
    JSON.stringify({ success: true, event }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function performRiskAssessment(data: any): Promise<any> {
  // Simple risk assessment algorithm
  // In production, this would use ML models, historical data, etc.
  let riskScore = 0
  const factors: string[] = []

  // Time-based factors
  const startTime = new Date(data.start_time)
  const hour = startTime.getHours()
  if (hour >= 22 || hour < 6) {
    riskScore += 2
    factors.push('Nighttime event')
  }

  // Location factors (simplified)
  if (data.location && data.location.toLowerCase().includes('high crime')) {
    riskScore += 3
    factors.push('High crime area')
  }

  // Custom risk factors
  if (data.risk_factors) {
    riskScore += data.risk_factors.length
    factors.push(...data.risk_factors)
  }

  // Determine level
  let level: 'low' | 'medium' | 'high' | 'critical'
  if (riskScore >= 5) {
    level = 'critical'
  } else if (riskScore >= 3) {
    level = 'high'
  } else if (riskScore >= 1) {
    level = 'medium'
  } else {
    level = 'low'
  }

  return {
    level,
    score: riskScore,
    factors,
    assessed_at: new Date().toISOString(),
  }
}

async function generateEventReport(supabase: any, eventId: string) {
  // Collect all data for the event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('event_id', eventId)

  const { data: locations } = await supabase
    .from('location_logs')
    .select('*')
    .eq('event_id', eventId)
    .order('timestamp', { ascending: true })

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', `event_${eventId}`)
    .order('created_at', { ascending: true })

  // Create timeline
  const timeline = [
    { time: event.created_at, event: 'Event created', type: 'system' },
    ...(alerts || []).map((alert: any) => ({
      time: alert.created_at,
      event: `${alert.level} alert triggered`,
      type: 'alert',
      data: alert,
    })),
    ...(messages || []).map((msg: any) => ({
      time: msg.created_at,
      event: 'Message sent',
      type: 'message',
      data: msg,
    })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  // Create incident report
  const { data: report } = await supabase
    .from('incident_reports')
    .insert({
      user_id: event.created_by,
      event_id: eventId,
      title: `Event Report: ${event.name}`,
      description: `Automated report for event ${event.name}`,
      location: event.location_coords,
      timeline,
      status: 'submitted',
    })
    .select()
    .single()

  return report
}

