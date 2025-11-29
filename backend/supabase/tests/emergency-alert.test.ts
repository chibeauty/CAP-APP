// Unit tests for Emergency Alert Engine
// Run with: deno test --allow-net --allow-env

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''

Deno.test("Emergency Alert - Create Alert", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/emergency-alert`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'create',
      level: 'high',
      location: { lat: 40.7128, lng: -74.0060 },
      message: 'Test alert',
    }),
  })

  const data = await response.json()
  assertEquals(response.status, 200)
  assertExists(data.alert)
  assertEquals(data.alert.level, 'high')
})

Deno.test("Emergency Alert - Fetch Active Alert", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/emergency-alert`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'fetch_active',
    }),
  })

  const data = await response.json()
  assertEquals(response.status, 200)
  assertExists(data.alert !== undefined)
})

Deno.test("Emergency Alert - Invalid Action", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/emergency-alert`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'invalid_action',
    }),
  })

  assertEquals(response.status, 400)
})

