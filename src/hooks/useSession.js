import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseReady } from "../lib/supabase.js";

// ── useSession ───────────────────────────────────────────────────────
// Subscribes to Supabase auth state and exposes sign-up / sign-in /
// sign-out helpers. Returns the live session (null when signed out).
//
// signUp returns { success, needsConfirm } so the caller can decide
// whether to show a "check your email" message — Supabase projects
// have email-confirmation either ON (needsConfirm=true, no session
// returned) or OFF (needsConfirm=false, session is immediately live).
export function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!isSupabaseReady()) {
      setLoading(false);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async ({ email, password, name }) => {
    if (!isSupabaseReady()) {
      setError("Auth is not configured.");
      return { success: false, needsConfirm: false };
    }
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (err) {
      setError(err.message);
      return { success: false, needsConfirm: false };
    }
    return { success: true, needsConfirm: !data.session };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    if (!isSupabaseReady()) {
      setError("Auth is not configured.");
      return { success: false };
    }
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      return { success: false };
    }
    return { success: true };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseReady()) return;
    setError(null);
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError: () => setError(null),
  };
}
