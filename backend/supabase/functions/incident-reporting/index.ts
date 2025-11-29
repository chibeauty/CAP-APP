// Incident Reporting Engine - Supabase Edge Function
// Handles incident report generation, timeline creation, and PDF/JSON export

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IncidentRequest {
  action: 'create' | 'update' | 'get' | 'list' | 'generate_timeline' | 'export_pdf' | 'export_json'
  report_id?: string
  alert_id?: string
  event_id?: string
  title?: string
  description?: string
  location?: { lat: number; lng: number }
  attachments?: string[]
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

    const { action, ...data }: IncidentRequest = await req.json()

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
        return await createReport(supabaseClient, user.id, data)
      
      case 'update':
        return await updateReport(supabaseClient, user.id, data)
      
      case 'get':
        return await getReport(supabaseClient, user.id, data)
      
      case 'list':
        return await listReports(supabaseClient, user.id)
      
      case 'generate_timeline':
        return await generateTimeline(supabaseClient, user.id, data)
      
      case 'export_pdf':
        return await exportPDF(supabaseClient, user.id, data)
      
      case 'export_json':
        return await exportJSON(supabaseClient, user.id, data)
      
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

async function createReport(
  supabase: any,
  userId: string,
  data: Partial<IncidentRequest>
) {
  const { alert_id, event_id, title, description, location, attachments } = data

  if (!title || !description) {
    return new Response(
      JSON.stringify({ error: 'Title and description are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Generate timeline if alert_id or event_id provided
  let timeline = null
  if (alert_id || event_id) {
    timeline = await generateTimelineData(supabase, userId, alert_id, event_id)
  }

  // Get audio files if alert_id provided
  let audioFiles: string[] = []
  if (alert_id) {
    const { data: recordings } = await supabase
      .from('audio_recordings')
      .select('file_url')
      .eq('alert_id', alert_id)
      .is('deleted_at', null)

    audioFiles = recordings?.map((r: any) => r.file_url) || []
  }

  const { data: report, error } = await supabase
    .from('incident_reports')
    .insert({
      user_id: userId,
      alert_id: alert_id || null,
      event_id: event_id || null,
      title,
      description,
      location: location || null,
      attachments: attachments || [],
      audio_files: audioFiles,
      timeline: timeline,
      status: 'draft',
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
    JSON.stringify({ success: true, report }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateReport(
  supabase: any,
  userId: string,
  data: Partial<IncidentRequest>
) {
  const { report_id, ...updateData } = data

  if (!report_id) {
    return new Response(
      JSON.stringify({ error: 'Report ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check permissions
  const { data: report } = await supabase
    .from('incident_reports')
    .select('user_id')
    .eq('id', report_id)
    .single()

  if (!report || report.user_id !== userId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: updatedReport, error } = await supabase
    .from('incident_reports')
    .update(updateData)
    .eq('id', report_id)
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, report: updatedReport }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getReport(
  supabase: any,
  userId: string,
  data: Partial<IncidentRequest>
) {
  const { report_id } = data

  if (!report_id) {
    return new Response(
      JSON.stringify({ error: 'Report ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: report, error } = await supabase
    .from('incident_reports')
    .select('*')
    .eq('id', report_id)
    .is('deleted_at', null)
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, report }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function listReports(
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
    .from('incident_reports')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Officials see only their reports
  if (profile?.role === 'official') {
    query = query.eq('user_id', userId)
  }
  // Security team sees reports for assigned events
  else if (profile?.role === 'security_team' || profile?.role === 'security_admin') {
    // Get assigned events
    const { data: assignments } = await supabase
      .from('event_assignments')
      .select('event_id')
      .eq('user_id', userId)

    const assignedEventIds = assignments?.map((a: any) => a.event_id) || []
    
    if (assignedEventIds.length > 0) {
      query = query.in('event_id', assignedEventIds)
    } else {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000') // Return empty
    }
  }

  const { data: reports, error } = await query

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, reports: reports || [] }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function generateTimeline(
  supabase: any,
  userId: string,
  data: Partial<IncidentRequest>
) {
  const { alert_id, event_id, report_id } = data

  if (!alert_id && !event_id && !report_id) {
    return new Response(
      JSON.stringify({ error: 'Alert ID, Event ID, or Report ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get report to find alert_id/event_id
  let targetAlertId = alert_id
  let targetEventId = event_id

  if (report_id) {
    const { data: report } = await supabase
      .from('incident_reports')
      .select('alert_id, event_id')
      .eq('id', report_id)
      .single()

    if (report) {
      targetAlertId = report.alert_id
      targetEventId = report.event_id
    }
  }

  const timeline = await generateTimelineData(supabase, userId, targetAlertId, targetEventId)

  // Update report if report_id provided
  if (report_id) {
    await supabase
      .from('incident_reports')
      .update({ timeline })
      .eq('id', report_id)
  }

  return new Response(
    JSON.stringify({ success: true, timeline }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function generateTimelineData(
  supabase: any,
  userId: string,
  alertId: string | null,
  eventId: string | null
): Promise<any[]> {
  const timeline: any[] = []

  // Get alert data
  if (alertId) {
    const { data: alert } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single()

    if (alert) {
      timeline.push({
        time: alert.created_at,
        event: `${alert.level.toUpperCase()} alert triggered`,
        type: 'alert',
        data: {
          level: alert.level,
          message: alert.message,
          trigger_source: alert.trigger_source,
          is_silent_duress: alert.is_silent_duress,
        },
      })

      if (alert.resolved_at) {
        timeline.push({
          time: alert.resolved_at,
          event: 'Alert resolved',
          type: 'alert',
          data: { resolved_by: alert.resolved_by },
        })
      }
    }

    // Get location logs
    const { data: locations } = await supabase
      .from('location_logs')
      .select('*')
      .eq('alert_id', alertId)
      .order('timestamp', { ascending: true })

    locations?.forEach((loc: any) => {
      timeline.push({
        time: loc.timestamp,
        event: 'Location update',
        type: 'location',
        data: {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
        },
      })
    })

    // Get audio recordings
    const { data: recordings } = await supabase
      .from('audio_recordings')
      .select('*')
      .eq('alert_id', alertId)
      .is('deleted_at', null)

    recordings?.forEach((rec: any) => {
      timeline.push({
        time: rec.created_at,
        event: 'Audio recording',
        type: 'audio',
        data: {
          file_url: rec.file_url,
          duration_seconds: rec.duration_seconds,
        },
      })
    })
  }

  // Get event data
  if (eventId) {
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (event) {
      timeline.push({
        time: event.created_at,
        event: `Event created: ${event.name}`,
        type: 'event',
        data: {
          name: event.name,
          location: event.location,
          threat_level: event.threat_level,
        },
      })

      if (event.status === 'active') {
        timeline.push({
          time: event.updated_at,
          event: 'Event activated',
          type: 'event',
        })
      }

      if (event.status === 'completed') {
        timeline.push({
          time: event.updated_at,
          event: 'Event completed',
          type: 'event',
        })
      }
    }

    // Get messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', `event_${eventId}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    messages?.forEach((msg: any) => {
      timeline.push({
        time: msg.created_at,
        event: 'Message sent',
        type: 'message',
        data: {
          content: msg.content,
          type: msg.type,
        },
      })
    })
  }

  // Sort timeline chronologically
  return timeline.sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  )
}

async function exportPDF(
  supabase: any,
  userId: string,
  data: Partial<IncidentRequest>
) {
  const { report_id } = data

  if (!report_id) {
    return new Response(
      JSON.stringify({ error: 'Report ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get report
  const { data: report } = await supabase
    .from('incident_reports')
    .select('*')
    .eq('id', report_id)
    .single()

  if (!report) {
    return new Response(
      JSON.stringify({ error: 'Report not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Generate PDF (simplified - in production, use a PDF library)
  // For now, return JSON with PDF generation instructions
  const pdfData = {
    title: report.title,
    description: report.description,
    timeline: report.timeline,
    location: report.location,
    attachments: report.attachments,
    audio_files: report.audio_files,
    created_at: report.created_at,
  }

  // In production, use a service like Puppeteer, PDFKit, or a PDF generation API
  // For now, return the data structure
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'PDF generation not implemented. Use export_json for data export.',
      data: pdfData,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function exportJSON(
  supabase: any,
  userId: string,
  data: Partial<IncidentRequest>
) {
  const { report_id } = data

  if (!report_id) {
    return new Response(
      JSON.stringify({ error: 'Report ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get full report with related data
  const { data: report } = await supabase
    .from('incident_reports')
    .select('*')
    .eq('id', report_id)
    .single()

  if (!report) {
    return new Response(
      JSON.stringify({ error: 'Report not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get related alert if exists
  let alert = null
  if (report.alert_id) {
    const { data: alertData } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', report.alert_id)
      .single()
    alert = alertData
  }

  // Get related event if exists
  let event = null
  if (report.event_id) {
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', report.event_id)
      .single()
    event = eventData
  }

  const exportData = {
    report,
    alert,
    event,
    exported_at: new Date().toISOString(),
  }

  return new Response(
    JSON.stringify({ success: true, data: exportData }),
    { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="incident_report_${report_id}.json"`,
      } 
    }
  )
}

