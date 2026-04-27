import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// NOTE: Do NOT pass a custom fetch with an AbortController here.
// The Supabase JS client already manages its own internal AbortSignals per
// request. Wrapping fetch and overwriting `init.signal` causes every request
// to abort immediately with "AbortError: signal is aborted without reason"
// because the two controllers conflict.
//
// The app already handles slow/unreachable Supabase gracefully:
//   - AuthContext.init() has try/catch + finally { setReady(true) }
//   - DataContext has the same pattern
// So the UI never hangs; it just shows the login page if Supabase is down.

export const supabase = createClient(supabaseUrl, supabaseKey)
