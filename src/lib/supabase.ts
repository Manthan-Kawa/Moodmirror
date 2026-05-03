import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[MoodMirror] Supabase env vars not set. " +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

// ── Typed row shapes ────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  theme_preference: string;
  created_at: string;
}

export interface MoodLog {
  id: string;
  user_id: string;
  overall_score: number;
  primary_emotion: string;
  source: "face" | "voice" | "journal";
  raw_data: Record<string, unknown>;
  timestamp: string;
}

export interface Journal {
  id: string;
  user_id: string;
  entry_text: string;
  nlp_sentiment_score: number | null;
  tags: { label: string; color: string }[] | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "ai";
  message: string;
  timestamp: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  street: string;
  city: string;
  coordinates: { lat: number; lng: number } | null;
  is_default: boolean;
  created_at: string;
}

export interface BookedSession {
  id: string;
  user_id: string;
  therapist_name: string;
  session_date: string;
  session_time: string;
  status: string;
  session_type: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  icon: string;
  title: string;
  body: string;
  time_label: string;
  unread: boolean;
  created_at: string;
}
