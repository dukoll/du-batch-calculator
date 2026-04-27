import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

// Wrap fetch with a timeout so a paused/unreachable Supabase instance
// (free tier pauses after ~7 days of inactivity) never hangs the app
// indefinitely. 8 s is enough for a slow cold-start; short enough that
// the user sees an error quickly rather than a forever-spinner.
function fetchWithTimeout(input, init) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  return fetch(input, { ...init, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: fetchWithTimeout },
})
