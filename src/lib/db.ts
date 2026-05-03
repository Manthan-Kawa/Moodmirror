/**
 * MoodMirror — Database service layer
 * All Supabase data operations are centralised here.
 * Components import from this file, never call supabase directly.
 */

import { supabase } from "./supabase";
import type { MoodLog, Journal, ChatMessage, Profile } from "./supabase";

// ── Profiles ──────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) { console.error("[db] getProfile:", error.message); return null; }
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "display_name" | "avatar_url" | "theme_preference">>
): Promise<boolean> {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) { console.error("[db] updateProfile:", error.message); return false; }
  return true;
}

// ── Mood Logs ─────────────────────────────────────────────────────────────

export async function getMoodLogs(userId: string, limit = 30): Promise<MoodLog[]> {
  const { data, error } = await supabase
    .from("mood_logs")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (error) { console.error("[db] getMoodLogs:", error.message); return []; }
  return (data ?? []) as MoodLog[];
}

export async function saveMoodLog(
  userId: string,
  log: Omit<MoodLog, "id" | "user_id" | "timestamp">
): Promise<MoodLog | null> {
  const { data, error } = await supabase
    .from("mood_logs")
    .insert({ ...log, user_id: userId })
    .select()
    .single();
  if (error) { console.error("[db] saveMoodLog:", error.message); return null; }
  return data as MoodLog;
}

// ── Journals ──────────────────────────────────────────────────────────────

export async function getJournals(userId: string, limit = 20): Promise<Journal[]> {
  const { data, error } = await supabase
    .from("journals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("[db] getJournals:", error.message); return []; }
  return (data ?? []) as Journal[];
}

export async function saveJournal(
  userId: string,
  entry: Omit<Journal, "id" | "user_id" | "created_at">
): Promise<Journal | null> {
  const { data, error } = await supabase
    .from("journals")
    .insert({ ...entry, user_id: userId })
    .select()
    .single();
  if (error) { console.error("[db] saveJournal:", error.message); return null; }
  return data as Journal;
}

export async function deleteJournal(journalId: string): Promise<boolean> {
  const { error } = await supabase.from("journals").delete().eq("id", journalId);
  if (error) { console.error("[db] deleteJournal:", error.message); return false; }
  return true;
}

export async function updateJournal(journalId: string, entryText: string, tags: any[]): Promise<boolean> {
  const { error } = await supabase.from("journals").update({ entry_text: entryText, tags: tags }).eq("id", journalId);
  if (error) { console.error("[db] updateJournal:", error.message); return false; }
  return true;
}

// ── Chat History ──────────────────────────────────────────────────────────

export async function getChatHistory(userId: string, limit = 50): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_history")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: true })
    .limit(limit);
  if (error) { console.error("[db] getChatHistory:", error.message); return []; }
  return (data ?? []) as ChatMessage[];
}

export async function saveChatMessage(
  userId: string,
  role: "user" | "ai",
  message: string
): Promise<boolean> {
  const { error } = await supabase
    .from("chat_history")
    .insert({ user_id: userId, role, message });
  if (error) { console.error("[db] saveChatMessage:", error.message); return false; }
  return true;
}

export async function deleteChatHistory(userId: string): Promise<boolean> {
  const { error } = await supabase.from("chat_history").delete().eq("user_id", userId);
  if (error) { console.error("[db] deleteChatHistory:", error.message); return false; }
  return true;
}

// ── Lumi AI (Gemini) ──────────────────────────────────────────────────────

/**
 * Sends a message to Gemini Flash and returns the AI reply.
 * Falls back to local heuristic if the API key is not set.
 */
export async function lumiChat(
  message: string,
  context: { recentMoods: MoodLog[]; recentJournals: Journal[] }
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
    console.warn("[Lumi] Gemini API Key missing, falling back to local.");
    return localLumiReply(message);
  }

  const systemPrompt = buildSystemPrompt(context);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] },
        ],
        generationConfig: { temperature: 0.85 },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        ],
      }),
    });
    const json = await res.json();
    const text: string =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ?? localLumiReply(message);
    return text.trim();
  } catch (err) {
    console.error("[Lumi] Fetch Error:", err);
    return localLumiReply(message);
  }
}


function buildSystemPrompt(context: { recentMoods: MoodLog[]; recentJournals: Journal[] }) {
  const moodSummary =
    context.recentMoods.length > 0
      ? context.recentMoods
        .slice(0, 3)
        .map((m) => `- ${m.primary_emotion} (score ${m.overall_score}/100) via ${m.source}`)
        .join("\n")
      : "No recent mood data.";

  const journalSummary =
    context.recentJournals.length > 0
      ? context.recentJournals
        .slice(0, 2)
        .map((j) => `- "${j.entry_text.slice(0, 120)}..."`)
        .join("\n")
      : "No recent journal entries.";

  return `You are Lumi, the warm, empathetic, and non-judgmental AI wellness companion inside MoodMirror.
Your personality: cosmic, calm, insightful, gentle. You speak in short, supportive sentences.
You are NOT a medical professional — always remind users to seek professional help for serious concerns.
Provide comforting, high-quality answers. Keep your responses extremely concise: exactly 2 to 3 sentences (around 50-80 words). Every word must be impactful. Do not use markdown formatting.

Recent user mood data:
${moodSummary}

Recent journal excerpts:
${journalSummary}

Use this context to make your response feel personal and tailored. Begin your reply now:`;
}

/** Fallback heuristic-based replies when Gemini API key is not set */
function localLumiReply(text: string): string {
  const t = text.toLowerCase();
  if (/(suicide|kill myself|end it|hurt myself|crisis)/.test(t))
    return "I'm really glad you reached out. Please call iCall: 9152987821 right now — you don't have to face this alone. 💙";
  if (/(sad|lonely|hopeless|cry|depress)/.test(t))
    return "That sounds heavy, and I hear you. Whatever you're feeling is valid. Want to tell me what triggered it?";
  if (/(anx|worry|panic|stress|overwhelm)/.test(t))
    return "Let's slow this down together. Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Repeat 3 times. 🌬️";
  if (/(sleep|insomnia|tired|exhausted)/.test(t))
    return "Sleep struggles are exhausting. Try a 'body scan' — close your eyes and notice each part of your body softening from head to toe.";
  if (/(happy|good|great|grateful|joy)/.test(t))
    return "That's wonderful to hear! 🎉 Savor this — what specifically is feeling right today?";
  if (/(vent|rant|talk)/.test(t))
    return "I'm here. No judgment. Tell me everything that's on your mind.";
  if (/(breath|breathe)/.test(t))
    return "Box breathing: inhale 4s → hold 4s → exhale 4s → hold 4s. Do 4 rounds. I'll be here. 🌬️";
  return "Tell me more — I'm listening. What's coming up for you right now?";
}

// ── Addresses ─────────────────────────────────────────────────────────────

export async function getAddresses(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[db] getAddresses:", error.message); return []; }
  return data ?? [];
}

export async function saveAddress(
  userId: string,
  address: any
): Promise<any | null> {
  const { data, error } = await supabase
    .from("addresses")
    .upsert({ ...address, user_id: userId })
    .select()
    .single();
  if (error) { console.error("[db] saveAddress:", error.message); return null; }
  return data;
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<boolean> {
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", addressId);
  if (error) { console.error("[db] setDefaultAddress:", error.message); return false; }
  return true;
}

export async function deleteAddress(addressId: string): Promise<boolean> {
  const { error } = await supabase.from("addresses").delete().eq("id", addressId);
  if (error) { console.error("[db] deleteAddress:", error.message); return false; }
  return true;
}

// ── Booked Sessions ───────────────────────────────────────────────────────

export async function getBookedSessions(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("booked_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[db] getBookedSessions:", error.message); return []; }
  return data ?? [];
}

export async function saveBookedSession(
  userId: string,
  session: any
): Promise<any | null> {
  const { data, error } = await supabase
    .from("booked_sessions")
    .insert({ ...session, user_id: userId })
    .select()
    .single();
  if (error) { console.error("[db] saveBookedSession:", error.message); return null; }
  return data;
}
export async function deleteBookedSession(id: string): Promise<boolean> {
  const { error } = await supabase.from("booked_sessions").delete().eq("id", id);
  if (error) { console.error("[db] deleteBookedSession:", error.message); return false; }
  return true;
}


// ── Notifications ─────────────────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[db] getNotifications:", error.message); return []; }
  return data ?? [];
}

export async function saveNotification(
  userId: string,
  notification: any
): Promise<any | null> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({ ...notification, user_id: userId })
    .select()
    .single();
  if (error) { console.error("[db] saveNotification:", error.message); return null; }
  return data;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { error } = await supabase.from("notifications").delete().eq("id", notificationId);
  if (error) { console.error("[db] deleteNotification:", error.message); return false; }
  return true;
}

// ── Exercise ──────────────────────────────────────────────────────────────

export interface ExerciseStats {
  activeVideoId: string | null;
  sessionsCompleted: number;
  minutesWatched: number;
  streakDays: number;
  lastActiveDate: string | null;
  weekDays: boolean[];
}

const DEFAULT_EXERCISE_STATS: ExerciseStats = {
  activeVideoId: null,
  sessionsCompleted: 0,
  minutesWatched: 0,
  streakDays: 0,
  lastActiveDate: null,
  weekDays: [false, false, false, false, false, false, false],
};

export async function getExerciseState(userId: string): Promise<ExerciseStats> {
  const { data, error } = await supabase.from("profiles").select("theme_preference").eq("id", userId).single();
  if (error || !data?.theme_preference) return DEFAULT_EXERCISE_STATS;

  try {
    // Check if it's the old format
    if (data.theme_preference.startsWith("active_video:")) {
      return { ...DEFAULT_EXERCISE_STATS, activeVideoId: data.theme_preference.split(":")[1] };
    }
    const parsed = JSON.parse(data.theme_preference);
    // Basic check to ensure it's an exercise stats object
    if (parsed && typeof parsed.sessionsCompleted !== "undefined") {
      return { ...DEFAULT_EXERCISE_STATS, ...parsed };
    }
  } catch (e) {
    // If it's just "dark" or invalid JSON, return defaults
  }
  return DEFAULT_EXERCISE_STATS;
}

export async function saveExerciseState(userId: string, stats: ExerciseStats): Promise<void> {
  const val = JSON.stringify(stats);
  await supabase.from("profiles").update({ theme_preference: val }).eq("id", userId);
}
