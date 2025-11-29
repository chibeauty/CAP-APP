// Communication Engine - Supabase Edge Function
// Handles messaging, group chat, push-to-talk, and WebRTC signaling

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CommunicationRequest {
  action: 'create_thread' | 'send_message' | 'get_threads' | 'get_messages' | 'webrtc_offer' | 'webrtc_answer' | 'webrtc_ice'
  thread_id?: string
  thread_type?: 'direct' | 'event' | 'group' | 'broadcast' | 'emergency'
  participants?: string[]
  event_id?: string
  alert_id?: string
  content?: string
  type?: 'chat' | 'video' | 'ptt' | 'audio'
  audio_url?: string
  video_call_session_id?: string
  webrtc_data?: any
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

    const { action, ...data }: CommunicationRequest = await req.json()

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
      case 'create_thread':
        return await createThread(supabaseClient, user.id, data)
      
      case 'send_message':
        return await sendMessage(supabaseClient, user.id, data)
      
      case 'get_threads':
        return await getThreads(supabaseClient, user.id)
      
      case 'get_messages':
        return await getMessages(supabaseClient, user.id, data)
      
      case 'webrtc_offer':
      case 'webrtc_answer':
      case 'webrtc_ice':
        return await handleWebRTCSignaling(supabaseClient, user.id, action, data)
      
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

async function createThread(
  supabase: any,
  userId: string,
  data: Partial<CommunicationRequest>
) {
  const { thread_type, participants, event_id, alert_id } = data

  if (!thread_type || !participants || participants.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Thread type and participants are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Ensure current user is in participants
  if (!participants.includes(userId)) {
    participants.push(userId)
  }

  // Generate unique thread key
  let threadKey: string
  if (thread_type === 'direct' && participants.length === 2) {
    // Direct message: sort user IDs for consistency
    threadKey = `direct_${participants.sort().join('_')}`
  } else if (thread_type === 'event' && event_id) {
    threadKey = `event_${event_id}`
  } else if (thread_type === 'emergency' && alert_id) {
    threadKey = `emergency_${alert_id}`
  } else {
    threadKey = `thread_${Date.now()}_${userId}`
  }

  // Check if thread already exists
  const { data: existingThread } = await supabase
    .from('message_threads')
    .select('*')
    .eq('thread_key', threadKey)
    .single()

  if (existingThread) {
    return new Response(
      JSON.stringify({ success: true, thread: existingThread }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create new thread
  const { data: thread, error } = await supabase
    .from('message_threads')
    .insert({
      thread_key: threadKey,
      thread_type,
      participants,
      event_id: event_id || null,
      alert_id: alert_id || null,
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
    JSON.stringify({ success: true, thread }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendMessage(
  supabase: any,
  userId: string,
  data: Partial<CommunicationRequest>
) {
  const { thread_id, content, type, audio_url, video_call_session_id } = data

  if (!thread_id) {
    return new Response(
      JSON.stringify({ error: 'Thread ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!content && !audio_url && !video_call_session_id) {
    return new Response(
      JSON.stringify({ error: 'Message content, audio URL, or video session ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify user is participant in thread
  const { data: thread } = await supabase
    .from('message_threads')
    .select('participants')
    .eq('thread_key', thread_id)
    .single()

  if (!thread || !thread.participants.includes(userId)) {
    return new Response(
      JSON.stringify({ error: 'Not a participant in this thread' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      thread_id,
      sender_id: userId,
      content: content || '',
      type: type || 'chat',
      audio_url: audio_url || null,
      video_call_session_id: video_call_session_id || null,
    })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update thread last message
  await supabase
    .from('message_threads')
    .update({
      last_message_id: message.id,
      last_message_at: new Date().toISOString(),
    })
    .eq('thread_key', thread_id)

  // Create notifications for other participants
  const otherParticipants = thread.participants.filter((id: string) => id !== userId)
  if (otherParticipants.length > 0) {
    const notifications = otherParticipants.map((participantId: string) => ({
      user_id: participantId,
      type: 'message',
      title: 'New Message',
      body: content || 'New audio message',
      data: { thread_id, message_id: message.id },
      sent_via: ['push'],
    }))

    await supabase.from('notifications').insert(notifications)
  }

  return new Response(
    JSON.stringify({ success: true, message }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getThreads(
  supabase: any,
  userId: string
) {
  const { data: threads, error } = await supabase
    .from('message_threads')
    .select('*')
    .contains('participants', [userId])
    .order('last_message_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, threads: threads || [] }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getMessages(
  supabase: any,
  userId: string,
  data: Partial<CommunicationRequest>
) {
  const { thread_id } = data

  if (!thread_id) {
    return new Response(
      JSON.stringify({ error: 'Thread ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify user is participant
  const { data: thread } = await supabase
    .from('message_threads')
    .select('participants')
    .eq('thread_key', thread_id)
    .single()

  if (!thread || !thread.participants.includes(userId)) {
    return new Response(
      JSON.stringify({ error: 'Not a participant in this thread' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', thread_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Mark messages as read
  await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('thread_id', thread_id)
    .neq('sender_id', userId)
    .eq('is_read', false)

  return new Response(
    JSON.stringify({ success: true, messages: messages || [] }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleWebRTCSignaling(
  supabase: any,
  userId: string,
  action: string,
  data: Partial<CommunicationRequest>
) {
  const { thread_id, webrtc_data } = data

  if (!thread_id || !webrtc_data) {
    return new Response(
      JSON.stringify({ error: 'Thread ID and WebRTC data are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Store WebRTC signaling data in real-time channel
  // In production, use Supabase Realtime channels for peer-to-peer signaling
  // This is a simplified version that stores signaling data

  const signalingData = {
    thread_id,
    from_user: userId,
    action,
    data: webrtc_data,
    timestamp: new Date().toISOString(),
  }

  // Broadcast via Supabase Realtime
  // In a real implementation, you'd use Supabase Realtime channels
  // For now, return the signaling data to be handled by the client

  return new Response(
    JSON.stringify({ success: true, signaling: signalingData }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

