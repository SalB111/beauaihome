// ── Supabase client scaffold ─────────────────────────────────────────
// Wired up but not yet used for real auth — that comes in Phase 2.
// Env vars expected on Vercel + local .env.local:
//   VITE_SUPABASE_URL=https://<project>.supabase.co
//   VITE_SUPABASE_ANON_KEY=<public anon key>
//
// Never import the service-role key client-side. That stays server-only.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export null when env is missing so the app doesn't crash in local dev.
// Auth UI should check `isSupabaseReady()` before attempting operations.
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function isSupabaseReady() {
  return supabase !== null;
}
