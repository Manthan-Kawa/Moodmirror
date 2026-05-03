/**
 * MoodMirror — Authentication Context
 *
 * Wraps the entire app. Provides:
 *  - `user`          — Supabase User object (null when logged out)
 *  - `profile`       — DB profile row (display_name, avatar_url, etc.)
 *  - `loading`       — true while the session is being resolved
 *  - `signInEmail`   — sign in with email + password
 *  - `signUpEmail`   — create account with email + password
 *  - `signInGoogle`  — OAuth redirect to Google
 *  - `signOut`       — log out and clear session
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile } from "./supabase";
import { getProfile } from "./db";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<string | null>;
  signUpEmail: (email: string, password: string, name: string) => Promise<string | null>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const p = await getProfile(uid);
    setProfile(p);
  };

  useEffect(() => {
    // Resolve the initial session (handles page refreshes, OAuth redirects)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInEmail = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signUpEmail = async (
    email: string,
    password: string,
    name: string
  ): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    return error?.message ?? null;
  };

  const signInGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInEmail,
        signUpEmail,
        signInGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — throws if used outside <AuthProvider> */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Convenience hook — true when a user is signed in */
export function useIsAuthenticated(): boolean {
  return !!useAuth().user;
}
