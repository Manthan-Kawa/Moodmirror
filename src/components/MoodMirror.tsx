import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { getExerciseState, saveExerciseState, lumiChat, saveChatMessage, getChatHistory, saveMoodLog, getMoodLogs, saveJournal, getJournals, updateJournal, deleteJournal, getAddresses, saveAddress, deleteAddress, setDefaultAddress, getBookedSessions, saveBookedSession, deleteBookedSession, getNotifications, saveNotification, deleteNotification, updateProfile } from "@/lib/db";
import type { MoodLog, Journal } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
const Spline = lazy(() => import("@splinetool/react-spline"));

const SPLINE_SCENE = "https://prod.spline.design/WNp48Pbf8SYIY7c2/scene.splinecode";
const SPLINE_HUB = "https://prod.spline.design/Fnt2680NYart7t94/scene.splinecode";

const DYNAMIC_PHRASES = [
  "True Resilience",
  "Mental Clarity",
  "Inner Peace",
  "Emotional Balance",
  "Deep Healing",
  "Mindful Living",
  "Unwavering Strength",
  "Anxiety Relief",
  "Calm Focus",
  "Self Discovery",
];
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Brain,
  MessageCircle,
  X,
  Send,
  Menu,
  Sun,
  Moon,
  Camera,
  Mic,
  BookOpen,
  BarChart3,
  History,
  Heart,
  LifeBuoy,
  Sparkles,
  Star,
  Phone,
  ScanFace,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User as UserIcon,
  Bell,
  Settings,
  LogOut,
  CheckCheck,
  ExternalLink,
  Shield,
  BookMarked,
  Users,
  Stethoscope,
  MapPin,
  Home as HomeIcon,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Check,
  Search,
  Minus,
  LocateFixed,
  MoreVertical,
  Navigation,
  AlertCircle,
  Zap,
  Eye,
  EyeOff,
  RefreshCw, ChevronDown,
  Loader2, CheckCircle2,
} from "lucide-react";

type View =
  | "start"
  | "login"
  | "home"
  | "dashboard"
  | "face"
  | "voice"
  | "journal"
  | "history"
  | "nearby-resources"
  | "support"
  | "exercise"
  | "settings"
  | "booked-sessions"
  | "address"
  | "score";



const THERAPISTS = [
  { name: "Dr. Anika Rao", specialty: ["Anxiety", "CBT"], match: 96, rating: 4.9, price: 1200 },
  { name: "Dr. Vikram Shah", specialty: ["Depression", "Mindfulness"], match: 91, rating: 4.8, price: 1500 },
  { name: "Dr. Priya Menon", specialty: ["Trauma", "EMDR"], match: 88, rating: 4.9, price: 1800 },
  { name: "Dr. Karan Iyer", specialty: ["Stress", "Burnout"], match: 84, rating: 4.7, price: 1000 },
  { name: "Dr. Saanvi Gupta", specialty: ["Relationships", "CBT"], match: 81, rating: 4.6, price: 1300 },
  { name: "Dr. Rohan Kapoor", specialty: ["Sleep", "Anxiety"], match: 78, rating: 4.7, price: 1100 },
];

const QUICK_CHIPS = ["I'm anxious", "I can't sleep", "I need to vent", "Breathing exercise"];

// aiReply is now handled by lumiChat() in src/lib/db.ts (Gemini Flash)

function tagJournal(text: string) {
  const t = text.toLowerCase();
  const tags: { label: string; color: string }[] = [];
  if (/(sad|lonely|hopeless|empty)/.test(t)) tags.push({ label: "Low Mood", color: "bg-red-500/20 text-red-300 border-red-500/40" });
  if (/(anx|worried|stress|panic)/.test(t)) tags.push({ label: "Anxiety", color: "bg-orange-500/20 text-orange-300 border-orange-500/40" });
  if (/(happy|grateful|joy|excited)/.test(t)) tags.push({ label: "Positive", color: "bg-green-500/20 text-green-300 border-green-500/40" });
  if (/(tired|exhausted|drained)/.test(t)) tags.push({ label: "Fatigue", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" });
  if (/(angry|frustrated|mad|irritat)/.test(t)) tags.push({ label: "Irritability", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" });
  return tags;
}

// ── Floating orbs background ─────────────────────────
function Orbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {[
        { c: "bg-indigo-600", s: "w-96 h-96", p: "top-[-5%] left-[-5%]", d: "0s" },
        { c: "bg-cyan-500", s: "w-80 h-80", p: "top-[20%] right-[-5%]", d: "2s" },
        { c: "bg-purple-600", s: "w-72 h-72", p: "bottom-[10%] left-[10%]", d: "4s" },
        { c: "bg-cyan-400", s: "w-64 h-64", p: "bottom-[-5%] right-[20%]", d: "1s" },
        { c: "bg-indigo-500", s: "w-80 h-80", p: "top-[40%] left-[30%]", d: "3s" },
        { c: "bg-purple-500", s: "w-60 h-60", p: "top-[10%] left-[50%]", d: "5s" },
      ].map((o, i) => (
        <div
          key={i}
          className={`absolute rounded-full blur-3xl opacity-30 ${o.c} ${o.s} ${o.p}`}
          style={{ animation: `orbFloat 9s ease-in-out infinite`, animationDelay: o.d }}
        />
      ))}
    </div>
  );
}



// ── Spline overlay — lazy, enhances after load ────────────────────────
function SplineOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 1 }}>
      <Suspense fallback={null}>
        <Spline scene={SPLINE_SCENE} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />
      </Suspense>
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(6,6,14,0.18) 0%, rgba(6,6,14,0.38) 60%, rgba(6,6,14,0.65) 100%)" }} />
    </div>
  );
}

// ── Lumi Bot Widget ──────────────────────────────────
function ChatWidget() {
  const INITIAL_MSG = [{ role: "ai" as const, text: "Hi! I'm Lumi, your MoodMirror AI. How are you feeling right now? 😊" }];
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [botVisible, setBotVisible] = useState(true);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [msgs, setMsgs] = useState<{ role: "ai" | "user"; text: string }[]>(INITIAL_MSG);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from Supabase on mount (falls back to localStorage)
  useEffect(() => {
    if (!user) {
      try {
        const raw = localStorage.getItem("mm_chat");
        if (raw) setMsgs(JSON.parse(raw));
      } catch { }
      return;
    }
    getChatHistory(user.id).then((history) => {
      if (history.length > 0) {
        setMsgs(history.map((m) => ({ role: m.role as "ai" | "user", text: m.message })));
      }
    });
  }, [user?.id]);

  // Close 3-dot menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleDeleteChat = async () => {
    setMsgs([]);
    localStorage.removeItem("mm_chat");
    setMenuOpen(false);
    setOpen(false);
    if (user) {
      const { deleteChatHistory } = await import("@/lib/db");
      await deleteChatHistory(user.id);
    }
  };

  const handleRestartChat = async () => {
    setMsgs(INITIAL_MSG);
    localStorage.removeItem("mm_chat");
    setMenuOpen(false);
    if (user) {
      const { deleteChatHistory } = await import("@/lib/db");
      await deleteChatHistory(user.id);
      await saveChatMessage(user.id, "ai", INITIAL_MSG[0].text);
    }
  };

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-lumi-chat", handleOpen);
    return () => window.removeEventListener("open-lumi-chat", handleOpen);
  }, []);


  // ── Animation Cycle: Bot (7s visible, 5s hidden), Comment (every 5th loop) ────────────
  useEffect(() => {
    let cycleTimer: ReturnType<typeof setTimeout>;
    let bubbleShowTimer: ReturnType<typeof setTimeout>;
    let bubbleHideTimer: ReturnType<typeof setTimeout>;
    let loopCount = 0; // Tracks which loop we are on

    function runCycle() {
      loopCount++; // Increment at the start of each cycle

      // Show bot
      setBotVisible(true);

      // Show bubble on Loop 1, Loop 5, Loop 9...
      if (loopCount === 1 || (loopCount - 1) % 4 === 0) {
        bubbleShowTimer = setTimeout(() => {
          setBubbleVisible(true);
          // Hide bubble 3 seconds after it appears
          bubbleHideTimer = setTimeout(() => {
            setBubbleVisible(false);
          }, 3000);
        }, 400);
      }

      // Hide bot after 7 seconds (7000ms)
      cycleTimer = setTimeout(() => {
        setBotVisible(false);
        setBubbleVisible(false); // Failsafe to ensure bubble hides

        // Wait 5 seconds hidden then restart
        cycleTimer = setTimeout(runCycle, 5000);
      }, 7000);
    }

    runCycle();

    return () => {
      clearTimeout(cycleTimer);
      clearTimeout(bubbleShowTimer);
      clearTimeout(bubbleHideTimer);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mm_chat", JSON.stringify(msgs));
    } catch { }
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [msgs, typing]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t) return;
      setMsgs((m) => [...m, { role: "user", text: t }]);
      setInput("");
      setTyping(true);
      // Persist user message to DB
      if (user) await saveChatMessage(user.id, "user", t);
      try {
        // Fetch context (mood logs + journals) for Gemini system prompt
        const [recentMoods, recentJournals] = user
          ? await Promise.all([getMoodLogs(user.id, 3), getJournals(user.id, 2)])
          : [[] as MoodLog[], [] as Journal[]];
        const reply = await lumiChat(t, { recentMoods, recentJournals });
        setMsgs((m) => [...m, { role: "ai", text: reply }]);
        if (user) await saveChatMessage(user.id, "ai", reply);
      } catch {
        setMsgs((m) => [...m, { role: "ai", text: "Sorry, I had a moment of silence. Try again! 🌙" }]);
      } finally {
        setTyping(false);
      }
    },
    [user]
  );

  return (
    <>
      {/* ── Lumi floating bot + speech bubble ── */}
      <div
        className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none"
        style={{ userSelect: "none" }}
      >
        {/* Speech bubble — pops up from bot */}
        <div
          style={{
            opacity: bubbleVisible ? 1 : 0,
            transform: bubbleVisible ? "translateY(0) scale(1)" : "translateY(14px) scale(0.93)",
            transition: "opacity 0.42s cubic-bezier(0.34,1.56,0.64,1), transform 0.42s cubic-bezier(0.34,1.56,0.64,1)",
            pointerEvents: bubbleVisible ? "auto" : "none",
          }}
        >
          <div
            style={{
              background: "rgba(10,10,20,0.72)",
              backdropFilter: "blur(16px)",
              border: "1.5px solid rgba(139,92,246,0.55)",
              borderRadius: "18px 18px 4px 18px",
              padding: "14px 16px 12px",
              maxWidth: 260,
              boxShadow: "0 0 0 1px rgba(139,92,246,0.12), 0 0 24px rgba(139,92,246,0.28), 0 8px 32px rgba(0,0,0,0.55)",
              position: "relative",
            }}
          >
            {/* Glow ring on border */}
            <div style={{
              position: "absolute", inset: -1,
              borderRadius: "18px 18px 4px 18px",
              background: "linear-gradient(135deg, rgba(139,92,246,0.6), rgba(6,182,212,0.4))",
              opacity: 0.25,
              pointerEvents: "none",
            }} />
            <p style={{ color: "rgba(255,255,255,0.92)", fontSize: 13, lineHeight: 1.55, marginBottom: 12, position: "relative", zIndex: 1 }}>
              Hello! I'm Lumi, your personal Ai Assistant Chatbot. You can ask me anything 😊 !!
            </p>
            <button
              onClick={() => { setOpen(true); setBubbleVisible(false); }}
              style={{
                position: "relative", zIndex: 1,
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 14px",
                borderRadius: 999,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.02em",
                // Glowing border via box-shadow
                boxShadow: "0 0 0 1.5px rgba(139,92,246,0.85), 0 0 12px rgba(139,92,246,0.55), 0 0 28px rgba(6,182,212,0.3)",
                animation: "lumiGlowPulse 2.2s ease-in-out infinite",
                pointerEvents: "auto",
              }}
            >
              <span>Chat with Lumi</span>
              <span style={{ fontSize: 15 }}>✨</span>
            </button>
          </div>
          {/* Tail of speech bubble */}
          <div style={{
            position: "absolute",
            bottom: -8,
            right: 28,
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "0px solid transparent",
            borderTop: "8px solid rgba(139,92,246,0.55)",
          }} />
        </div>

        {/* Lumi bot avatar — outer wrapper handles pop-in/out transition */}
        <div
          style={{
            opacity: botVisible ? 1 : 0,
            transform: botVisible ? "translateY(0) scale(1)" : "translateY(36px) scale(0.55)",
            transition: "opacity 0.55s cubic-bezier(0.34,1.56,0.64,1), transform 0.55s cubic-bezier(0.34,1.56,0.64,1)",
            pointerEvents: botVisible ? "auto" : "none",
            flexShrink: 0,
          }}
        >
          {/* Inner wrapper — float bob animation */}
          <div
            onClick={() => { setOpen(true); setBubbleVisible(false); }}
            role="button"
            tabIndex={0}
            aria-label="Chat with Lumi"
            onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
            style={{
              cursor: "pointer",
              animation: "lumiFloat 3.5s ease-in-out infinite",
              pointerEvents: "auto",
              filter: "drop-shadow(0 4px 12px rgba(6,182,212,0.4)) drop-shadow(0 0 20px rgba(139,92,246,0.3))"
            }}
          >
            <svg
              viewBox="0 0 64 64"
              className="w-16 h-16"
            >
              {/* Neck/Base */}
              <rect x="24" y="52" width="16" height="6" rx="2" fill="#1e293b" />

              {/* Ears */}
              <rect x="6" y="30" width="8" height="16" rx="4" fill="#0284c7" />
              <rect x="50" y="30" width="8" height="16" rx="4" fill="#0284c7" />

              {/* Antenna */}
              <line x1="32" y1="8" x2="32" y2="22" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
              <circle cx="32" cy="8" r="4" fill="#7dd3fc" />

              {/* Main Head Outer */}
              <rect x="12" y="20" width="40" height="34" rx="12" fill="#0ea5e9" />

              {/* Inner Face */}
              <rect x="16" y="25" width="32" height="24" rx="8" fill="#0369a1" />

              {/* Eyes */}
              <rect x="22" y="30" width="6" height="10" rx="3" fill="#22d3ee" style={{ filter: "drop-shadow(0 0 3px #22d3ee)" }} />
              <rect x="36" y="30" width="6" height="10" rx="3" fill="#22d3ee" style={{ filter: "drop-shadow(0 0 3px #22d3ee)" }} />
            </svg>
          </div>
        </div>
      </div>

      {/* Chat panel backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Chat slide-in panel */}
      <div
        className={`fixed top-0 right-0 z-45 h-full w-full sm:w-[380px] bg-[#0A0A0F] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"
          } flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-cyan-600/10">
          <div className="flex items-center gap-2 text-white font-semibold">
            <img src="/src/logo/logo.png" alt="Lumi Logo" className="h-5 w-5 object-contain" />
            Lumi — Your AI Companion
          </div>
          <div className="flex items-center gap-1">
            {/* 3-dot menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition"
                aria-label="Chat options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-10 w-44 rounded-xl overflow-hidden shadow-2xl z-10 animate-[fadeUp_0.18s_ease-out]"
                  style={{
                    background: "rgba(15,12,30,0.97)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <button
                    onClick={handleRestartChat}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-white/80 hover:bg-white/8 hover:text-white transition"
                  >
                    <RefreshCw className="h-4 w-4 text-cyan-400" />
                    Restart Chat
                  </button>
                  <div className="h-px bg-white/8 mx-3" />
                  <button
                    onClick={handleDeleteChat}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Chat
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.role === "ai"
                ? "bg-white/5 text-white/90 border border-white/10"
                : "ml-auto bg-gradient-to-br from-violet-500 to-cyan-600 text-white"
                }`}
            >
              {m.text}
            </div>
          ))}
          {typing && (
            <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-2xl w-fit flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 bg-violet-400 rounded-full"
                  style={{ animation: `bounce 1s infinite`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-white/10">
          {QUICK_CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => send(c)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all"
            >
              {c}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-white/10 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask Lumi anything..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={() => send(input)}
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-600 text-white flex items-center justify-center hover:scale-105 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

// ── Brand Logo ──────────────────────────────────────
function BrandLogo({ size = 32, withText = true, textClass = "text-xl font-bold tracking-tight" }: { size?: number; withText?: boolean; textClass?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <img
        src="/MM.png"
        alt="MoodMirror logo"
        width={size}
        height={size}
        className="object-contain"
        style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.5))" }}
      />
      {withText && (
        <span className={`${textClass} bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent`}>
          MoodMirror
        </span>
      )}
    </span>
  );
}


// ── Get Started ──────────────────────────────────────
function GetStarted({ go }: { go: (v: View) => void }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const currentPhrase = DYNAMIC_PHRASES[phraseIdx];

    if (isDeleting) {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        }, 50);
      } else {
        setIsDeleting(false);
        setPhraseIdx((i) => (i + 1) % DYNAMIC_PHRASES.length);
      }
    } else {
      if (displayText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, 100);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 15000);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIdx]);

  return (
    <div className="relative min-h-screen text-white overflow-hidden flex flex-col" style={{ background: "transparent" }}>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <BrandLogo size={32} textClass="text-xl font-bold tracking-tight" />
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
          <button className="hover:text-white transition">Features</button>
          <button className="hover:text-white transition">About</button>
          <button
            onClick={() => go("login")}
            className="px-5 py-2 rounded-full border border-white/30 hover:border-white/60 hover:bg-white/10 transition text-white text-sm"
          >
            Sign in
          </button>
        </nav>
      </header>

      {/* Hero content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-xs text-white/70 tracking-widest uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
          MoodMirror AI — v1.0
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-3 tracking-tight">
          Your Mind, Meets
        </h1>
        <h1
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center min-h-[1em]"
        >
          {displayText}
          <span className="w-[3px] h-[1em] ml-2 bg-cyan-400 animate-pulse inline-block" />
        </h1>

        {/* Subtext */}
        <p className="text-white/60 text-base md:text-lg max-w-xl mb-10 leading-relaxed">
          MoodMirror intelligently maps your emotional state to personalized
          wellness pathways — faster insight, better outcomes.
        </p>

        {/* CTA */}
        <button
          onClick={() => go("login")}
          className="inline-flex items-center gap-2 px-9 py-4 rounded-full font-semibold text-base md:text-lg text-white bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-500 shadow-[0_0_40px_rgba(139,92,246,0.55)] hover:scale-105 hover:shadow-[0_0_60px_rgba(139,92,246,0.7)] transition-all duration-300"
        >
          Get Started <ArrowRight className="h-5 w-5" />
        </button>

        {/* Already have account */}
        <p className="mt-5 text-sm text-white/50">
          Already have an account?{" "}
          <button onClick={() => go("login")} className="text-cyan-400 hover:underline">
            Sign In
          </button>
        </p>
      </main>
    </div>
  );
}

// ── Login ────────────────────────────────────────────
function Login({ go, setName }: { go: (v: View) => void; setName: (n: string) => void }) {
  const [tab, setTab] = useState<"in" | "up">("in");
  const [form, setForm] = useState({ name: "", email: "", pw: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInEmail, signUpEmail, signInGoogle } = useAuth();

  const submit = async () => {
    setError("");

    if (tab === "in") {
      if (!form.email.trim() || !form.pw.trim()) {
        setError("Please enter your email and password.");
        return;
      }
      setLoading(true);
      const err = await signInEmail(form.email.trim(), form.pw);
      setLoading(false);
      if (err) {
        setError(err);
      } else {
        setName(form.email.split("@")[0]);
        go("home");
      }
    } else {
      if (!form.name.trim() || !form.email.trim() || !form.pw.trim() || !form.confirm.trim()) {
        setError("Please fill in all fields.");
        return;
      }
      if (form.pw !== form.confirm) {
        setError("Passwords do not match.");
        return;
      }
      setLoading(true);
      const err = await signUpEmail(form.email.trim(), form.pw, form.name.trim());
      setLoading(false);
      if (err) {
        setError(err);
      } else {
        setName(form.name.split(" ")[0]);
        go("home");
      }
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden flex items-center justify-center px-6" style={{ background: "transparent" }}>
      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-[fadeUp_0.5s_ease-out]">
        {/* Top-left back arrow */}
        <button
          onClick={() => go("start")}
          className="absolute top-5 left-5 h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex justify-center mb-6">
          <BrandLogo size={36} textClass="text-2xl font-bold tracking-tight" />
        </div>
        <div className="flex mb-6 border-b border-white/10">
          {(["in", "up"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium relative ${tab === t ? "text-white" : "text-white/50"
                }`}
            >
              {t === "in" ? "Sign In" : "Sign Up"}
              {tab === t && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500" />
              )}
            </button>
          ))}
        </div>

        <div
          key={tab}
          className="space-y-3 animate-[fadeUp_0.28s_ease-out]"
        >
          {tab === "up" && (
            <Input icon={<UserIcon className="h-4 w-4" />} placeholder="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          )}
          <Input icon={<Mail className="h-4 w-4" />} placeholder="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          <Input icon={<Lock className="h-4 w-4" />} type="password" placeholder="Password" value={form.pw} onChange={(v) => setForm({ ...form, pw: v })} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          {tab === "up" && (
            <Input icon={<Lock className="h-4 w-4" />} type="password" placeholder="Confirm Password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          )}
          {tab === "in" && (
            <div className="text-right">
              <a className="text-xs text-cyan-400 hover:underline cursor-pointer">Forgot password?</a>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs animate-[fadeUp_0.3s_ease-out]">
              <span className="text-base">⚠️</span>
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-700/30 hover:scale-[1.02] transition relative overflow-hidden disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Authenticating...
              </span>
            ) : (
              tab === "in" ? "Sign In" : "Create Account"
            )}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-white/40">
          <div className="flex-1 h-px bg-white/10" /> or <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="space-y-2">
          {/* Google button with SVG logo */}
          <button onClick={() => signInGoogle()} className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm flex items-center justify-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.3C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.2-11.3-8H6.3C9.6 35.5 16.3 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.3C40.9 36.1 44 30.5 44 24c0-1.3-.1-2.6-.4-3.9z" />
            </svg>
            Continue with Google
          </button>

          {/* Apple button with SVG logo */}
          <button className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm flex items-center justify-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 814 1000" fill="currentColor" className="text-white">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-105.5c-47.5-64.2-88.1-162.7-88.1-256 0-131.1 85.5-200.2 169.2-200.2 46.9 0 85.9 30.5 114.9 30.5 28.5 0 73.2-30.5 127.5-30.5 50.9 0 109.2 20.2 149.5 71.4zm-234.6-159.7c23.2-27.6 39.9-65.7 39.9-103.7 0-5.1-.4-10.3-1.2-14.7-37.4 1.4-81.7 24.9-108.2 56.1-20.8 23.8-40.8 61.6-40.8 100.2 0 5.9.9 11.8 1.4 13.8 2.3.4 6.1.9 9.9.9 33.9 0 76.7-22.5 99-52.6z" />
            </svg>
            Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ icon, onKeyDown, ...p }: { icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; type?: string; onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void }) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = p.type === "password";
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">{icon}</div>
      <input
        type={isPassword ? (showPw ? "text" : "password") : (p.type || "text")}
        placeholder={p.placeholder}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPw(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors duration-150"
          aria-label={showPw ? "Hide password" : "Show password"}
        >
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

// ── Notification data ─────────────────────────────────
const NOTIFICATIONS = [
  { id: 1, icon: "💜", title: "Mood Check-in Reminder", body: "Time to log how you're feeling today.", time: "2m ago", unread: true },
  { id: 2, icon: "🧠", title: "AI Insight Ready", body: "Your weekly emotional pattern report is ready.", time: "1h ago", unread: true },
  { id: 3, icon: "🎯", title: "Streak Achieved!", body: "You've logged your mood 7 days in a row. Keep it up!", time: "3h ago", unread: false },
  { id: 4, icon: "🫂", title: "Dr. Anika Rao", body: "Your next session is tomorrow at 10:00 AM.", time: "Yesterday", unread: false },
  { id: 5, icon: "✨", title: "New Affirmation", body: "'I am the calm in my own storm.' — tap to save.", time: "Yesterday", unread: false },
];

// ── Navbar ───────────────────────────────────────────
function Navbar({ name, avatar, dark, setDark, go, current, notifs, setNotifs, onSignOut }: { name: string; avatar?: string | null; dark: boolean; setDark: (b: boolean) => void; go: (v: View) => void; current: View; notifs: any[]; setNotifs: any; onSignOut?: () => void }) {
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [swipedId, setSwipedId] = useState<number | string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifs.filter((n) => n.unread).length;

  // Auto mark read on open
  useEffect(() => {
    if (notifOpen && unreadCount > 0) {
      setNotifs((n: any[]) => n.map((x) => ({ ...x, unread: false })));
    }
  }, [notifOpen, unreadCount, setNotifs]);

  // Close profile card on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const links: { v: View; label: string }[] = [
    { v: "home", label: "Home" },
    { v: "dashboard", label: "Dashboard" },
    { v: "history", label: "History" },
    { v: "nearby-resources", label: "Nearby Resources" },
    { v: "support", label: "Support" },
    { v: "exercise", label: "Exercise" },
  ];

  return (
    <>
      {/* ── Notification sidebar backdrop ── */}
      {notifOpen && (
        <div
          className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-sm"
          onClick={() => setNotifOpen(false)}
        />
      )}

      {/* ── Notification sidebar ── */}
      <div
        className="fixed top-0 right-0 z-[70] h-full w-full sm:w-[360px] flex flex-col"
        style={{
          background: "linear-gradient(160deg, rgba(18,15,40,0.97) 0%, rgba(10,10,15,0.98) 100%)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
          transform: notifOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Notifications</p>
              {unreadCount > 0 && (
                <p className="text-xs text-violet-400">{unreadCount} unread • Auto-marked on open</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNotifOpen(false)}
              className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto py-2">
          {notifs.length === 0 ? (
            <div className="flex items-center justify-center h-full flex-col gap-3 text-white/50">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                className="relative overflow-hidden mb-[1px] group"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                {/* Delete background action - slide reveal */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-red-600 to-red-500/80 flex items-center justify-center cursor-pointer hover:bg-gradient-to-l hover:from-red-500 hover:to-red-400/80 transition-all"
                  onClick={() => setNotifs((prev: any[]) => prev.filter(x => x.id !== n.id))}
                >
                  <Trash2 className="h-5 w-5 text-white" />
                </div>

                {/* Notification card (slides left to reveal delete) */}
                <div
                  onClick={() => setSwipedId(prev => prev === n.id ? null : n.id)}
                  className="relative flex items-start gap-3 px-5 py-3.5 cursor-pointer group"
                  style={{
                    background: "rgba(12,10,18,1)",
                    transform: swipedId === n.id ? "translateX(-80px)" : "translateX(0)",
                    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease"
                  }}
                >
                  {/* Unread indicator */}
                  {n.unread && (
                    <span
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400"
                      style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
                    />
                  )}
                  <div className="h-9 w-9 rounded-xl bg-white/8 flex items-center justify-center text-lg flex-shrink-0 border border-white/8 group-hover:border-white/15 group-hover:bg-white/12 transition-all">
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight mb-0.5 ${n.unread ? "text-white" : "text-white/70"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-white/45 leading-relaxed line-clamp-2">{n.body}</p>
                  </div>
                  <span className="text-[10px] text-white/30 flex-shrink-0 mt-0.5 whitespace-nowrap">{n.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Main Nav ── */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-[#0A0A0F]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => go("home")} className="hover:scale-105 transition-transform">
            <BrandLogo size={28} textClass="text-lg font-bold tracking-tight" />
          </button>
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <button
                key={l.v}
                onClick={() => go(l.v)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${current === l.v ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              id="navbar-notifications-btn"
              onClick={() => { setNotifOpen(true); setProfileOpen(false); }}
              className="relative h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(139,92,246,0.8)]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Settings icon */}
            <button
              id="navbar-settings-btn"
              onClick={() => { go("settings"); setProfileOpen(false); setNotifOpen(false); }}
              className={`h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all ${current === "settings" ? "border-violet-500/50 text-violet-400 bg-violet-500/10" : ""
                }`}
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Profile avatar + dropdown */}
            <div ref={profileRef} className="relative">
              <button
                id="navbar-profile-btn"
                onClick={() => { setProfileOpen((p) => !p); setNotifOpen(false); }}
                className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm hover:scale-105 transition-all shadow-[0_0_16px_rgba(139,92,246,0.45)] border-2 border-violet-500/40 overflow-hidden"
              >
                {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : name.slice(0, 2).toUpperCase()}
              </button>

              {/* ── Profile Card ── */}
              <div
                id="navbar-profile-card"
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  width: 280,
                  transformOrigin: "top right",
                  transform: profileOpen
                    ? "scale(1) translateY(0)"
                    : "scale(0.75) translateY(-12px)",
                  opacity: profileOpen ? 1 : 0,
                  pointerEvents: profileOpen ? "auto" : "none",
                  transition: "transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease",
                  background: "rgba(16,14,35,0.96)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 18,
                  boxShadow: "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(139,92,246,0.12)",
                  zIndex: 100,
                }}
              >
                {/* Card header */}
                <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", boxShadow: "0 4px 16px rgba(139,92,246,0.45)" }}
                  >
                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm leading-tight truncate">{name} {name === "User" ? "" : ""}</p>
                    <p className="text-white/45 text-xs mt-0.5 truncate max-w-[140px]">{user?.email || "Member"}</p>
                  </div>
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 transition flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Menu items */}
                <div className="py-2 px-2 space-y-0.5">
                  {/* My Address */}
                  <button
                    onClick={() => { setProfileOpen(false); go("address"); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/75 hover:text-white hover:bg-white/8 transition text-sm group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/15 transition">
                      <MapPin className="h-4 w-4 text-indigo-400" />
                    </div>
                    My Address
                  </button>

                  {/* Booked Sessions */}
                  <button
                    onClick={() => { setProfileOpen(false); go("booked-sessions"); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/75 hover:text-white hover:bg-white/8 transition text-sm group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/15 transition">
                      <BookMarked className="h-4 w-4 text-emerald-400" />
                    </div>
                    Booked Sessions
                  </button>

                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 4px" }} />

                  {/* Logout */}
                  <button
                    onClick={() => { setProfileOpen(false); onSignOut ? onSignOut() : go("start"); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/8 transition text-sm group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/15 transition">
                      <LogOut className="h-4 w-4" />
                    </div>
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMenu(!menu)} className="md:hidden h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-white/70">
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {menu && (
          <div className="md:hidden border-t border-white/10 px-4 py-2 space-y-1">
            {links.map((l) => (
              <button
                key={l.v}
                onClick={() => { go(l.v); setMenu(false); }}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/5"
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}

// ── Home (Hero + Hub) ──────────────────────────
function Home({ name, go, onLoadComplete }: { name: string; go: (v: View) => void; onLoadComplete?: () => void }) {
  const hubRef = useRef<HTMLDivElement>(null);
  const [buttonsReady, setButtonsReady] = useState(false);
  const greet = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
  })();

  // ── Hub buttons fade: 0.7s delay on enter, instant reset on leave ─
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Section scrolled into view — wait 0.7s then reveal
          timer = setTimeout(() => setButtonsReady(true), 700);
        } else {
          // Section scrolled out (either direction) — hide instantly
          clearTimeout(timer);
          setButtonsReady(false);
        }
      },
      { threshold: 0.2 }
    );
    if (hubRef.current) observer.observe(hubRef.current);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, []);

  return (
    <div className="bg-[#0A0A0F] text-white">
      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden px-6 md:px-12 lg:px-20"
        style={{
          background:
            "radial-gradient(ellipse at 60% 50%, rgba(99,60,210,0.22) 0%, rgba(10,10,15,1) 65%)",
        }}
      >
        {/* Two-column grid */}
        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-24">

          {/* ── LEFT: text ── */}
          <div className="flex flex-col justify-center animate-[fadeUp_0.6s_ease-out]">
            {/* Greeting */}
            <p className="text-2xl md:text-3xl font-medium mb-3 text-white/90">
              {greet}, {name} 👋
            </p>
            <p className="text-white/50 text-base md:text-lg mb-8">
              How are you feeling today? Let's find out.
            </p>

            {/* Main headline */}
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-tight tracking-tight mb-10 bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-[gradientShift_6s_ease_infinite] bg-[length:200%_auto]">
              Your Mind,<br />Understood
            </h1>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => hubRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-700 text-white font-semibold shadow-[0_0_40px_rgba(0,188,212,0.45)] hover:scale-105 transition-all"
                style={{ animation: "pulseGlow 2.4s ease-in-out infinite" }}
              >
                ✨ Analyze My Mood
              </button>
              <button
                onClick={() => go("dashboard")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all hover:scale-105"
              >
                View Dashboard
              </button>
            </div>

            {/* Quick stat pills */}
            <div className="mt-12 flex flex-wrap gap-4">
              {[
                { label: "Face Scan", icon: "🎭", v: "face" as View },
                { label: "Voice Analysis", icon: "🎙️", v: "voice" as View },
                { label: "Journal", icon: "📓", v: "journal" as View },
              ].map((item) => (
                <button
                  key={item.v}
                  onClick={() => go(item.v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-white/70 hover:text-white text-sm transition-all"
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Spline 3D brain ── */}
          <div className="relative flex items-center justify-center h-[480px] lg:h-full">
            {/* Ambient glow behind the brain */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(99,60,210,0.35) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            <Suspense
              fallback={
                <div className="flex items-center justify-center w-full h-full">
                  <div className="h-40 w-40 rounded-full bg-indigo-600/20 animate-pulse" />
                </div>
              }
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%]">
                <Spline
                  scene="https://prod.spline.design/yIB0EIiPHLV-xBVn/scene.splinecode"
                  style={{ width: "100%", height: "100%" }}
                  onLoad={() => {
                    if (onLoadComplete) onLoadComplete();
                  }}
                />
              </div>
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── ANALYSE HUB ── */}
      <section ref={hubRef} className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Spline 3D background – pointer-events ON so scene reacts to mouse */}
        <Suspense fallback={<div className="absolute inset-0 bg-[#06060e]" />}>
          <Spline
            scene={SPLINE_HUB}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
          />
        </Suspense>

        {/* Dark gradient overlay – pointer-events off so Spline still sees mouse */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: "linear-gradient(to bottom, rgba(6,6,14,0.45) 0%, transparent 45%, rgba(6,6,14,0.5) 100%)" }} />



        {/* ── Curved two-column button layout ── */}
        {/* marginTop shifts group below visual center; 7vw padding keeps bg visible on edges */}
        <div className="relative w-full flex items-center justify-between" style={{ zIndex: 3, marginTop: "12vh", padding: "0 2vw" }}>

          {/* LEFT ARC ( — middle button pushed RIGHT (toward center), outers flush */}
          <div className="flex flex-col gap-6 items-start">
            {[
              { label: "Face Recognition", icon: <ScanFace className="h-4 w-4" />, grad: "from-cyan-400 to-purple-500", glow: "rgba(0,188,212,0.5)", v: "face" as View, dx: 56, delay: 0 },
              { label: "Voice Analysis", icon: <Mic className="h-4 w-4" />, grad: "from-purple-500 to-indigo-600", glow: "rgba(123,47,190,0.5)", v: "voice" as View, dx: 0, delay: 120 },
              { label: "Journal & NLP", icon: <BookOpen className="h-4 w-4" />, grad: "from-indigo-500 to-blue-500", glow: "rgba(60,52,137,0.5)", v: "journal" as View, dx: 56, delay: 240 },
            ].map((btn) => (
              <div
                key={btn.v}
                style={{
                  transform: `translateX(${btn.dx}px) translateY(${buttonsReady ? 0 : 18}px)`,
                  opacity: buttonsReady ? 1 : 0,
                  transition: `opacity 0.7s ease ${btn.delay}ms, transform 0.7s ease ${btn.delay}ms`,
                }}
              >
                <HubBtn label={btn.label} icon={btn.icon} grad={btn.grad} glow={btn.glow} onClick={() => go(btn.v)} />
              </div>
            ))}
          </div>

          {/* RIGHT ARC ) — outers pushed LEFT (toward center), middles flush right = belly */}
          <div className="flex flex-col gap-6 items-end">
            {[
              { label: "Dashboard", icon: <BarChart3 className="h-4 w-4" />, grad: "from-cyan-400 to-teal-400", glow: "rgba(20,184,166,0.5)", v: "dashboard" as View, dx: -70, delay: 0 },
              { label: "Mood History", icon: <History className="h-4 w-4" />, grad: "from-purple-500 to-pink-500", glow: "rgba(236,72,153,0.5)", v: "history" as View, dx: 0, delay: 120 },
              { label: "Support", icon: <LifeBuoy className="h-4 w-4" />, grad: "from-pink-500 to-red-500", glow: "rgba(239,68,68,0.5)", v: "support" as View, dx: -70, delay: 240 },
            ].map((btn) => (
              <div
                key={btn.v}
                style={{
                  transform: `translateX(${btn.dx}px) translateY(${buttonsReady ? 0 : 18}px)`,
                  opacity: buttonsReady ? 1 : 0,
                  transition: `opacity 0.7s ease ${btn.delay}ms, transform 0.7s ease ${btn.delay}ms`,
                }}
              >
                <HubBtn label={btn.label} icon={btn.icon} grad={btn.grad} glow={btn.glow} onClick={() => go(btn.v)} align="right" />
              </div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}

function HubBtn({ label, icon, grad, glow, onClick, align = "left" }: { label: string; icon: React.ReactNode; grad: string; glow: string; onClick: () => void; align?: "left" | "right" }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${grad} text-white font-semibold transition-all duration-200 hover:scale-105 ${align === "right" ? "lg:self-end" : "lg:self-start"}`}
      style={{ boxShadow: `0 0 25px ${glow}` }}
    >
      <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">{icon}</span>
      {label}
    </button>
  );
}

function Robot() {
  return (
    <div className="relative" style={{ animation: "float 4s ease-in-out infinite" }}>
      <svg width="240" height="320" viewBox="0 0 240 320">
        <defs>
          <linearGradient id="metal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2a2a35" />
            <stop offset="1" stopColor="#0d0d14" />
          </linearGradient>
          <radialGradient id="visor" cx="0.5" cy="0.5">
            <stop offset="0" stopColor="#00f6ff" />
            <stop offset="1" stopColor="#00BCD4" />
          </radialGradient>
          <pattern id="carbon" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#1a1a22" />
            <circle cx="1.5" cy="1.5" r="0.5" fill="#2a2a35" />
            <circle cx="4.5" cy="4.5" r="0.5" fill="#2a2a35" />
          </pattern>
        </defs>
        {/* Head */}
        <ellipse cx="120" cy="60" rx="50" ry="55" fill="url(#metal)" stroke="#3a3a45" strokeWidth="2" />
        <rect x="80" y="55" width="80" height="20" rx="10" fill="url(#visor)" style={{ filter: "drop-shadow(0 0 10px #00BCD4)" }} />
        <circle cx="105" cy="65" r="3" fill="#fff" />
        <circle cx="135" cy="65" r="3" fill="#fff" />
        {/* Neck */}
        <rect x="110" y="110" width="20" height="15" fill="#1a1a22" />
        {/* Torso */}
        <rect x="65" y="125" width="110" height="120" rx="14" fill="url(#carbon)" stroke="#3a3a45" strokeWidth="2" />
        <circle cx="120" cy="170" r="14" fill="url(#visor)" style={{ filter: "drop-shadow(0 0 8px #00BCD4)" }} />
        <circle cx="120" cy="170" r="6" fill="#0A0A0F" />
        {/* Arms */}
        <rect x="40" y="135" width="22" height="80" rx="11" fill="url(#metal)" />
        <rect x="178" y="135" width="22" height="80" rx="11" fill="url(#metal)" />
        <circle cx="51" cy="220" r="13" fill="#1a1a22" stroke="#3a3a45" />
        <circle cx="189" cy="220" r="13" fill="#1a1a22" stroke="#3a3a45" />
        {/* Legs */}
        <rect x="85" y="248" width="22" height="60" rx="11" fill="url(#metal)" />
        <rect x="133" y="248" width="22" height="60" rx="11" fill="url(#metal)" />
        <ellipse cx="96" cy="312" rx="16" ry="6" fill="#1a1a22" />
        <ellipse cx="144" cy="312" rx="16" ry="6" fill="#1a1a22" />
      </svg>
    </div>
  );
}

// ── Page Wrapper ─────────────────────────────────────
function Page({ title, subtitle, children, go }: { title: string; subtitle?: string; children: React.ReactNode; go: (v: View) => void }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 mm-page-enter">
      <button onClick={() => go("home")} className="text-white/60 hover:text-white text-sm flex items-center gap-1 mb-4 transition-colors duration-200">
        <ArrowLeft className="h-4 w-4" /> Back to Hub
      </button>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{title}</h1>
      {subtitle && <p className="text-white/60 mb-6">{subtitle}</p>}
      {children}
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────
function Dashboard({ go, name = "Alex" }: { go: (v: View) => void; name?: string }) {
  const { user, profile } = useAuth();
  const displayName = profile?.display_name || user?.user_metadata?.full_name || name;
  const [trendRange, setTrendRange] = useState<"7" | "30">("7");
  const [spectrumReady, setSpectrumReady] = useState(false);
  const [moods, setMoods] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    getMoodLogs(user.id, 50).then(data => setMoods(data));
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => setSpectrumReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  const greet = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
  })();

  const numDays = trendRange === "7" ? 7 : 30;
  const trendData = Array.from({ length: numDays }, (_, i) => {
    const d = new Date(Date.now() - (numDays - 1 - i) * 86400000);
    const dayLogs = moods.filter(l => new Date(l.timestamp).toLocaleDateString() === d.toLocaleDateString());
    const avgMood = dayLogs.length > 0
      ? Math.round(dayLogs.reduce((acc, l) => acc + (l.overall_score / 10), 0) / dayLogs.length)
      : 5; // fallback neutral score

    return {
      day: d.toLocaleDateString(undefined, { weekday: trendRange === "7" ? "short" : undefined, month: trendRange === "30" ? "short" : undefined, day: trendRange === "30" ? "numeric" : undefined }),
      Mood: avgMood,
    };
  });

  const streak = new Set(moods.map(m => new Date(m.timestamp).toLocaleDateString())).size;
  const mindfulnessScore = moods.length > 0 ? Math.round(moods.reduce((a, b) => a + b.overall_score, 0) / moods.length) : "--";

  const emotionCounts = moods.reduce((acc, m) => {
    acc[m.primary_emotion] = (acc[m.primary_emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topEmotions = Object.entries(emotionCounts).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3);
  const colors = ["#00e5c0", "#9b87f5", "#f59e0b"];

  const spectrum = topEmotions.length > 0 ? topEmotions.map((entry, i) => ({
    label: (entry[0] as string).toUpperCase(),
    pct: Math.round(((entry[1] as number) / moods.length) * 100),
    color: colors[i],
    glow: colors[i] + "80"
  })) : [
    { label: "PENDING DATA", pct: 0, color: "#00e5c0", glow: "rgba(0,229,192,0.5)" },
  ];

  const recentShifts = moods.slice(0, 3).map((m, i) => {
    const isGood = m.overall_score > 60;
    return {
      icon: m.source === "voice" ? "🎙️" : m.source === "face" ? "📸" : "📓",
      label: m.primary_emotion,
      sub: new Date(m.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      color: isGood ? "rgba(0,229,192,0.15)" : "rgba(239,68,68,0.12)",
      border: isGood ? "rgba(0,229,192,0.3)" : "rgba(239,68,68,0.25)"
    };
  });
  if (recentShifts.length === 0) {
    recentShifts.push({ icon: "⏳", label: "No Activity", sub: "Scan to begin tracking", color: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.2)" });
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    backdropFilter: "blur(12px)",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-[fadeUp_0.4s_ease-out]">
      <button onClick={() => go("home")} className="text-white/50 hover:text-white text-sm flex items-center gap-1 mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to Hub
      </button>

      {/* ── Orb hero ── */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="relative mb-12">
          <div
            className="h-36 w-36 rounded-full flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at 35% 35%, #00e5c0 0%, #7c3aed 55%, #4f46e5 100%)",
              boxShadow: "0 0 60px rgba(0,229,192,0.45), 0 0 120px rgba(124,58,237,0.3)",
              animation: "float 5s ease-in-out infinite",
            }}
          >
            <div className="text-center">
              <Sparkles className="h-8 w-8 text-white/90 mx-auto mb-1" />
              <p className="text-white/80 text-[10px] font-semibold tracking-widest uppercase">Center Your Mind</p>
            </div>
          </div>
          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 0 16px rgba(0,229,192,0.06)", animation: "pulseRing 3s ease-out infinite" }} />
          <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 0 32px rgba(124,58,237,0.04)", animation: "pulseRing 3s ease-out infinite", animationDelay: "1s" }} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          How are you feeling, {displayName}?
        </h1>
        <p className="text-white/50 text-sm max-w-md leading-relaxed">
          Your emotional landscape is a vast galaxy. Take a moment to reflect and map your journey today.
        </p>
      </div>

      {/* ── Row 1: Mood Trends + Daily Reflection ── */}
      <div className="grid md:grid-cols-[1fr_300px] gap-5 mb-5">
        {/* Mood Trends */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-white font-semibold text-base">Mood Trends</h3>
              <p className="text-white/40 text-xs">Weekly emotional volatility index</p>
            </div>
            <div className="flex gap-1">
              {(["7", "30"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTrendRange(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${trendRange === r ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "text-white/40 hover:text-white"}`}
                >
                  {r} Days
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart key={`dash-area-${trendRange}-${moods.length}`} data={trendData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00e5c0" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00e5c0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 10]} />
              <Tooltip
                contentStyle={{ background: "rgba(10,10,20,0.9)", border: "1px solid rgba(0,229,192,0.3)", borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: "#00e5c0" }}
              />
              <Area type="monotoneX" dataKey="Mood" stroke="#00e5c0" strokeWidth={2.5} fill="url(#moodGrad)" dot={false} activeDot={{ r: 5, fill: "#00e5c0", strokeWidth: 0 }} isAnimationActive={true} animationBegin={200} animationDuration={1800} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Reflection */}
        <div className="rounded-2xl p-5 flex flex-col" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-violet-400" />
            <h3 className="text-white font-semibold text-base">Daily Reflection</h3>
          </div>
          <div className="flex-1 rounded-xl p-4 mb-4" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="flex gap-2">
              <div className="w-0.5 rounded-full flex-shrink-0 mt-1" style={{ background: "linear-gradient(to bottom, #00e5c0, #7c3aed)", height: 56 }} />
              <p className="text-white/80 text-sm leading-relaxed italic">
                "Today I feel like I'm finally finding my rhythm. The morning was quiet, and I managed to finish that project..."
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-auto">
            {["#productive", "#calm"].map((t) => (
              <span key={t} className="text-xs px-3 py-1 rounded-full text-violet-300" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Streak + Mindfulness + Emotional Spectrum ── */}
      <div className="grid grid-cols-2 md:grid-cols-[160px_160px_1fr] gap-5 mb-5">
        {/* Day Streak */}
        <div className="rounded-2xl p-5 flex flex-col items-center justify-center text-center animate-[fadeUp_0.6s_ease-out_forwards]" style={{ ...cardStyle, opacity: 0, animationDelay: "0.2s" }}>
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(0,229,192,0.12)", border: "1px solid rgba(0,229,192,0.25)" }}>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="text-4xl font-bold text-white mb-1" style={{ fontVariantNumeric: "tabular-nums" }}>{streak}</div>
          <div className="text-white/40 text-xs uppercase tracking-widest">Day Streak</div>
        </div>

        {/* Mindfulness Score */}
        <div className="rounded-2xl p-5 flex flex-col items-center justify-center text-center animate-[fadeUp_0.6s_ease-out_forwards]" style={{ ...cardStyle, opacity: 0, animationDelay: "0.3s" }}>
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <Brain className="h-6 w-6 text-violet-400" />
          </div>
          <div className="text-4xl font-bold text-white mb-1">{mindfulnessScore}</div>
          <div className="text-white/40 text-xs uppercase tracking-widest">Mindfulness Score</div>
        </div>

        {/* Emotional Spectrum */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-base">Emotional Spectrum</h3>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
              <Sparkles className="h-3.5 w-3.5 text-white/50" />
            </div>
          </div>
          <div className="space-y-4">
            {spectrum.map((s, i) => (
              <div
                key={s.label}
                className="animate-[fadeUp_0.6s_ease-out_forwards]"
                style={{ opacity: 0, animationDelay: `${i * 0.15 + 0.2}s` }}
              >
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-white/50 tracking-widest font-medium">{s.label}</span>
                  <span className="text-white/70 font-semibold">{s.pct}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: spectrumReady ? `${s.pct}%` : "0%",
                      background: `linear-gradient(90deg, ${s.color}, ${s.color}99)`,
                      boxShadow: spectrumReady ? `0 0 10px ${s.glow}` : "none",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Recent Shifts ── */}
      <div className="rounded-2xl p-5" style={cardStyle}>
        <h3 className="text-white font-semibold text-base mb-4">Recent Shifts</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {recentShifts.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-all animate-[fadeUp_0.6s_ease-out_forwards]"
              style={{ background: s.color, border: `1px solid ${s.border}`, opacity: 0, animationDelay: `${i * 0.15 + 0.4}s` }}
            >
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">{s.label}</p>
                <p className="text-white/45 text-xs mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${color} text-white shadow-lg`}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

// ── Face Recognition ─────────────────────────────────
function FacePage({ go }: { go: (v: View) => void }) {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ emotion: string; conf: number; color: string } | null>(null);
  const [camError, setCamError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return stopCamera; // cleanup on unmount
  }, []);

  const start = async () => {
    setResult(null);
    setCamError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setScanning(true);

      setTimeout(async () => {
        if (!videoRef.current) return;

        // Capture a frame from the live video stream
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (!blob) return;

          try {
            // Send to our new Python Backend!
            const formData = new FormData();
            formData.append("file", blob, "face.jpg");

            const AI_BASE_URL = import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://moodmirror-ai.onrender.com";
            const response = await fetch(`${AI_BASE_URL}/analyze/face`, {
              method: "POST",
              body: formData
            });

            if (!response.ok) throw new Error("Failed to analyze face");
            const data = await response.json();

            // Map the returned emotion to our UI colors
            let color = "#00BCD4"; // Calm (Default)
            if (data.emotion === "Happy") color = "#10B981";
            else if (data.emotion === "Anxious") color = "#F59E0B";
            else if (data.emotion === "Stressed") color = "#EF4444";
            else if (data.emotion === "Sad") color = "#3B82F6";

            const res = { emotion: data.emotion, conf: data.confidence, color };

            if (user) {
              await saveMoodLog(user.id, {
                overall_score: res.conf,
                primary_emotion: res.emotion,
                source: "face",
                raw_data: { confidence: res.conf, deepface_scores: data.raw_scores }
              });
            }

            setResult(res);
            setScanning(false);
            stopCamera();
          } catch (backendErr) {
            console.error("Backend AI Error:", backendErr);
            setCamError("AI Server error. Ensure the Python backend is running!");
            setScanning(false);
            stopCamera();
          }
        }, "image/jpeg", 0.9);
      }, 4000);

    } catch (err) {
      console.error("Camera access error:", err);
      setCamError("Camera permission denied or device not found.");
      setScanning(false);
    }
  };

  return (
    <Page title="Face Recognition" subtitle="Scan to detect your current emotion" go={go}>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="relative aspect-video max-w-2xl mx-auto rounded-2xl border-2 border-cyan-500/50 overflow-hidden bg-[#050508]" style={{ boxShadow: "0 0 40px rgba(0,188,212,0.3)" }}>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${streamRef.current && scanning ? "opacity-100" : "opacity-0"}`}
          />

          {(!streamRef.current || !scanning) && !result && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#050508]">
              <Camera className="h-20 w-20 text-white/20" />
            </div>
          )}

          {scanning && (
            <>
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" style={{ animation: "sweep 1.5s linear infinite", boxShadow: "0 0 20px #00BCD4", zIndex: 10 }} />
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                <svg className="absolute inset-0 w-full h-full">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <circle
                      key={i}
                      cx={`${20 + Math.random() * 60}%`}
                      cy={`${20 + Math.random() * 60}%`}
                      r="2"
                      fill="#00BCD4"
                      opacity="0.7"
                      style={{ animation: `particleFloat ${2 + Math.random() * 2}s ease-in-out infinite alternate`, animationDelay: `${Math.random() * 2}s` }}
                    />
                  ))}
                </svg>
              </div>
            </>
          )}

          {result && (
            <div className="absolute inset-0 pointer-events-none bg-[#050508]">
              <svg className="absolute inset-0 w-full h-full">
                {Array.from({ length: 40 }).map((_, i) => (
                  <circle
                    key={i}
                    cx={`${30 + Math.random() * 40}%`}
                    cy={`${20 + Math.random() * 60}%`}
                    r="1.5"
                    fill={result.color}
                    opacity="0.8"
                    style={{ animation: `particleFloat ${2 + Math.random() * 2}s ease-in-out infinite alternate`, animationDelay: `${Math.random() * 2}s` }}
                  />
                ))}
              </svg>
            </div>
          )}

          {[".tl", ".tr", ".bl", ".br"].map((c, i) => (
            <div key={i} className={`absolute z-20 w-8 h-8 border-cyan-400 ${i === 0 ? "top-3 left-3 border-t-2 border-l-2" : i === 1 ? "top-3 right-3 border-t-2 border-r-2" : i === 2 ? "bottom-3 left-3 border-b-2 border-l-2" : "bottom-3 right-3 border-b-2 border-r-2"}`} />
          ))}
        </div>

        <div className="text-center mt-6">
          {camError && <p className="text-red-400 mb-4">{camError}</p>}

          {!scanning && !result && (
            <button onClick={start} className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-700 text-white font-semibold hover:scale-105 transition">
              Start Face Scan
            </button>
          )}
          {scanning && <p className="text-cyan-400 font-medium">Requesting camera / Scanning...</p>}
          {result && (
            <div className="space-y-4">
              <div className="inline-block bg-white/5 border border-white/10 rounded-2xl px-8 py-5">
                <div className="text-white/60 text-sm">Detected Emotion</div>
                <div className="text-3xl font-bold mt-1" style={{ color: result.color }}>{result.emotion}</div>
                <div className="text-white/60 text-sm mt-2">Confidence: {result.conf}%</div>
                <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${result.conf}%`, background: result.color }} />
                </div>
              </div>
              <div className="flex gap-3 items-center justify-center">
                <button onClick={start} className="px-6 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition hover:scale-105">Re-scan</button>
                <button onClick={() => go("voice")} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-700 text-white font-semibold hover:scale-105 transition">Record Voice</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}

const READING_PROMPTS = [
  "Today has been a journey of its own. I'm taking a moment to reflect on my feelings, acknowledging both the bright spots and the shadows.",
  "Sometimes the hardest part of the day is just getting started. I want to remind myself that it's okay to move slowly. Progress isn't always a straight line.",
  "When the world feels too loud, I try to find a quiet space within myself. I focus on the rhythm of my heartbeat and the steadiness of my breath.",
  "I am allowed to feel whatever it is I'm feeling right now. Emotions are like the weather; they come and go. By letting them pass without judgment, I give myself the grace to heal.",
  "There is strength in vulnerability, even when it feels uncomfortable. Sharing my thoughts out loud helps me untangle the knots in my mind.",
  "Every experience I have shapes the person I am becoming. I embrace the challenges because they teach me resilience. I know that I am capable of overcoming obstacles.",
  "It is okay to ask for help when the weight feels too heavy. Connection is a fundamental part of being human. I am opening myself up to support.",
  "Self-compassion is a practice, not a destination. Today, I am choosing to speak to myself with the same kindness I would offer a close friend.",
  "I am letting go of the things I cannot control. Instead, I focus my energy on how I respond to the world around me. In this moment, I am choosing peace.",
  "The quiet moments often hold the most profound lessons. I am taking this time to pause, breathe, and reconnect with my core. Everything I need is within me.",
  "A single moment of mindfulness can shift the entire tone of my day. I am paying attention to the sounds around me, the feeling of the air, and being fully present.",
  "I honor the boundaries I set for myself because they protect my peace. It is okay to say no, and it is okay to prioritize my own well-being.",
  "Healing is a continuous journey with no set timeline. I am patient with myself on the days when it feels difficult, and I celebrate the days when it feels light.",
  "My voice matters, and my experiences are valid. I am taking the space I need to express myself fully. Every word I speak brings me closer to understanding.",
  "I am capable of finding joy in the small, ordinary moments. A warm cup of tea, a gentle breeze, or a quiet room can be profound sources of comfort.",
  "Courage doesn't always roar. Sometimes it's the quiet voice at the end of the day saying I will try again tomorrow. I am acknowledging that quiet courage.",
  "I release the need to have everything figured out right now. Uncertainty is a natural part of life, and I am learning to find comfort in the unknown.",
  "My energy is a precious resource, and I am mindful of how I spend it. I am directing my focus toward things that nourish my spirit.",
  "I am rewriting the narrative I tell myself. Instead of focusing on what I lack, I am celebrating what I have overcome. I am a resilient individual.",
  "It is okay if all I did today was breathe and survive. Rest is not something I have to earn; it is a fundamental human need. I am giving myself permission to rest.",
  "I am learning to sit with discomfort rather than running from it. By facing my fears with a gentle heart, they lose their power over me.",
  "The world is vast, but my inner world is equally expansive. I am exploring my thoughts without judgment, observing them like clouds passing in the sky.",
  "I am grateful for the body that carries me through life and the mind that processes my experiences. Even when things feel fractured, I am whole.",
  "I choose to focus on the step immediately in front of me rather than the entire staircase. Breaking things down makes the journey manageable.",
  "I am surrounded by an invisible network of support and understanding. Even in moments of isolation, I am connected to the shared human experience.",
  "Creativity and expression are powerful tools for healing. Whether through speaking, writing, or art, I am finding safe outlets for my emotions.",
  "I am observing the tension in my body and actively choosing to release it. I drop my shoulders, unclench my jaw, and take a deep, restorative breath.",
  "There is no 'right' way to process my emotions. My feelings are a personal landscape, and I am allowed to navigate them however makes sense to me.",
  "I am building a foundation of self-trust. By keeping the small promises I make to myself, I reinforce my inner strength and become a reliable presence.",
  "Today, I am giving myself permission to simply be a work in progress. I do not need to be perfect to be worthy of respect and kindness.",
  "I am focusing on the present moment, releasing the heavy burdens of the past and the anxieties of the future. Right here, right now, I am safe.",
  "I am celebrating the silent victories that nobody else sees. The moments I chose patience, the times I offered myself grace, and the days I got up when it was hard."
];

// ── Voice Analysis ───────────────────────────────────
function VoicePage({ go }: { go: (v: View) => void }) {
  const { user } = useAuth();
  const [rec, setRec] = useState(false);
  const [result, setResult] = useState<{ name: string; value: number }[] | null>(null);
  const [audioData, setAudioData] = useState<number[]>(Array(32).fill(10));
  const [micError, setMicError] = useState("");
  const [promptText, setPromptText] = useState("");
  const [processing, setProcessing] = useState(false);

  const shufflePrompt = () => setPromptText(READING_PROMPTS[Math.floor(Math.random() * READING_PROMPTS.length)]);

  useEffect(() => {
    shufflePrompt();
  }, []);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const reqRef = useRef<number>(0);

  const stopMic = () => {
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => { });
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    return stopMic;
  }, []);

  const start = async () => {
    setResult(null);
    setMicError("");
    setAudioData(Array(32).fill(10));
    shufflePrompt(); // Shuffle when starting a new recording

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128; // 64 frequency bins
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        analyser.getByteFrequencyData(dataArray);
        // Take the first 32 bins to represent the lower/mid spectrum of human voice
        const sliced = Array.from(dataArray).slice(0, 32);
        // Normalize volume to a percentage for CSS height, ensuring a minimum of 10%
        const normalized = sliced.map(val => Math.max(10, (val / 255) * 100));
        setAudioData(normalized);
        reqRef.current = requestAnimationFrame(draw);
      };

      draw();
      setRec(true);

      // Setup MediaRecorder for Python API
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.addEventListener("dataavailable", event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      });

      mediaRecorder.addEventListener("stop", async () => {
        setProcessing(true);
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "voice.webm");

          const AI_BASE_URL = import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://moodmirror-ai.onrender.com";
          const response = await fetch(`${AI_BASE_URL}/analyze/voice`, {
            method: "POST",
            body: formData
          });

          if (!response.ok) throw new Error("Failed to analyze voice");

          const data = await response.json();

          if (user) {
            await saveMoodLog(user.id, {
              overall_score: data.overall_score,
              primary_emotion: "Balanced",
              source: "voice",
              raw_data: { breakdown: data.breakdown, duration: "12s" }
            });
          }
          setResult(data.breakdown);
          setProcessing(false);
        } catch (backendErr: any) {
          console.error("Backend Voice AI Error:", backendErr);
          setMicError(`AI Error: ${backendErr?.message || 'Failed to connect'}`);
          setProcessing(false);
        }
      });

      mediaRecorder.start();

      // Stop recording after 12 seconds to trigger 'stop' event and API call
      setTimeout(() => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
        stopMic();
        setRec(false);
      }, 12000);

    } catch (err) {
      console.error("Mic access error:", err);
      setMicError("Microphone permission denied or device not found.");
      setRec(false);
    }
  };

  return (
    <Page title="Voice Analysis" subtitle="Speak naturally — we'll listen for tone" go={go}>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-12">
        <div className="flex flex-col items-center shrink-0 w-full md:w-auto">
          <button
            onClick={start}
            disabled={rec}
            className={`h-32 w-32 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 text-white flex items-center justify-center shadow-[0_0_50px_rgba(123,47,190,0.6)] transition ${rec ? "scale-105 shadow-[0_0_80px_rgba(123,47,190,0.8)]" : "hover:scale-105"}`}
          >
            <Mic className="h-12 w-12" />
          </button>

          {micError && <p className="text-red-400 mt-4 text-sm bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">{micError}</p>}
          <div className="mt-5 text-white/70 font-medium">
            {rec ? (
              <span className="flex items-center gap-2 text-cyan-400 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Listening... (12s)
              </span>
            ) : processing ? (
              <span className="flex items-center gap-2 text-violet-400 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing your tone...
              </span>
            ) : result ? (
              <span className="text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Analysis Complete!
              </span>
            ) : (
              "Tap mic to start"
            )}
          </div>
        </div>

        <div className="flex-1 bg-[#06060e] p-6 rounded-2xl border border-white/10 shadow-inner">
          <h3 className="text-white/80 font-semibold mb-3 flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-purple-400" /> Please read this aloud:
          </h3>
          <p className="text-white/70 text-lg leading-relaxed italic font-serif">
            "{promptText}"
          </p>
        </div>
      </div>

      {rec && (
        <div className="flex items-end justify-center gap-1.5 h-32 mt-8 px-4 bg-white/5 border border-white/10 rounded-2xl p-6">
          {audioData.map((val, i) => (
            <div
              key={i}
              className="w-2.5 bg-gradient-to-t from-cyan-400 to-purple-500 rounded-full transition-all duration-75"
              style={{ height: `${val}%` }}
            />
          ))}
        </div>
      )}

      {result && (
        <div className="mt-8 max-w-lg mx-auto">
          <h3 className="text-white font-semibold mb-3 text-left">Tone Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={result} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" stroke="#ffffff60" />
              <YAxis dataKey="name" type="category" stroke="#ffffff60" width={85} />
              <Tooltip contentStyle={{ background: "#0A0A0F", border: "1px solid #ffffff20" }} />
              <Bar dataKey="value" fill="#00BCD4" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-3 items-center justify-center mt-4">
            <button onClick={start} className="px-6 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition">Record Again</button>
            <button onClick={() => go("score")} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold hover:scale-105 transition">View Score</button>
          </div>
        </div>
      )}
    </Page>
  );
}

// ── Score Report Page ────────────────────────────────
function ScorePage({ go }: { go: (v: View) => void }) {
  const { user } = useAuth();
  const [moods, setMoods] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    getMoodLogs(user.id, 20).then(data => {
      setMoods(data);
    });
  }, [user]);

  const latest = moods[0];
  const overall = latest?.overall_score || "--";
  const emotion = latest?.primary_emotion || "--";
  const source = latest?.source || "unknown";
  const isAudio = source === "voice";

  // Format breakdown dynamically based on face or voice
  let breakdown = [
    { name: "Calm", value: 45 },
    { name: "Stress", value: 30 },
    { name: "Confidence", value: 25 },
  ];

  if (latest?.raw_data?.breakdown) {
    breakdown = latest.raw_data.breakdown;
  } else if (latest?.raw_data?.deepface_scores) {
    const scores = latest.raw_data.deepface_scores;
    breakdown = Object.keys(scores).map(k => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: Math.round(scores[k]) })).sort((a, b) => b.value - a.value).slice(0, 4);
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    backdropFilter: "blur(12px)",
  };

  return (
    <Page title="Mood Score Report" subtitle="Your emotional analysis and historical data" go={go}>
      {/* ── Score Summary ── */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="text-white/60 text-sm mb-2">Overall Score</div>
          <div className="text-4xl font-bold text-cyan-400">{overall}{overall !== "--" ? "%" : ""}</div>
          <div className="text-white/40 text-xs mt-2">Source: {source}</div>
        </div>
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="text-white/60 text-sm mb-2">Primary Emotion</div>
          <div className="text-4xl font-bold text-purple-400">{emotion}</div>
          <div className="text-white/40 text-xs mt-2">Detected: Now</div>
        </div>
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="text-white/60 text-sm mb-2">Session Duration</div>
          <div className="text-4xl font-bold text-teal-400">{isAudio ? "12s" : "4s"}</div>
          <div className="text-white/40 text-xs mt-2">Recording Time</div>
        </div>
      </div>

      {/* ── Tone Analysis ── */}
      <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
        <h3 className="text-white font-semibold mb-4">Breakdown</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={breakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="name" stroke="#ffffff60" />
            <YAxis stroke="#ffffff60" />
            <Tooltip contentStyle={{ background: "#0A0A0F", border: "1px solid #ffffff20" }} />
            <Bar dataKey="value" fill="#00BCD4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Audio Analysis ── */}
      <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
        <h3 className="text-white font-semibold mb-4">Analysis Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Duration", value: isAudio ? "12s" : "4s", icon: "⏱️" },
            { label: "Modality", value: source.toUpperCase(), icon: "📊" },
            { label: "Quality", value: "High", icon: "🎵" },
            { label: "Clarity", value: "Clear", icon: "📢" },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-white/60 text-xs">{item.label}</div>
              <div className="text-white font-semibold mt-1">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Current Emotion Radar ── */}
      <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
        <h3 className="text-white font-semibold mb-4">Emotion Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={breakdown}>
            <PolarGrid stroke="#ffffff20" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "#ffffff80", fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Emotion" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.5} />
            <Tooltip contentStyle={{ background: "#0A0A0F", border: "1px solid #ffffff20", borderRadius: "8px" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Recent History ── */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <h3 className="text-white font-semibold mb-4">Recent Mood History</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) transparent" }}>
          {moods.length === 0 ? (
            <div className="text-white/40 text-sm">No previous moods recorded yet.</div>
          ) : (
            moods.map((mood, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 shrink-0">
                <div>
                  <div className="text-white text-sm font-medium">{mood.primary_emotion} via {mood.source}</div>
                  <div className="text-white/40 text-xs">{new Date(mood.timestamp).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-semibold">{mood.overall_score}%</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => go("face")}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-700 text-white font-semibold hover:scale-105 transition"
        >
          Start Again
        </button>
        <button
          onClick={() => go("home")}
          className="flex-1 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
        >
          Back to Home
        </button>
      </div>
    </Page>
  );
}

// ── Journal ──────────────────────────────────────────
function JournalPage({ go }: { go: (v: View) => void }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.journal-dropdown')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    getJournals(user.id).then((data) => {
      // Map to UI shape
      setEntries(data.map(j => ({
        id: j.id,
        text: j.entry_text,
        tags: j.tags || [],
        ts: new Date(j.created_at).getTime()
      })));
    });
  }, [user?.id]);

  const save = async () => {
    if (!text.trim() || !user) return;
    const tags = tagJournal(text);

    if (editingId) {
      // Update existing
      await updateJournal(editingId, text, tags);
      setEntries(entries.map(e => e.id === editingId ? { ...e, text, tags, ts: Date.now() } : e));
      setEditingId(null);
    } else {
      // Create new
      const saved = await saveJournal(user.id, { entry_text: text, tags, nlp_sentiment_score: null });
      if (saved) {
        setEntries([{ id: saved.id, text, tags, ts: new Date(saved.created_at).getTime() }, ...entries]);
      }
    }
    setText("");
  };

  const handleEdit = (e: any) => {
    setEditingId(e.id);
    setText(e.text);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteJournal(id);
    setEntries(entries.filter(e => e.id !== id));
    setOpenMenuId(null);
  };

  return (
    <Page title="Journal & NLP" subtitle="Write freely — we'll surface patterns" go={go}>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write freely..."
          rows={6}
          className="w-full bg-transparent text-white placeholder-white/40 focus:outline-none resize-none"
        />
        <div className="flex justify-between mt-3 items-center">
          {editingId ? (
            <button onClick={() => { setEditingId(null); setText(""); }} className="text-white/50 text-sm hover:text-white transition">Cancel</button>
          ) : <div />}
          <button onClick={save} className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold hover:scale-105 transition">
            {editingId ? "Update Entry" : "Save Entry"}
          </button>
        </div>
      </div>

      <h3 className="text-white font-semibold mb-3">Past Entries</h3>
      <div className="space-y-3">
        {entries.length === 0 && <div className="text-white/40 text-sm">No entries yet. Start writing above.</div>}
        {entries.map((e) => (
          <div key={e.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 relative">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs text-white/50">{new Date(e.ts).toLocaleString()}</div>

              <div className="relative journal-dropdown">
                <button
                  onClick={() => setOpenMenuId(openMenuId === e.id ? null : e.id)}
                  className="p-1 hover:bg-white/10 rounded-md transition text-white/60"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {openMenuId === e.id && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-[#1A1A24] border border-white/10 rounded-xl shadow-lg overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                    <button onClick={(ev) => { ev.stopPropagation(); handleEdit(e); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:bg-white/5 transition">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-white/90 text-sm mb-3 whitespace-pre-wrap">{e.text}</p>
            <div className="flex flex-wrap gap-2">
              {e.tags.map((t: any, j: number) => {
                const isObj = typeof t === "object";
                const label = isObj ? t.label : t;
                const color = isObj ? t.color : "border-cyan-400/30 text-cyan-400 bg-cyan-400/10";
                return (
                  <span key={j} className={`text-xs px-2 py-1 rounded-full border ${color}`}>{label}</span>
                )
              })}
              {e.tags.length === 0 && <span className="text-xs text-white/30">No tags detected</span>}
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}

// ── History ──────────────────────────────────────────
const HISTORY_QUOTES = [
  { text: "You don't have to be positive all the time. It's okay to feel what you feel.", author: "Lori Deschene" },
  { text: "What mental health needs is more sunlight, more candor, and more unashamed conversation.", author: "Glenn Close" },
  { text: "Your present circumstances don't determine where you can go; they merely determine where you start.", author: "Nido Qubein" },
  { text: "There is hope, even when your brain tells you there isn't.", author: "John Green" },
  { text: "Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.", author: "Kahlil Gibran" },
  { text: "Recovery is not one and done. It is a lifelong journey that takes place one step at a time.", author: "Unknown" },
  { text: "You are not your illness. You have an individual story to tell.", author: "Julian Seifter" },
  { text: "Healing takes time, and asking for help is a courageous step.", author: "Mariska Hargitay" },
  { text: "Mental health is not a destination, but a process. It's about how you drive.", author: "Noam Shpancer" },
  { text: "Sometimes the people around you won't understand your journey. That's okay.", author: "Joubert Botha" },
];

function HistoryPage({ go }: { go: (v: View) => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [rawLogs, setRawLogs] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quoteText, setQuoteText] = useState("");
  const [isDeletingQuote, setIsDeletingQuote] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const currentQuote = HISTORY_QUOTES[quoteIdx].text;

    if (isDeletingQuote) {
      if (quoteText.length > 0) {
        timer = setTimeout(() => {
          setQuoteText(currentQuote.substring(0, quoteText.length - 1));
        }, 20);
      } else {
        setIsDeletingQuote(false);
        setQuoteIdx((i) => (i + 1) % HISTORY_QUOTES.length);
      }
    } else {
      if (quoteText.length < currentQuote.length) {
        timer = setTimeout(() => {
          setQuoteText(currentQuote.substring(0, quoteText.length + 1));
        }, 40);
      } else {
        timer = setTimeout(() => {
          setIsDeletingQuote(true);
        }, 5000);
      }
    }
    return () => clearTimeout(timer);
  }, [quoteText, isDeletingQuote, quoteIdx]);

  useEffect(() => {
    if (!user) return;
    getMoodLogs(user.id, 20).then(logs => {
      setRawLogs(logs);
      getJournals(user.id, 5).then((dbJournals) => setJournals(dbJournals || []));
      // Map logs to past 7 days
      const mapped = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000);
        const dayLabel = d.toLocaleDateString(undefined, { weekday: "short" });
        // find logs for this day
        const dayLogs = logs.filter(l => new Date(l.timestamp).toLocaleDateString() === d.toLocaleDateString());
        const avgMood = dayLogs.length > 0
          ? Math.round(dayLogs.reduce((acc, l) => acc + (l.overall_score / 10), 0) / dayLogs.length)
          : 5; // fallback neutral

        return {
          day: dayLabel,
          mood: avgMood,
          sleep: 4 + Math.round(Math.random() * 4), // mock sleep

        };
      });
      setData(mapped);
    });
  }, [user]);

  return (
    <Page title="Mood History" subtitle="Patterns from your past week" go={go}>

      {/* Quote Card */}
      <div className="bg-[#0f252a] border border-teal-500/20 rounded-2xl p-5 mb-4 flex items-center gap-4 animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "0.1s" }}>
        <Heart className="h-6 w-6 text-pink-400 shrink-0" fill="currentColor" />
        <div className="flex-1 min-h-[4rem] flex flex-col justify-center">
          <p className="text-white italic flex items-center">
            <span>"{quoteText}"</span>
            <span className="w-[2px] h-[1.1em] ml-1 bg-pink-400 animate-pulse inline-block -skew-x-12 translate-y-[2px]" />
          </p>
          <div className="h-4 mt-1 overflow-hidden">
            <p 
              className="text-white/50 text-xs transition-all duration-500"
              style={{
                opacity: (!isDeletingQuote && quoteText === HISTORY_QUOTES[quoteIdx].text) ? 1 : 0,
                transform: (!isDeletingQuote && quoteText === HISTORY_QUOTES[quoteIdx].text) ? "translateY(0)" : "translateY(-10px)"
              }}
            >
              — {HISTORY_QUOTES[quoteIdx].author}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stat Pills */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "0.2s" }}>
          <div className="text-2xl font-bold text-teal-400">
            {data.length > 0 ? (data.reduce((a, b) => a + b.mood, 0) / data.length).toFixed(1) : "5.0"}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/50 mt-1">MOOD</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "0.3s" }}>
          <div className="text-2xl font-bold text-purple-400">6.8h</div>
          <div className="text-[10px] uppercase tracking-wider text-white/50 mt-1">SLEEP</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "0.4s" }}>
          <div className="text-2xl font-bold text-amber-500">
            {new Set(rawLogs.map(m => new Date(m.timestamp).toLocaleDateString())).size}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/50 mt-1">STREAK</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "0.5s" }}>
          <div className="text-2xl font-bold text-pink-400">86%</div>
          <div className="text-[10px] uppercase tracking-wider text-white/50 mt-1">HABITS</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "0.6s" }}>
          <h3 className="text-white font-semibold mb-3">7-Day Mood Score</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart key={`hist-area-${rawLogs.length}`} data={data}>
              <defs>
                <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#00BCD4" stopOpacity={0.7} />
                  <stop offset="1" stopColor="#00BCD4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="day" stroke="#ffffff60" />
              <YAxis stroke="#ffffff60" />
              <Tooltip contentStyle={{ background: "#0A0A0F", border: "1px solid #ffffff20" }} />
              <Area dataKey="mood" stroke="#00BCD4" fill="url(#ag)" isAnimationActive={true} animationBegin={300} animationDuration={2000} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "0.7s" }}>
          <h3 className="text-white font-semibold mb-3">Sleep Correlation</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart key={`hist-bar-${rawLogs.length}`} data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="day" stroke="#ffffff60" />
              <YAxis stroke="#ffffff60" />
              <Tooltip contentStyle={{ background: "#0A0A0F", border: "1px solid #ffffff20" }} />
              <Bar dataKey="sleep" fill="#7B2FBE" radius={[8, 8, 0, 0]} isAnimationActive={true} animationBegin={400} animationDuration={2000} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        className="bg-[#0a0a14] border border-white/10 rounded-2xl p-5 mb-6 transition-all duration-300 animate-[fadeUp_0.6s_ease-out_forwards]"
        style={{ boxShadow: "0 -4px 20px rgba(0,200,200,0.15)", opacity: 0, animationDelay: "0.8s" }}
      >
        <h3 className="text-white font-semibold mb-5">Habit Tracker</h3>
        <div className="flex flex-col gap-5">

          {/* Days Header */}
          <div className="flex items-center gap-4 -mb-2">
            <div className="w-32 shrink-0"></div>
            <div className="flex-1 flex justify-between gap-1.5">
              {data.map((d, i) => (
                <div key={i} className="flex-1 text-center text-white/40 text-[10px] font-semibold uppercase tracking-wider">
                  {d.day}
                </div>
              ))}
            </div>
          </div>

          {/* Steps Habit */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 w-32 shrink-0">
              <div className="h-8 w-8 rounded-full bg-[#06b6d4]/20 flex items-center justify-center text-[#06b6d4]">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-white/80 text-sm font-medium">Steps</span>
            </div>
            <div className="flex-1 flex justify-between gap-1.5">
              {[1, 1, 0.4, 1, 0, 1, 0.8].map((val, i) => (
                <div key={i} className="h-6 flex-1 rounded-full bg-white/5 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 bg-[#06b6d4] transition-all" style={{ width: `${val * 100}%` }} />
                </div>
              ))}
            </div>
          </div>

          {/* Physiotherapy Habit */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 w-32 shrink-0">
              <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="text-white/80 text-sm font-medium">Physiotherapy</span>
            </div>
            <div className="flex-1 flex justify-between gap-1.5">
              {[1, 0, 1, 1, 0.5, 1, 1].map((val, i) => (
                <div key={i} className="h-6 flex-1 rounded-full bg-white/5 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 bg-violet-500 transition-all" style={{ width: `${val * 100}%` }} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Mood Journal */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-2xl p-5 mb-6 animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "0.9s" }}>
        <h3 className="text-white/50 text-xs font-bold tracking-wider uppercase mb-4">MOOD JOURNAL</h3>
        <div className="space-y-3">
          {journals.length === 0 ? (
            <p className="text-white/40 text-sm">No journal entries found. Go to the Journal page to write one!</p>
          ) : (
            journals.map((j, i) => {
              const date = new Date(j.created_at);
              const dayName = date.toLocaleDateString("en-US", { weekday: 'long' });
              
              let ribbonColor = "border-l-cyan-400";
              if (j.tags && j.tags.length > 0) {
                 const firstTag = typeof j.tags[0] === "object" ? j.tags[0].label : j.tags[0];
                 if (firstTag === "Low Mood") ribbonColor = "border-l-red-500";
                 else if (firstTag === "Anxiety") ribbonColor = "border-l-orange-500";
                 else if (firstTag === "Positive") ribbonColor = "border-l-green-500";
                 else if (firstTag === "Fatigue") ribbonColor = "border-l-yellow-500";
                 else if (firstTag === "Irritability") ribbonColor = "border-l-purple-500";
              }

              return (
                <div key={j.id} className={`bg-[#12121c] rounded-xl p-4 border-l-4 ${ribbonColor} animate-[fadeUp_0.6s_ease-out_forwards]`} style={{ opacity: 0, animationDelay: `${1.0 + i * 0.1}s` }}>
                  <p className="text-white/60 text-xs mb-1">{dayName} - {date.toLocaleDateString()}</p>
                  <p className="text-white text-sm whitespace-pre-wrap">{j.entry_text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          { t: "Mood peaks on weekends", d: "Your scores are 22% higher on Sat/Sun." },
          { t: "Sleep drives focus", d: "Days with 7+ hours show better focus." },
          { t: "Journaling helps", d: "Mood improves on days you journal." },
        ].map((c, i) => (
          <div key={i} className="bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-white/10 rounded-2xl p-4 animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: `${i * 0.15 + 1.3}s` }}>
            <Sparkles className="h-5 w-5 text-cyan-400 mb-2" />
            <div className="text-white font-semibold">{c.t}</div>
            <div className="text-white/60 text-sm mt-1">{c.d}</div>
          </div>
        ))}
      </div>

      <button onClick={() => window.print()} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-700 text-white font-semibold hover:scale-105 transition">
        Export Report
      </button>
    </Page>
  );
}


// ── Leaflet Helpers ──────────────────────────────────
const OSM_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function makePinIcon(color = "#06b6d4", size = 36) {
  return L.divIcon({
    className: "",
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `<div style="
      width:${size}px; height:${size}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid rgba(255,255,255,0.85);
      box-shadow:0 0 18px ${color}99,0 2px 8px rgba(0,0,0,0.5);
    "></div>`,
  });
}

function MapRecenter({ lat, lng, zoom = 14 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], zoom, { duration: 1.2 }); }, [lat, lng, zoom]);
  return null;
}

// Default India sanctuary — Mumbai, Maharashtra
const INDIA_DEFAULT = {
  lat: 19.0760,
  lng: 72.8777,
  line1: "Marine Lines, Mumbai",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400020",
};

const INDIA_RESOURCES = [
  { id: 1, name: "NIMHANS Mumbai (Mental Health OPD)", lat: 19.0637, lng: 72.8348, distance: 2.1, status: "Open Now", icon: "🧠", type: "Mental Health", color: "#06b6d4" },
  { id: 2, name: "KEM Hospital & GS Medical College", lat: 18.9989, lng: 72.8394, distance: 4.5, status: "24/7 ER", icon: "🏥", type: "Hospital", color: "#f43f5e" },
  { id: 3, name: "iCall Counselling Mumbai", lat: 19.0833, lng: 72.8833, distance: 1.2, status: "Open Now", icon: "💚", type: "Therapy", color: "#10b981" },
  { id: 4, name: "Nair Hospital Emergency", lat: 18.9700, lng: 72.8193, distance: 5.8, status: "24/7", icon: "🚑", type: "Emergency", color: "#f59e0b" },
];

function NearbyResourcesPage({ go, addresses }: { go: (v: View) => void; addresses: AddressEntry[] }) {
  const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
  const CENTER: [number, number] = defaultAddr?.lat && defaultAddr?.lng
    ? [defaultAddr.lat, defaultAddr.lng]
    : [INDIA_DEFAULT.lat, INDIA_DEFAULT.lng];
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    let activeReq = true;
    const fetchResources = async () => {
      setLoading(true);
      try {
        const query = `
          [out:json];
          (
            nwr["amenity"="hospital"](around:15000,${CENTER[0]},${CENTER[1]});
            nwr["amenity"="clinic"](around:15000,${CENTER[0]},${CENTER[1]});
            nwr["healthcare"="psychotherapist"](around:15000,${CENTER[0]},${CENTER[1]});
          );
          out center 40;
        `;
        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: query
        });
        const data = await res.json();
        if (!activeReq) return;

        let mapped = data.elements.map((el: any) => {
          const elLat = el.lat || el.center?.lat;
          const elLon = el.lon || el.center?.lon;
          if (!elLat || !elLon) return null;

          // Haversine distance
          const R = 6371; // km
          const dLat = (elLat - CENTER[0]) * Math.PI / 180;
          const dLon = (elLon - CENTER[1]) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(CENTER[0] * Math.PI / 180) * Math.cos(elLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const d = (R * c).toFixed(1);

          const isMental = el.tags?.healthcare === 'psychotherapist' || el.tags?.speciality === 'psychiatry';
          const name = el.tags?.name || (el.tags?.amenity === 'hospital' ? 'General Hospital' : 'Health Clinic');

          return {
            id: el.id,
            name: name,
            lat: elLat,
            lng: elLon,
            distance: d,
            status: el.tags?.opening_hours || "Contact to verify",
            icon: isMental ? "🧠" : "🏥",
            type: isMental ? "Mental Health" : (el.tags?.amenity === 'hospital' ? "Hospital" : "Clinic"),
            color: "#f43f5e" // All dynamically fetched "normal" ones are red
          };
        }).filter(Boolean);

        // Calculate dynamic distances for the main INDIA_RESOURCES to the current CENTER
        const mainResources = INDIA_RESOURCES.map(r => {
          const R = 6371; // km
          const dLat = (r.lat - CENTER[0]) * Math.PI / 180;
          const dLon = (r.lng - CENTER[1]) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(CENTER[0] * Math.PI / 180) * Math.cos(r.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return { ...r, distance: (R * c).toFixed(1) };
        });

        // Filter out dynamic results that overlap with main resources
        mapped = mapped.filter((dyn: any) =>
          !mainResources.some((main: any) =>
            main.name.toLowerCase() === dyn.name.toLowerCase() ||
            (Math.abs(main.lat - dyn.lat) < 0.005 && Math.abs(main.lng - dyn.lng) < 0.005)
          )
        );

        // Combine and sort by distance
        const combined = [...mainResources, ...mapped];
        combined.sort((a: any, b: any) => parseFloat(a.distance) - parseFloat(b.distance));

        setResources(combined);
      } catch (err) {
        console.error("Failed to fetch resources", err);
        // Fallback to static if network fails
        setResources(INDIA_RESOURCES);
      } finally {
        if (activeReq) setLoading(false);
      }
    };

    fetchResources();
    return () => { activeReq = false; };
  }, [CENTER[0], CENTER[1]]);

  return (
    <div className="min-h-screen text-white" style={{ background: "transparent" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-8 mm-fade-up">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Nearby Resources</h1>
          <p className="text-white/50 text-sm">Health centres and hospitals near your sanctuary</p>
        </div>

        {/* ── Sanctuary address card ── */}
        <div
          className="rounded-3xl p-5 mb-6 flex items-center justify-between mm-fade-up-d1 mm-card-hover"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.06) 100%)",
            border: "1.5px solid rgba(139,92,246,0.18)",
          }}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.3)" }}>
              <MapPin className="h-5 w-5" style={{ color: "#8b5cf6" }} />
            </div>
            <div className="min-w-0">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-0.5">
                {defaultAddr ? "Primary Sanctuary" : "No Address Set"}
              </p>
              <p className="text-white font-semibold text-sm truncate">
                {defaultAddr ? defaultAddr.line1 : INDIA_DEFAULT.line1}
              </p>
              <p className="text-white/50 text-xs">
                {defaultAddr
                  ? `${defaultAddr.city}, ${defaultAddr.state} ${defaultAddr.pincode}`
                  : `${INDIA_DEFAULT.city}, ${INDIA_DEFAULT.state} ${INDIA_DEFAULT.pincode}`}
              </p>
            </div>
          </div>

          {/* Tiny real map thumbnail */}
          <div className="rounded-2xl overflow-hidden ml-5 flex-shrink-0 mm-map-reveal"
            style={{ width: 130, height: 82, border: "1px solid rgba(139,92,246,0.22)", zIndex: 1 }}>
            <MapContainer
              key={`thumb-${CENTER[0]}-${CENTER[1]}`}
              center={CENTER} zoom={13} zoomControl={false} scrollWheelZoom={false}
              dragging={false} doubleClickZoom={false} attributionControl={false}
              className="mm-dark-map"
              style={{ width: "100%", height: "100%" }}
            >
              <TileLayer url={OSM_DARK} />
              <Marker position={CENTER} icon={makePinIcon("#8b5cf6", 20)} />
            </MapContainer>
          </div>

          <button
            onClick={() => go("address")}
            className="ml-4 px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 flex-shrink-0 mm-btn-shine"
            style={{ background: "#8b5cf6", color: "#0a0a0f" }}
          >
            <Pencil className="h-4 w-4" />
            Edit Location
          </button>
        </div>

        {/* ── Full interactive map ── */}
        <div className="rounded-3xl overflow-hidden mb-6 mm-fade-up-d2 mm-map-reveal"
          style={{ height: 340, border: "1.5px solid rgba(139,92,246,0.18)", zIndex: 1 }}>
          <MapContainer
            key={`full-${CENTER[0]}-${CENTER[1]}`}
            center={CENTER} zoom={13} zoomControl={true} scrollWheelZoom={true}
            className="mm-dark-map" style={{ width: "100%", height: "100%" }}
          >
            <TileLayer url={OSM_DARK} />
            {/* Sanctuary marker */}
            <Marker position={CENTER} icon={makePinIcon("#8b5cf6", 36)}>
              <Popup>
                <div style={{ color: "#8b5cf6", fontWeight: 700 }}>Your Sanctuary</div>
                <div style={{ color: "#fff", fontSize: 12 }}>
                  {defaultAddr ? defaultAddr.line1 : INDIA_DEFAULT.line1}
                </div>
              </Popup>
            </Marker>
            {/* Reflection radius */}
            <Circle center={CENTER} radius={15000}
              pathOptions={{ color: "#8b5cf6", fillColor: "#8b5cf6", fillOpacity: 0.06, weight: 1.5, dashArray: "6 4" }} />
            {/* Resource markers */}
            {resources.map(r => (
              <Marker key={r.id} position={[r.lat, r.lng]} icon={makePinIcon(r.color, 28)}>
                <Popup>
                  <div className="flex flex-col gap-2" style={{ minWidth: 150 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: r.color, fontSize: "14px", lineHeight: "1.3" }}>{r.name}</div>
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{r.type} · {r.distance} km · {r.status}</div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all"
                      style={{ background: `${r.color}22`, color: r.color, border: `1px solid ${r.color}55`, textDecoration: "none" }}
                    >
                      <Navigation className="h-3 w-3" />
                      Navigate
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}

          </MapContainer>
        </div>

        {/* ── Resource list ── */}
        <div className="mb-6 mm-fade-up-d3">
          <h2 className="text-xl font-bold text-white mb-4">Nearby Health Resources</h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 border border-white/10 rounded-2xl bg-white/5">
              <div className="h-8 w-8 border-2 border-violet-400/40 border-t-violet-400 rounded-full animate-spin mb-4" />
              <p className="text-white/50 text-sm">Discovering nearby sanctuaries...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-10 border border-white/10 rounded-2xl bg-white/5 text-white/50 text-sm">
              No health centers found in a 15km radius.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {resources.map((r, i) => (
                <div
                  key={r.id}
                  onClick={() => setActive(active === r.id ? null : r.id)}
                  className="mm-resource-card rounded-2xl p-5 flex items-center justify-between cursor-pointer"
                  style={{
                    background: active === r.id ? "rgba(139,92,246,0.10)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${active === r.id ? "rgba(139,92,246,0.35)" : "rgba(139,92,246,0.12)"}`,
                    animationDelay: `${0.3 + i * 0.07}s`,
                  }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110"
                      style={{ background: `${r.color}22`, border: `1.5px solid ${r.color}44`, fontSize: 20 }}>
                      {r.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm mb-1">{r.name}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${r.color}22`, color: r.color }}>{r.distance} km away</span>
                        <span className="text-white/50 text-xs">•</span>
                        <span className="text-white/60 text-xs">{r.status}</span>
                        <span className="text-white/40 text-xs">•</span>
                        <span className="text-white/40 text-xs">{r.type}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="ml-4 px-4 py-2 rounded-full font-semibold text-xs flex items-center gap-2 flex-shrink-0 mm-btn-shine"
                    style={{ background: "rgba(255,255,255,0.05)", border: `1.5px solid ${r.color}55`, color: r.color }}
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Navigate
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Emergency banner ── */}
        <div className="rounded-2xl p-6 text-center mm-fade-up-d4"
          style={{ background: "rgba(139,92,246,0.08)", border: "1.5px dashed rgba(139,92,246,0.28)" }}>
          <div className="flex justify-center mb-3">
            <Shield className="h-7 w-7" style={{ color: "#a78bfa" }} />
          </div>
          <p className="text-white/70 text-sm leading-relaxed mb-2">
            If you are experiencing a crisis, please contact emergency services immediately.
          </p>
          <p className="text-lg font-bold" style={{ color: "#8b5cf6" }}>iCall: 9152987821 · NIMHANS: 080-46110007</p>
          <p className="text-white/50 text-xs mt-1">Available 24/7 · Confidential &amp; Free</p>
        </div>

      </div>
    </div>
  );
}

// ── Exercise ──────────────────────────────────────────
function ExercisePage({ go }: { go: (v: View) => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [animKey, setAnimKey] = useState(0);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [stats, setStats] = useState<any>({
    activeVideoId: null,
    sessionsCompleted: 0,
    minutesWatched: 0,
    streakDays: 0,
    lastActiveDate: null,
    weekDays: [false, false, false, false, false, false, false]
  });

  const YOGA_VIDEOS = [
    {
      id: 1, accent: "#8b5cf6", embed: "https://www.youtube.com/embed/r7xsYgTeM2Q", level: "Beginner",
      name: "Morning Flow", desc: "Gentle wake-up stretches to energize your day — by Yoga With Adriene",
      tags: ["15 min", "80 cal", "8 poses"], btnBg: "#8b5cf6", btnText: "#000000",
      steps: ["Child's Pose (30s)", "Cat-Cow (1m)", "Downward Dog (1m)", "Forward Fold (1m)"],
      summary: "This gentle morning flow is designed to awaken the body slowly. It focuses on deep breathing, spinal articulation, and opening the hips to set a positive tone for the day."
    },
    {
      id: 2, accent: "#a78bdb", embed: "https://www.youtube.com/embed/tD_l3fDTFyg", level: "Intermediate",
      name: "Stress Relief", desc: "Release tension and calm your nervous system — by Yoga With Adriene",
      tags: ["20 min", "110 cal", "12 poses"], btnBg: "#a78bdb", btnText: "#000000",
      steps: ["Easy Pose (1m)", "Neck Rolls (1m)", "Seated Twist (2m)", "Corpse Pose (5m)"],
      summary: "A practice meant to actively target areas where we hold stress, such as the neck, shoulders, and lower back, promoting deep relaxation."
    },
    {
      id: 3, accent: "#a78bdb", embed: "https://www.youtube.com/embed/9Ujxg_7xCFw", level: "Intermediate",
      name: "Power Balance", desc: "Improve core strength and body alignment — by Yoga With Kassandra",
      tags: ["25 min", "140 cal", "15 poses"], btnBg: "#a78bdb", btnText: "#000000",
      steps: ["Plank (1m)", "Side Plank (1m)", "Warrior III (2m)", "Tree Pose (2m)"],
      summary: "Focus on balancing postures to build core strength, stability, and mental focus. Perfect for developing full-body awareness."
    },
    {
      id: 4, accent: "#a78bdb", embed: "https://www.youtube.com/embed/BPobdbmzY9o", level: "Intermediate",
      name: "Core Strength", desc: "Build your center and ignite your fire — by Yoga With Adriene",
      tags: ["20 min", "150 cal", "10 poses"], btnBg: "#a78bdb", btnText: "#000000",
      steps: ["Boat Pose (2m)", "Plank Variations (3m)", "Bridge Pose (2m)", "Supine Twist (2m)"],
      summary: "A dynamic core-focused flow that will generate heat and build abdominal strength, protecting your lower back."
    },
    {
      id: 5, accent: "#f5a623", embed: "https://www.youtube.com/embed/0h7taISrO7c", level: "Advanced",
      name: "Deep Stretch", desc: "Full body flexibility and deep muscle release — Vinyasa Flow",
      tags: ["30 min", "160 cal", "18 poses"], btnBg: "#f5a623", btnText: "#000000",
      steps: ["Pigeon Pose (3m)", "Lizard Lunge (2m)", "Wide-Legged Fold (2m)", "Savasana (5m)"],
      summary: "Long holds in deep stretching postures to improve flexibility, release fascia, and bring calmness to the mind."
    },
    {
      id: 6, accent: "#f5a623", embed: "https://www.youtube.com/embed/IBTdBA_lIZI", level: "Advanced",
      name: "Mindful Flow", desc: "Connect breath with movement for inner peace — Full Body 40 min",
      tags: ["40 min", "190 cal", "22 poses"], btnBg: "#f5a623", btnText: "#000000",
      steps: ["Sun Salutations (5m)", "Warrior Sequence (10m)", "Balancing Half Moon (3m)", "Inversions (5m)"],
      summary: "An advanced continuous flow emphasizing the mind-body connection through complex transitions and deep breath work."
    },
    { id: 7, accent: "#8b5cf6", embed: "https://www.youtube.com/embed/v7AYKMP6rOE", level: "Beginner", name: "Bedtime Yoga", desc: "Unwind before sleep — by Yoga With Adriene", tags: ["20 min", "60 cal", "10 poses"], btnBg: "#8b5cf6", btnText: "#000000", steps: ["Child's Pose", "Supine Twist"], summary: "Perfect sequence to transition into a restful night of sleep." },
    { id: 8, accent: "#a78bdb", embed: "https://www.youtube.com/embed/sTANio_2E0Q", level: "Intermediate", name: "Yoga for Anxiety", desc: "Calm the mind and body — by Yoga With Adriene", tags: ["25 min", "100 cal", "12 poses"], btnBg: "#a78bdb", btnText: "#000000", steps: ["Seated Meditation", "Forward Fold"], summary: "A targeted practice to alleviate anxiety and ground your energy." },
    { id: 9, accent: "#8b5cf6", embed: "https://www.youtube.com/embed/X3-gKPNyrTA", level: "Beginner", name: "Neck & Shoulders", desc: "Relieve tech neck — by Yoga With Adriene", tags: ["15 min", "50 cal", "6 poses"], btnBg: "#8b5cf6", btnText: "#000000", steps: ["Neck Rolls", "Eagle Arms"], summary: "Quick relief for tension carried in the upper body." },
    { id: 10, accent: "#f5a623", embed: "https://www.youtube.com/embed/hJbRpHZr_d0", level: "Advanced", name: "Power Vinyasa", desc: "High intensity flow — by Travis Eliot", tags: ["45 min", "250 cal", "25 poses"], btnBg: "#f5a623", btnText: "#000000", steps: ["Chaturanga", "Crow Pose"], summary: "A challenging, sweaty power yoga flow." },
    { id: 11, accent: "#a78bdb", embed: "https://www.youtube.com/embed/LqXZ628YNj4", level: "Intermediate", name: "Yoga for Back Pain", desc: "Strengthen and heal — by Yoga With Adriene", tags: ["30 min", "120 cal", "15 poses"], btnBg: "#a78bdb", btnText: "#000000", steps: ["Cat-Cow", "Sphinx Pose"], summary: "Gentle strengthening and stretching for the spine." },
    { id: 12, accent: "#8b5cf6", embed: "https://www.youtube.com/embed/4pKly2JojMw", level: "Beginner", name: "Total Body Yoga", desc: "Deep stretch for beginners — by Yoga With Adriene", tags: ["45 min", "150 cal", "20 poses"], btnBg: "#8b5cf6", btnText: "#000000", steps: ["Mountain Pose", "Downward Dog"], summary: "A comprehensive total body flow accessible for all levels." }
  ];

  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [activeTab, showMore]);

  useEffect(() => {
    if (user) {
      getExerciseState(user.id).then((st: any) => {
        if (st) {
          setStats(st);
          if (st.activeVideoId) {
            const v = YOGA_VIDEOS.find(x => x.id.toString() === st.activeVideoId);
            if (v) setActiveVideo(v);
          }
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleStartSession = (vid: any) => {
    setActiveVideo(vid);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (user) {
      const newStats = { ...stats, activeVideoId: vid.id.toString() };
      setStats(newStats);
      saveExerciseState(user.id, newStats);
    }
  };

  const handleEndSession = () => {
    setActiveVideo(null);
    if (user && activeVideo) {
      const minMatch = activeVideo.tags.find((t: string) => t.includes("min"));
      const minutes = minMatch ? parseInt(minMatch) : 0;

      const dayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
      const newWeekDays = [...(stats.weekDays || [false, false, false, false, false, false, false])];
      newWeekDays[dayIdx] = true;

      const newStats = {
        ...stats,
        activeVideoId: null,
        sessionsCompleted: (stats.sessionsCompleted || 0) + 1,
        minutesWatched: (stats.minutesWatched || 0) + minutes,
        weekDays: newWeekDays,
        streakDays: (stats.streakDays || 0) + 1
      };
      setStats(newStats);
      saveExerciseState(user.id, newStats);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/50">Loading sessions...</div>;

  if (activeVideo) {
    return (
      <div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center mm-page-enter bg-transparent">
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8 animate-[fadeUp_0.5s_ease-out]">
          <button onClick={handleEndSession} className="text-sm flex items-center gap-2 mb-6 text-white/50 hover:text-white transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Library
          </button>

          <div className="rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.15)] mb-8" style={{ border: `1px solid ${activeVideo.accent}40` }}>
            <iframe
              src={activeVideo.embed}
              title={activeVideo.name}
              className="w-full aspect-video"
              style={{ border: "none" }}
              allowFullScreen
            ></iframe>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold tracking-wide px-3 py-1 rounded-full uppercase" style={{ backgroundColor: `${activeVideo.accent}20`, color: activeVideo.accent }}>{activeVideo.level}</span>
                  <div className="flex gap-2">
                    {activeVideo.tags.map((tag: string) => (
                      <span key={tag} className="text-xs font-medium px-2 py-1 rounded-md bg-white/5 text-white/60">{tag}</span>
                    ))}
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{activeVideo.name}</h1>
                <p className="text-lg text-white/70 leading-relaxed">{activeVideo.desc}</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-5 w-5" style={{ color: activeVideo.accent }} />
                  <h3 className="text-xl font-semibold text-white">AI Session Summary</h3>
                </div>
                <p className="text-white/70 leading-relaxed">{activeVideo.summary}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-2">Session Steps</h3>
              {activeVideo.steps.map((step: string, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 hover:border-white/20 transition-colors backdrop-blur-md">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: `${activeVideo.accent}20`, color: activeVideo.accent }}>
                    {i + 1}
                  </div>
                  <span className="text-white/80 font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  let filteredVideos = activeTab === "All" ? YOGA_VIDEOS : YOGA_VIDEOS.filter(v => v.level === activeTab);
  if (!showMore && activeTab === "All") {
    filteredVideos = filteredVideos.slice(0, 6);
  }

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center mm-page-enter bg-transparent" style={{ padding: "32px 16px" }}>
      <div className="w-full max-w-7xl mx-auto">

        <div className="mb-8 animate-[fadeUp_0.4s_ease-out]">
          <button onClick={() => go("home")} className="text-sm flex items-center gap-1 mb-4 hover:text-white transition-colors" style={{ color: "#4a6070" }}>
            <ArrowLeft className="h-4 w-4" /> Back to Hub
          </button>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">Emotional Fitness</h1>
          <p className="text-lg" style={{ color: "#4a6070" }}>Train your mind. Build your resilience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 backdrop-blur-md" style={{ backgroundColor: "rgba(17,24,39,0.7)", border: "0.5px solid rgba(139,92,246,0.3)", borderRadius: "13px", animation: "fadeUp 0.5s ease-out 0.1s both" }}>
            <div className="flex-1 flex items-center gap-4">
              <span className="text-4xl animate-pulse">🔥</span>
              <div>
                <div className="font-bold text-xl mb-1" style={{ color: "#8b5cf6" }}>{stats.streakDays || 0}-day streak</div>
                <div className="text-sm text-white/60">Keep it up! You're doing great.</div>
              </div>
            </div>
            <div className="hidden sm:block h-16 w-px" style={{ backgroundColor: "rgba(139,92,246,0.3)" }}></div>
            <div className="w-full sm:w-px h-px sm:h-0 sm:hidden" style={{ backgroundColor: "rgba(139,92,246,0.3)" }}></div>
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white/60">Weekly Goal</span>
                <span className="font-bold text-purple-400">{Math.min(stats.sessionsCompleted || 0, 24)}/24 Sessions</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(168, 85, 247, 0.2)" }}>
                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(((stats.sessionsCompleted || 0) / 24) * 100, 100)}%`, backgroundColor: "#c283fcff" }}></div>
              </div>
            </div>
          </div>

          <div className="p-6 flex flex-col xl:flex-row gap-6 items-center backdrop-blur-md" style={{ backgroundColor: "rgba(17,24,39,0.7)", border: "0.5px solid rgba(139,92,246,0.3)", borderRadius: "13px", animation: "fadeUp 0.5s ease-out 0.2s both" }}>
            <div className="flex-1 w-full">
              <h4 className="text-xs font-bold mb-4 tracking-widest uppercase text-white/60">This Week</h4>
              <div className="flex justify-between">
                {[
                  { day: "M", done: stats?.weekDays?.[0] || false },
                  { day: "T", done: stats?.weekDays?.[1] || false },
                  { day: "W", done: stats?.weekDays?.[2] || false },
                  { day: "T", done: stats?.weekDays?.[3] || false },
                  { day: "F", done: stats?.weekDays?.[4] || false },
                  { day: "S", done: stats?.weekDays?.[5] || false },
                  { day: "S", done: stats?.weekDays?.[6] || false },
                ].map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110" style={{
                      backgroundColor: d.done ? "#c283fcff" : "transparent",
                      border: d.done ? "none" : "0.5px solid #c283fcff"
                    }}>
                      {d.done && <Check className="h-4 w-4" style={{ color: "#000000" }} />}
                    </div>
                    <span className="text-xs font-medium text-white/60">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 w-full xl:w-auto">
              <div className="flex-1 xl:w-28 p-3 rounded-xl flex flex-col items-center justify-center transition-colors hover:bg-white/10" style={{ backgroundColor: "rgba(10,21,32,0.5)", border: "0.5px solid rgba(139,92,246,0.3)" }}>
                <span className="text-2xl font-extrabold mb-1 text-violet-400">{stats.sessionsCompleted || 0}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">Sessions</span>
              </div>
              <div className="flex-1 xl:w-28 p-3 rounded-xl flex flex-col items-center justify-center transition-colors hover:bg-white/10" style={{ backgroundColor: "rgba(10,21,32,0.5)", border: "0.5px solid rgba(139,92,246,0.3)" }}>
                <span className="text-2xl font-extrabold mb-1 text-purple-400">{stats.minutesWatched || 0}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">Minutes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-8 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {["All", "Beginner", "Intermediate", "Advanced"].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 hover:scale-105 shadow-lg"
              style={{
                backgroundColor: activeTab === tab ? "#8b5cf6" : "rgba(17,24,39,0.7)",
                color: activeTab === tab ? "#000000" : "rgba(255,255,255,0.6)",
                border: activeTab === tab ? "none" : "0.5px solid rgba(139,92,246,0.3)",
                animation: `fadeUp 0.5s ease-out ${0.3 + i * 0.05}s both`,
                backdropFilter: "blur(10px)"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div key={animKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {filteredVideos.map((vid, i) => (
            <div
              key={vid.id}
              className="group overflow-hidden relative flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.3)] backdrop-blur-md"
              style={{
                backgroundColor: "rgba(17,24,39,0.7)",
                border: "0.5px solid rgba(139,92,246,0.2)",
                borderRadius: "16px",
                animation: `fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.1}s both`
              }}
            >
              <div className="w-full absolute top-0 left-0 z-10" style={{ height: "4px", backgroundColor: vid.accent }}></div>
              <div className="relative pt-[4px]">
                <iframe
                  src={vid.embed}
                  title={vid.name}
                  className="w-full aspect-video pointer-events-none"
                  style={{ border: "none" }}
                  tabIndex={-1}
                ></iframe>
                <div className="absolute inset-0 bg-transparent z-10 cursor-pointer" onClick={() => handleStartSession(vid)}></div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold tracking-wide px-3 py-1 rounded-full uppercase" style={{
                    backgroundColor: `${vid.accent}20`,
                    color: vid.accent
                  }}>
                    {vid.level}
                  </span>
                  <button className="text-white/40 hover:text-violet-400 transition-colors hover:scale-110">
                    <Heart className="h-6 w-6" />
                  </button>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-violet-300 transition-colors cursor-pointer" onClick={() => handleStartSession(vid)}>{vid.name}</h3>
                <p className="text-sm mb-6 line-clamp-2 text-white/60 flex-grow leading-relaxed">{vid.desc}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {vid.tags.map(tag => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60">
                      {tag}
                    </span>
                  ))}
                </div>
                <button onClick={() => handleStartSession(vid)} className="w-full py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:brightness-110" style={{ backgroundColor: vid.btnBg, color: vid.btnText }}>
                  START SESSION
                </button>
              </div>
            </div>
          ))}
        </div>

        {!showMore && activeTab === "All" && (
          <div className="flex justify-center mt-4 mb-10 animate-[fadeUp_0.5s_ease-out_0.8s_both]">
            <button
              onClick={() => setShowMore(true)}
              className="px-8 py-3 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/60 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 font-semibold text-sm group flex items-center gap-2"
            >
              View More Sessions <ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Support ──────────────────────────────────────────
function SupportPage({ go }: { go: (v: View) => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"therapists" | "resources">("therapists");
  const [animKey, setAnimKey] = useState(0);
  const [filter, setFilter] = useState<string>("All");
  const [book, setBook] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const allSpec = ["All", ...Array.from(new Set(THERAPISTS.flatMap((t) => t.specialty)))];
  const list = filter === "All" ? THERAPISTS : THERAPISTS.filter((t) => t.specialty.includes(filter));

  const switchTab = (tab: "therapists" | "resources") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setAnimKey((k) => k + 1);
  };

  return (
    <Page title="Support" subtitle="You are not alone — help is always near" go={go}>
      {/* ── Tab switcher ── */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          width: "fit-content",
        }}
      >
        {([
          { id: "therapists", label: "Find a Therapist" },
          { id: "resources", label: "Resources & Crisis" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300"
            style={{
              background: activeTab === tab.id
                ? "linear-gradient(135deg,#00bcd4 0%,#4f46e5 100%)"
                : "transparent",
              color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.5)",
              boxShadow: activeTab === tab.id ? "0 0 20px rgba(0,188,212,0.35)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Animated content wrapper ── */}
      <style>{`
        @keyframes supportTabIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .support-tab-panel {
          animation: supportTabIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
      `}</style>

      {/* ══ TAB 1 — Find a Therapist ══ */}
      {activeTab === "therapists" && (
        <div key={`therapists-${animKey}`} className="support-tab-panel">
          <div className="bg-red-500/10 border border-red-500/40 rounded-2xl px-4 py-3 mb-6 flex items-center gap-3">
            <Phone className="h-5 w-5 text-red-400" />
            <div className="text-sm text-white">
              <strong className="text-red-300">Crisis?</strong> Call iCall (India):{" "}
              <a href="tel:9152987821" className="text-red-300 underline font-semibold">9152987821</a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {allSpec.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="px-3 py-1.5 text-xs rounded-full border transition-all duration-200"
                style={{
                  background: filter === s ? "#00bcd4" : "rgba(255,255,255,0.05)",
                  borderColor: filter === s ? "#00bcd4" : "rgba(255,255,255,0.1)",
                  color: filter === s ? "#fff" : "rgba(255,255,255,0.7)",
                  transform: filter === s ? "scale(1.05)" : "scale(1)",
                  boxShadow: filter === s ? "0 0 12px rgba(0,188,212,0.4)" : "none",
                }}
              >{s}</button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((t, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-[0_0_24px_rgba(0,188,212,0.15)] hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {t.name.split(" ").slice(-2).map((n: string) => n[0]).join("")}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/40">{t.match}% match</span>
                </div>
                <div className="text-white font-semibold">{t.name}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.specialty.map((s: string) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <div className="flex items-center gap-1 text-yellow-400"><Star className="h-3.5 w-3.5 fill-current" />{t.rating}</div>
                  <div className="text-white/70">₹{t.price}/session</div>
                </div>
                <button
                  onClick={() => { setBook(t); setConfirmed(false); }}
                  className="w-full mt-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold text-sm hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-200"
                >
                  Book Session
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB 2 — Resources & Crisis ══ */}
      {activeTab === "resources" && (
        <div key={`resources-${animKey}`} className="support-tab-panel space-y-5">

          {/* Row 1 — Professional + Community */}
          <div className="grid md:grid-cols-[1fr_320px] gap-5">
            {/* Talk to a Professional */}
            <div
              className="rounded-2xl p-7 flex flex-col justify-between"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "linear-gradient(135deg,#00bcd4,#4f46e5)", boxShadow: "0 0 24px rgba(0,188,212,0.45)" }}
              >
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Talk to a Professional</h2>
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  Connect with licensed therapists specialized in mindfulness and emotional regulation.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_24px_rgba(0,188,212,0.5)]"
                    style={{ background: "linear-gradient(135deg,#00bcd4,#4f46e5)" }}
                    onClick={() => switchTab("therapists")}
                  >
                    Schedule Session <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white/70 border border-white/15 hover:bg-white/8 hover:text-white transition-all duration-200"
                    onClick={() => switchTab("therapists")}
                  >
                    View Counselors
                  </button>
                </div>
              </div>
            </div>

            {/* Community Forum */}
            <div
              className="rounded-2xl p-7 flex flex-col justify-between"
              style={{
                background: "rgba(123,47,190,0.12)",
                border: "1px solid rgba(123,47,190,0.3)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(123,47,190,0.4)", border: "1px solid rgba(123,47,190,0.5)" }}
              >
                <Users className="h-6 w-6 text-purple-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Community Forum</h2>
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  Share experiences and find comfort in a safe, moderated space with peers.
                </p>
                <a href="https://www.mentalhealthforum.net/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-purple-400 font-semibold text-sm hover:text-purple-300 transition-colors duration-200 group">
                  Enter Forum
                  <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                </a>
              </div>
            </div>
          </div>

          {/* Row 2 — Crisis Resources */}
          <div
            className="rounded-2xl px-7 py-6 flex flex-wrap items-center gap-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(220,38,38,0.25)", border: "1px solid rgba(220,38,38,0.4)" }}
            >
              <span className="text-red-300 text-2xl font-bold">✚</span>
            </div>
            <div className="flex-1 min-w-[180px]">
              <h2 className="text-xl font-bold text-white mb-1">Crisis Resources</h2>
              <p className="text-white/60 text-sm">Immediate help is available 24/7. You don't have to face this alone.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="tel:988"
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(251,146,60,0.5)]"
                style={{ background: "linear-gradient(135deg,#fb923c,#ef4444)", color: "#fff" }}
              >
                <Phone className="h-4 w-4" /> Call 988
              </a>
              <button
                onClick={() => window.dispatchEvent(new Event("open-lumi-chat"))}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <MessageCircle className="h-4 w-4" /> Text Crisis Line
              </button>
            </div>
          </div>

          {/* Row 3 — Three utility cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <BookMarked className="h-6 w-6" />,
                iconBg: "rgba(0,188,212,0.15)",
                iconColor: "#00bcd4",
                title: "Wellness Library",
                desc: "Guided breathing exercises, coping articles, and mindfulness techniques.",
                cta: "Browse Library",
                link: "https://www.helpguide.org/",
              },
              {
                icon: <Heart className="h-6 w-6" />,
                iconBg: "rgba(236,72,153,0.15)",
                iconColor: "#ec4899",
                title: "Personal Safety Plan",
                desc: "Create a custom roadmap for navigating tough emotional days.",
                cta: "Build My Plan",
                link: "https://www.mysafetyplan.org/",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                iconBg: "rgba(0,188,212,0.15)",
                iconColor: "#34d399",
                title: "Insurance Helper",
                desc: "Verify your coverage for mental health visits and therapy sessions.",
                cta: "Check Coverage",
                link: "https://www.healthcare.gov/",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 flex flex-col gap-4 group cursor-pointer transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                  animationDelay: `${0.05 + i * 0.06}s`,
                }}
              >
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: card.iconBg, color: card.iconColor }}
                >
                  {card.icon}
                </div>
                <div>
                  <div className="text-white font-semibold mb-1">{card.title}</div>
                  <div className="text-white/55 text-sm leading-relaxed">{card.desc}</div>
                </div>
                <a
                  href={card.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1 text-xs font-semibold transition-colors duration-200 text-left"
                  style={{ color: card.iconColor }}
                >
                  {card.cta} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Booking modal (shared) ── */}
      {book && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setBook(null)}>
          <div className="bg-[#0A0A0F] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {!confirmed ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Book with {book.name}</h3>
                  <button onClick={() => setBook(null)} className="text-white/60"><X className="h-5 w-5" /></button>
                </div>
                <label className="text-xs text-white/60">Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full mt-1 mb-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white" />
                <label className="text-xs text-white/60">Time</label>
                <div className="grid grid-cols-3 gap-2 mt-1 mb-4">
                  {["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((t) => (
                    <button key={t} onClick={() => setSelectedTime(t)} className={`py-2 rounded-lg border text-sm transition ${selectedTime === t ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300" : "bg-white/5 border-white/10 text-white hover:bg-cyan-500/10 hover:border-cyan-500/30"}`}>{t}</button>
                  ))}
                </div>
                <button onClick={async () => {
                  if (user && book) {
                    await saveBookedSession(user.id, {
                      therapist_name: book.name,
                      session_date: selectedDate,
                      session_time: selectedTime,
                      session_type: "Video Call",
                      status: "Upcoming"
                    });
                  }
                  setConfirmed(true);
                }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-700 text-white font-semibold hover:scale-[1.02] transition">
                  Confirm Booking
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <div className="text-white font-semibold text-lg">Session Booked!</div>
                <div className="text-white/60 text-sm mt-1">Check your email for confirmation.</div>
                <button onClick={() => setBook(null)} className="mt-5 px-6 py-2 rounded-xl bg-white/10 text-white">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}

// ── Settings Page ───────────────────────────────────
function SettingsPage({ go, name, setName, avatar, setAvatar }: { go: (v: View) => void; name: string; setName: (n: string) => void; avatar: string | null; setAvatar: (a: string | null) => void }) {
  const { user } = useAuth();
  const isGoogle = user?.app_metadata?.provider === "google";
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "notifications" | "privacy" | "data">("profile");
  const [displayName, setDisplayName] = useState(name);
  const [email, setEmail] = useState(user?.email || "user@moodmirror.app");
  const [bio, setBio] = useState("");
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifReminder, setNotifReminder] = useState(true);
  const [privAnon, setPrivAnon] = useState(false);
  const [privShare, setPrivShare] = useState(true);
  const [saved, setSaved] = useState(false);
  const [accent, setAccent] = useState("#8b5cf6");
  const [fontSize, setFontSize] = useState("15");
  const [motionOn, setMotionOn] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dataStats, setDataStats] = useState({ journals: 0, moods: 0, daysActive: 0 });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getMoodLogs(user.id, 500),
      getJournals(user.id, 500)
    ]).then(([moodLogs, journals]) => {
      const days = new Set([
        ...moodLogs.map(m => new Date(m.timestamp).toLocaleDateString()),
        ...journals.map(j => new Date(j.created_at).toLocaleDateString())
      ]);
      setDataStats({
        journals: journals.length,
        moods: moodLogs.length,
        daysActive: days.size
      });
    });
  }, [user]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const b64 = reader.result as string;
        setAvatar(b64);
        if (user) await updateProfile(user.id, { avatar_url: b64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setName(displayName);
    if (user) {
      await updateProfile(user.id, { display_name: displayName });
      if (email !== user.email && !isGoogle) {
        await supabase.auth.updateUser({ email });
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: "👤" },
    { id: "appearance" as const, label: "Appearance", icon: "🎨" },
    { id: "notifications" as const, label: "Notifications", icon: "🔔" },
    { id: "privacy" as const, label: "Privacy", icon: "🔐" },
    { id: "data" as const, label: "Data", icon: "📊" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-[fadeUp_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => go("home")}
          className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-white/50 text-sm">Manage your account & preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar tabs */}
        <div
          className="rounded-2xl p-2 h-fit"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 last:mb-0 ${activeTab === tab.id
                ? "bg-gradient-to-r from-violet-600/30 to-indigo-600/20 text-white border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div
          className="rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <div className="p-6 animate-[fadeUp_0.3s_ease-out]">
              <h2 className="text-white font-semibold text-lg mb-6">Profile Information</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5 mb-8">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 relative group cursor-pointer overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", boxShadow: "0 8px 32px rgba(139,92,246,0.45)" }}
                >
                  {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : displayName.slice(0, 1).toUpperCase()}
                  <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-white font-medium">{displayName}</p>
                  <p className="text-white/40 text-sm mt-0.5">{user?.email || "Member"} · MoodMirror</p>
                  <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition">Change avatar →</button>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Display Name</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Email</label>
                  <input
                    value={email}
                    disabled={isGoogle}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition disabled:opacity-50"
                  />
                  {isGoogle && <p className="text-white/40 text-[10px] mt-1">Managed by Google</p>}
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little about yourself..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:scale-[1.02] transition shadow-[0_0_24px_rgba(139,92,246,0.4)]"
                >
                  Save Changes
                </button>
                {saved && (
                  <span className="text-green-400 text-sm animate-[fadeUp_0.3s_ease-out] flex items-center gap-1">
                    <CheckCheck className="h-4 w-4" /> Saved!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── APPEARANCE TAB ── */}
          {activeTab === "appearance" && (
            <div className="p-6 animate-[fadeUp_0.3s_ease-out]">
              <h2 className="text-white font-semibold text-lg mb-6">Appearance</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-3">Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "dark", label: "Dark", desc: "Easy on the eyes", bg: "from-slate-900 to-slate-800", active: true },
                      { id: "light", label: "Light", desc: "Bright & clean", bg: "from-gray-100 to-white", active: false },
                    ].map((t) => (
                      <div
                        key={t.id}
                        onClick={() => alert("Will be implemented in next update")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${t.active ? "border-violet-500/50 bg-violet-500/10" : "border-white/10 bg-white/3 hover:border-white/20"
                          }`}
                      >
                        <div className={`h-16 rounded-lg bg-gradient-to-br ${t.bg} mb-3 border border-white/10`} />
                        <p className="text-white text-sm font-medium">{t.label}</p>
                        <p className="text-white/40 text-xs">{t.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-3">Accent Color</label>
                  <div className="flex gap-3">
                    {[
                      { color: "#8b5cf6", name: "Violet" },
                      { color: "#06b6d4", name: "Cyan" },
                      { color: "#ec4899", name: "Pink" },
                      { color: "#10b981", name: "Emerald" },
                      { color: "#f59e0b", name: "Amber" },
                    ].map((c) => (
                      <button
                        key={c.name}
                        title={c.name}
                        onClick={() => setAccent(c.color)}
                        className={`h-8 w-8 rounded-full transition-all hover:scale-110 ${accent === c.color ? "ring-2 ring-offset-2 ring-offset-[#0A0A0F] ring-white" : ""}`}
                        style={{ background: c.color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-3">Font Size</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="12" max="20" value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="flex-1" style={{ accentColor: accent }} />
                    <span className="text-white/60 text-sm w-10 text-right">{fontSize}px</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-3">Animations</label>
                  <SettingsToggle label="Enable motion animations" sub="Smooth transitions between views" value={motionOn} onChange={setMotionOn} />
                  <SettingsToggle label="Reduce motion" sub="For accessibility or performance" value={reduceMotion} onChange={setReduceMotion} />
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === "notifications" && (
            <div className="p-6 animate-[fadeUp_0.3s_ease-out]">
              <h2 className="text-white font-semibold text-lg mb-6">Notification Preferences</h2>
              <div className="space-y-2">
                <SettingsToggle label="Push Notifications" sub="Get alerts directly on your device" value={notifPush} onChange={setNotifPush} />
                <SettingsToggle label="Email Summaries" sub="Weekly mood recap delivered to your inbox" value={notifEmail} onChange={setNotifEmail} />
                <SettingsToggle label="Daily Check-in Reminder" sub="Gentle nudge to log your mood" value={notifReminder} onChange={setNotifReminder} />
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-3">Reminder Time</label>
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500/50 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── PRIVACY TAB ── */}
          {activeTab === "privacy" && (
            <div className="p-6 animate-[fadeUp_0.3s_ease-out]">
              <h2 className="text-white font-semibold text-lg mb-6">Privacy & Security</h2>
              <div className="space-y-2 mb-6">
                <SettingsToggle label="Anonymous Mode" sub="Hide your name across the platform" value={privAnon} onChange={setPrivAnon} />
                <SettingsToggle label="Share Insights" sub="Allow anonymised data for research" value={privShare} onChange={setPrivShare} />
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
              <div className="space-y-3 mt-4">
                <h3 className="text-white/70 text-sm font-medium">Security</h3>
                {!isGoogle && (
                  <button onClick={() => alert("Will be implemented in next update")} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/8 transition text-sm">
                    <Lock className="h-4 w-4" /> Change Password
                  </button>
                )}
                <button onClick={() => alert("Will be implemented in next update")} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/8 transition text-sm">
                  <Settings className="h-4 w-4" /> Two-Factor Authentication
                </button>
              </div>
            </div>
          )}

          {/* ── DATA TAB ── */}
          {activeTab === "data" && (
            <div className="p-6 animate-[fadeUp_0.3s_ease-out]">
              <h2 className="text-white font-semibold text-lg mb-6">Your Data</h2>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Journal Entries", value: dataStats.journals, icon: "📓", grad: "from-indigo-500/20 to-blue-500/20" },
                  { label: "Mood Check-ins", value: dataStats.moods, icon: "💜", grad: "from-violet-500/20 to-purple-500/20" },
                  { label: "Days Active", value: dataStats.daysActive, icon: "🔥", grad: "from-orange-500/20 to-red-500/20" },
                ].map((s) => (
                  <div key={s.label} className={`bg-gradient-to-br ${s.grad} border border-white/10 rounded-2xl p-4 transition-all hover:scale-[1.02]`}>
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-white/50 text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
              <div className="space-y-3">
                <button onClick={() => alert("Will be implemented in next update")} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/8 transition text-sm">
                  <BarChart3 className="h-4 w-4 text-cyan-400" /> Export All Data (JSON)
                </button>
                <button onClick={() => alert("Will be implemented in next update")} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/15 transition text-sm">
                  <X className="h-4 w-4" /> Delete Account & All Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Address Page ─────────────────────────────────────
type AddressEntry = {
  id: string;
  label: string; // "Home" | "Work" | "Other"
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
  lat?: number;  // stored from map pin
  lng?: number;
};

const LABEL_ICONS: Record<string, React.ReactNode> = {
  Home: <HomeIcon className="h-4 w-4" />,
  Work: <Building2 className="h-4 w-4" />,
  Other: <MapPin className="h-4 w-4" />,
};

const LABEL_COLORS: Record<string, string> = {
  Home: "from-violet-500/20 to-indigo-500/20",
  Work: "from-cyan-500/20 to-blue-500/20",
  Other: "from-emerald-500/20 to-teal-500/20",
};

const LABEL_ICON_COLORS: Record<string, string> = {
  Home: "text-violet-400 bg-violet-500/15",
  Work: "text-cyan-400 bg-cyan-500/15",
  Other: "text-emerald-400 bg-emerald-500/15",
};

type AddressSubView = "list" | "form" | "form-details";

function AddressPage({ go, addresses, setAddresses }: {
  go: (v: View) => void;
  addresses: any[];
  setAddresses: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const { user } = useAuth();
  const [sub, setSub] = useState<"list" | "form" | "form-details">("list");
  const [editing, setEditing] = useState<AddressEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Draggable sanctuary pin — default to Mumbai, India
  const [pinPos, setPinPos] = useState<[number, number]>([INDIA_DEFAULT.lat, INDIA_DEFAULT.lng]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const LABEL_TITLES: Record<string, string> = {
    Home: "Sanctuary Home",
    Work: "Creative Studio",
    Other: "Other Place",
  };

  // addresses and setAddresses come from root via props

  // blank form template
  const blank: AddressEntry = {
    id: "",
    label: "Home",
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    isDefault: false,
  };

  const [form, setForm] = useState<AddressEntry>(blank);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...blank, id: Date.now().toString() });
    setSub("form");
  };

  const openEdit = (addr: AddressEntry) => {
    setEditing(addr);
    setForm({ ...addr });
    setSub("form");
  };

  const handleDelete = async (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    setDeleteConfirm(null);
    if (user && id.includes("-")) {
      await deleteAddress(id);
    }
  };

  const handleSetDefault = async (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    if (user && id.includes("-")) {
      await setDefaultAddress(user.id, id);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.line1.trim() || !form.city.trim() || !form.pincode.trim()) return;
    const entry = { ...form, lat: pinPos[0], lng: pinPos[1] };

    setAddresses((prev) => {
      const cleared = entry.isDefault
        ? prev.map((a) => ({ ...a, isDefault: false }))
        : prev;

      if (editing) {
        const updated = cleared.map((a) => (a.id === entry.id ? entry : a));
        const hasDefault = updated.some((a) => a.isDefault);
        return hasDefault ? updated : updated.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a));
      } else {
        const isFirst = cleared.length === 0;
        const newEntry = isFirst ? { ...entry, isDefault: true } : entry;
        return [...cleared, newEntry];
      }
    });

    if (user) {
      const dbSaved = await saveAddress(user.id, {
        id: editing && entry.id.includes("-") ? entry.id : undefined,
        label: entry.label,
        street: entry.line1 + (entry.line2 ? ", " + entry.line2 : ""),
        city: entry.city,
        coordinates: { lat: entry.lat, lng: entry.lng },
        is_default: entry.isDefault
      });
      if (dbSaved && !editing) {
        setAddresses(prev => prev.map(a => a.id === entry.id ? { ...a, id: dbSaved.id } : a));
      }
    }

    setSaved(true);
    setTimeout(() => { setSaved(false); setSub("list"); }, 900);
  };

  // Manual geocoding search — triggered by → button or Enter
  const doSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=6&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setSearchResults(data);
      // Fly map + update pinning location label from first result
      if (data.length > 0) {
        const first = data[0];
        const addr = first.address || {};
        setPinPos([parseFloat(first.lat), parseFloat(first.lon)]);
        setForm((f) => ({
          ...f,
          line1: first.display_name.split(",")[0].trim(),
          city: addr.city || addr.town || addr.village || addr.county || "",
          state: addr.state || "",
          pincode: addr.postcode || "",
        }));
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPinPos([lat, lng]);
    const addr = result.address || {};
    setForm((f) => ({
      ...f,
      line1: result.display_name.split(",")[0],
      city: addr.city || addr.town || addr.village || addr.county || "",
      state: addr.state || "",
      pincode: addr.postcode || "",
    }));
    setSearchQuery(result.display_name.split(",").slice(0, 2).join(","));
    setSearchResults([]);

  };

  const field = (label: string, key: keyof AddressEntry, placeholder: string, type = "text") => (
    <div>
      <label className="block text-xs text-white/50 uppercase tracking-wider mb-2 font-semibold">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20 transition text-sm"
      />
    </div>
  );

  return (
    <div className="min-h-screen text-white" style={{ background: "transparent" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-10">
          {(sub === "form" || sub === "form-details") && (
            <button
              onClick={() => sub === "form-details" ? setSub("form") : setSub("list")}
              className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {sub === "list" ? "My Addresses" : sub === "form" ? "Set Your Sanctuary" : editing ? "Edit Address" : "Add New Address"}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {sub === "list"
                ? "Manage your sanctuaries and reflection spaces."
                : sub === "form"
                  ? "Choose a location that resonates with your peace."
                  : "Fill in the details below"}
            </p>
          </div>
        </div>

        {/* ══ LIST SUB-VIEW ══ */}
        {sub === "list" && (
          <div className="mm-fade-up space-y-4">

            {/* ── 2-column address card grid ── */}
            {addresses.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                  <MapPin className="h-7 w-7 text-white/30" />
                </div>
                <p className="text-white/50 text-sm">No addresses saved yet</p>
                <p className="text-white/30 text-xs mt-1">Tap below to add one</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {addresses.map((addr, addrIdx) => (
                  <div
                    key={addr.id}
                    className="relative rounded-3xl overflow-hidden flex flex-col group mm-card-hover mm-fade-up"
                    style={{
                      background: "linear-gradient(135deg, rgba(20,20,35,0.95) 0%, rgba(25,20,40,0.90) 100%)",
                      border: "1.5px solid rgba(139,92,246,0.12)",
                      backdropFilter: "blur(24px)",
                      minHeight: 240,
                      animationDelay: `${addrIdx * 0.08}s`,
                    }}
                  >
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Icon + edit row */}
                      <div className="flex items-start justify-between mb-6">
                        <div
                          className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            background:
                              addr.label === "Home"
                                ? "rgba(139,92,246,0.20)"
                                : addr.label === "Work"
                                  ? "rgba(168,85,247,0.25)"
                                  : "rgba(34,197,94,0.20)",
                            boxShadow:
                              addr.label === "Home"
                                ? "0 0 16px rgba(139,92,246,0.20)"
                                : addr.label === "Work"
                                  ? "0 0 16px rgba(168,85,247,0.15)"
                                  : "0 0 16px rgba(34,197,94,0.15)",
                          }}
                        >
                          <span
                            style={{
                              color:
                                addr.label === "Home"
                                  ? "#22d3ee"
                                  : addr.label === "Work"
                                    ? "#d8b4fe"
                                    : "#4ade80",
                              fontSize: "24px",
                            }}
                          >
                            {LABEL_ICONS[addr.label] ?? LABEL_ICONS["Other"]}
                          </span>
                        </div>
                        {/* 3-Dot Menu Button */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === addr.id ? null : addr.id)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition"
                            title="Options"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenu === addr.id && (
                            <div
                              className="absolute right-0 top-10 rounded-lg overflow-hidden z-20 animate-[fadeUp_0.2s_ease-out] w-40"
                              style={{
                                background: "rgba(20,20,35,0.95)",
                                border: "1px solid rgba(139,92,246,0.20)",
                                backdropFilter: "blur(12px)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                              }}
                            >
                              <button
                                onClick={() => {
                                  openEdit(addr);
                                  setOpenMenu(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 transition flex items-center gap-2 border-b border-white/5"
                              >
                                <Pencil className="h-4 w-4 text-violet-400" />
                                Edit Address
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm(addr.id);
                                  setOpenMenu(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <p className="text-white font-bold text-base mb-2 leading-tight">{LABEL_TITLES[addr.label] ?? addr.name}</p>

                      {/* Address lines */}
                      <p className="text-white/60 text-xs leading-relaxed font-medium">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
                      </p>
                      <p className="text-white/45 text-xs mt-1">
                        {addr.city}, {addr.state} {addr.pincode}
                      </p>

                      <div className="flex-1" />

                      {/* Footer */}
                      <div
                        className="mt-5 pt-4"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {addr.isDefault ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full flex-shrink-0 animate-pulse"
                              style={{
                                background: "#8b5cf6",
                                boxShadow: "0 0 8px rgba(139,92,246,0.9)",
                              }}
                            />
                            <span
                              className="text-[11px] font-bold tracking-wider uppercase"
                              style={{ color: "#8b5cf6" }}
                            >
                              Default Destination
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase transition-all duration-200 hover:opacity-100 opacity-60 hover:opacity-100"
                            style={{ color: "#8b5cf6" }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            Set as Default
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delete confirm overlay */}
                    {deleteConfirm === addr.id && (
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 animate-[fadeUp_0.2s_ease-out]"
                        style={{
                          background: "rgba(10,8,24,0.96)",
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        <Trash2 className="h-6 w-6 text-red-400" />
                        <p className="text-white font-semibold text-xs text-center px-3">
                          Delete this address?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-4 py-1.5 rounded-lg bg-white/8 text-white/70 text-xs hover:bg-white/12 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(addr.id)}
                            className="px-4 py-1.5 rounded-lg bg-red-500/25 border border-red-500/40 text-red-400 text-xs font-semibold hover:bg-red-500/35 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Real Leaflet reflection-radius map ── */}
            <div
              className="relative rounded-3xl overflow-hidden mm-map-reveal"
              style={{ height: 210, border: "1.5px solid rgba(139,92,246,0.18)", zIndex: 1 }}
            >
              {(() => {
                const defAddr = addresses.find(a => a.isDefault) || addresses[0];
                const mapLat = defAddr?.lat ?? INDIA_DEFAULT.lat;
                const mapLng = defAddr?.lng ?? INDIA_DEFAULT.lng;
                const mapCenter: [number, number] = [mapLat, mapLng];
                return (
                  <MapContainer
                    key={`${mapLat}-${mapLng}`}
                    center={mapCenter}
                    zoom={11}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    dragging={false}
                    doubleClickZoom={false}
                    attributionControl={false}
                    className="mm-dark-map"
                    style={{ width: "100%", height: "100%" }}
                  >
                    <TileLayer url={OSM_DARK} />
                    <Marker position={mapCenter} icon={makePinIcon("#8b5cf6", 28)}>
                      <Popup>{defAddr?.line1 || INDIA_DEFAULT.line1}</Popup>
                    </Marker>
                    <Circle
                      center={mapCenter}
                      radius={15000}
                      pathOptions={{
                        color: "#8b5cf6",
                        fillColor: "#8b5cf6",
                        fillOpacity: 0.05,
                        weight: 1.5,
                        dashArray: "8 5",
                      }}
                    />
                  </MapContainer>
                );
              })()}

              {/* Overlay label */}
              <div
                className="absolute bottom-4 left-5 flex items-center gap-2.5 z-[400]"
                style={{ pointerEvents: "none" }}
              >
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{
                    background: "rgba(6,20,32,0.82)",
                    border: "1px solid rgba(139,92,246,0.30)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <MapPin className="h-4 w-4" style={{ color: "#8b5cf6" }} />
                  <span className="text-white/85 text-xs font-semibold">
                    Your Reflection Radius: 15 km
                  </span>
                </div>
              </div>
            </div>

            {/* ── Add New Address CTA ── */}
            <button
              onClick={openAdd}
              className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-3xl transition-all group"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(168,85,247,0.08) 100%)",
                border: "1.5px solid rgba(139,92,246,0.22)",
              }}
            >
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                style={{
                  border: "2.5px solid #8b5cf6",
                  color: "#8b5cf6",
                  boxShadow: "0 0 20px rgba(139,92,246,0.40)",
                }}
              >
                <Plus className="h-6 w-6" />
              </div>
              <span
                className="text-xs font-bold tracking-[0.2em] uppercase transition-all group-hover:tracking-[0.24em] text-white/90"
                style={{ color: "#8b5cf6" }}
              >
                Add New Address
              </span>
            </button>
          </div>
        )}

        {/* ══ MAP LOCATION PICKER SUB-VIEW ══ */}
        {sub === "form" && (
          <div className="mm-scale-in">
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(20,20,35,0.85) 0%, rgba(25,20,40,0.80) 100%)",
                border: "1.5px solid rgba(139,92,246,0.15)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Title */}
              <div className="p-8 pb-6 mm-fade-up">
                <h2 className="text-3xl font-bold text-white mb-2">Set Your Sanctuary</h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  Drag the pin to choose a location that resonates with your peace. This address will be pinned to your emotional journal.
                </p>
              </div>

              {/* Search Bar */}
              <div className="px-8 pb-2 mm-fade-up-d1 relative">
                <div
                  className="relative flex items-center transition-all duration-300 focus-within:shadow-[0_0_0_2px_rgba(139,92,246,0.35)]"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1.5px solid rgba(139,92,246,0.18)",
                    borderRadius: "50px",
                    padding: "10px 14px",
                  }}
                >
                  <Search className="h-4 w-4 text-violet-400 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    placeholder="Type a place and press → to search…"
                    className="flex-1 bg-transparent text-white placeholder-white/35 focus:outline-none text-sm"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
                  />
                  {searchQuery && !searchLoading && (
                    <button
                      onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                      className="h-5 w-5 text-white/30 hover:text-white/70 transition flex items-center justify-center text-base leading-none mr-1"
                    >×</button>
                  )}
                  {/* Arrow search button */}
                  <button
                    onClick={doSearch}
                    disabled={searchLoading}
                    className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ml-1 transition-all duration-200 hover:scale-110 disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg,#8b5cf6,#0891b2)",
                      boxShadow: "0 0 14px rgba(139,92,246,0.45)",
                    }}
                    title="Search"
                  >
                    {searchLoading
                      ? <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <ArrowRight className="h-4 w-4 text-white" />
                    }
                  </button>
                </div>

                {/* Results dropdown */}
                {searchResults.length > 0 && (
                  <div
                    className="absolute left-8 right-8 top-full mt-2 rounded-2xl overflow-hidden z-[500]"
                    style={{
                      background: "rgba(8,10,24,0.98)",
                      border: "1.5px solid rgba(139,92,246,0.28)",
                      backdropFilter: "blur(20px)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.06)",
                    }}
                  >
                    {searchResults.map((result: any, idx: number) => {
                      const parts = result.display_name.split(",");
                      const title = parts[0].trim();
                      const sub = parts.slice(1, 3).join(",").trim();
                      return (
                        <button
                          key={idx}
                          onClick={() => selectSearchResult(result)}
                          className="w-full px-4 py-3 text-left flex items-start gap-3 transition-all duration-150 hover:bg-violet-500/10 border-b border-white/5 last:border-0"
                        >
                          <MapPin className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{title}</p>
                            <p className="text-white/45 text-xs truncate mt-0.5">{sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* No results */}
                {!searchLoading && searchResults.length === 0 && searchQuery.length > 0 && (
                  <div className="absolute left-8 right-8 top-full mt-2 rounded-2xl px-4 py-3 z-[500] text-white/40 text-sm"
                    style={{ background: "rgba(8,10,24,0.96)", border: "1.5px solid rgba(255,255,255,0.06)" }}>
                    No results — try a different query
                  </div>
                )}
              </div>


              {/* ── Real Leaflet Map Picker ── */}
              <div
                className="relative mx-8 rounded-2xl overflow-hidden mm-map-reveal"
                style={{ height: 360, border: "1px solid rgba(139,92,246,0.18)", marginBottom: "20px", zIndex: 1 }}
              >
                <MapContainer
                  center={pinPos}
                  zoom={14}
                  className="mm-dark-map"
                  style={{ width: "100%", height: "100%" }}
                  scrollWheelZoom={true}
                  zoomControl={true}
                >
                  <TileLayer url={OSM_DARK} />
                  <MapRecenter lat={pinPos[0]} lng={pinPos[1]} zoom={14} />
                  <Marker
                    position={pinPos}
                    icon={makePinIcon("#8b5cf6", 38)}
                    draggable={true}
                    eventHandlers={{
                      dragend: async (e) => {
                        const m = e.target;
                        const pos = m.getLatLng();
                        setPinPos([pos.lat, pos.lng]);
                        // Reverse geocode to update the pinning location label
                        try {
                          const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&addressdetails=1`,
                            { headers: { "Accept-Language": "en" } }
                          );
                          const data = await res.json();
                          if (data && data.address) {
                            const addr = data.address;
                            setForm((f) => ({
                              ...f,
                              line1: (data.display_name || "").split(",")[0].trim(),
                              city: addr.city || addr.town || addr.village || addr.county || "",
                              state: addr.state || "",
                              pincode: addr.postcode || "",
                            }));
                          }
                        } catch { /* silent */ }
                      },
                    }}
                  >
                    <Popup>
                      <div style={{ color: "#8b5cf6", fontWeight: 700, fontSize: 13 }}>Current Selection</div>
                      <div style={{ color: "#ccc", fontSize: 11 }}>Drag the pin to reposition</div>
                    </Popup>
                  </Marker>
                  {/* Soft glow radius */}
                  <Circle
                    center={pinPos}
                    radius={600}
                    pathOptions={{ color: "#8b5cf6", fillColor: "#8b5cf6", fillOpacity: 0.07, weight: 1, dashArray: "5 4" }}
                  />
                </MapContainer>

                {/* Drag hint overlay badge */}
                <div
                  className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(6,20,32,0.82)",
                    border: "1px solid rgba(139,92,246,0.35)",
                    backdropFilter: "blur(8px)",
                    color: "#8b5cf6",
                    pointerEvents: "none",
                  }}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Drag the pin to set your sanctuary
                </div>
              </div>

              {/* Location Info Footer */}
              <div
                className="mx-8 mb-6 p-4 rounded-xl flex items-center justify-between mm-fade-up-d2"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.14)" }}
              >
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-1">Pinning Location</p>
                  <p className="text-white text-sm font-medium">{form.line1 || "42 Nebula Way, Clarity District"}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {pinPos[0].toFixed(5)}°N, {pinPos[1].toFixed(5)}°W
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        setPinPos([pos.coords.latitude, pos.coords.longitude]);
                      });
                    }
                  }}
                  className="h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1.5px solid rgba(139,92,246,0.35)", color: "#8b5cf6" }}
                  title="Use my location"
                >
                  <LocateFixed className="h-4 w-4" />
                </button>
              </div>

              {/* Confirm / Cancel */}
              <div className="px-8 pb-8 flex gap-3 mm-fade-up-d3">
                <button
                  onClick={() => setSub("form-details")}
                  className="flex-1 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 mm-btn-shine"
                  style={{ background: "linear-gradient(90deg,#8b5cf6,#0891b2)", color: "#0a0a14" }}
                >
                  Confirm Location
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSub("list")}
                  className="px-6 py-3 rounded-full text-white/70 hover:text-white text-sm transition-all duration-200 hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ FORM DETAILS SUB-VIEW ══ */}
        {sub === "form-details" && (
          <div className="animate-[fadeUp_0.3s_ease-out]">
            <div
              className="rounded-3xl p-8 space-y-6"
              style={{
                background: "linear-gradient(135deg, rgba(20,20,35,0.85) 0%, rgba(25,20,40,0.80) 100%)",
                border: "1.5px solid rgba(139,92,246,0.12)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Address type selector */}
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-3 font-semibold">Address Type</label>
                <div className="flex gap-3">
                  {(["Home", "Work", "Other"] as const).map((lbl) => (
                    <button
                      key={lbl}
                      onClick={() => setForm((f) => ({ ...f, label: lbl }))}
                      className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border text-xs font-semibold transition-all ${form.label === lbl
                        ? "border-violet-400/60 bg-violet-500/15 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                        : "border-white/12 bg-white/5 text-white/50 hover:border-white/25 hover:text-white/70"
                        }`}
                    >
                      <span className={form.label === lbl ? "opacity-100" : "opacity-60"}>
                        {LABEL_ICONS[lbl]}
                      </span>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              {field("Full Name", "name", "e.g. Alex Johnson")}

              {/* Phone */}
              {field("Phone Number", "phone", "+91 00000 00000", "tel")}

              {/* Address Line 1 */}
              {field("Address Line 1", "line1", "House / Flat No., Building Name")}

              {/* Address Line 2 */}
              {field("Address Line 2 (optional)", "line2", "Street, Locality, Area")}

              {/* City + State row */}
              <div className="grid grid-cols-2 gap-4">
                {field("City", "city", "e.g. Bengaluru")}
                {field("State", "state", "e.g. Karnataka")}
              </div>

              {/* Pincode */}
              {field("Pincode", "pincode", "e.g. 560034")}

              {/* Set as default toggle */}
              <div
                className="flex items-center justify-between py-4 px-5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.10)" }}
              >
                <div>
                  <p className="text-white/90 text-sm font-semibold">Set as default address</p>
                  <p className="text-white/40 text-xs mt-0.5">Used automatically for deliveries</p>
                </div>
                <button
                  onClick={() => setForm((f) => ({ ...f, isDefault: !f.isDefault }))}
                  className={`relative h-6 w-11 rounded-full transition-all duration-300 flex-shrink-0 ${form.isDefault ? "bg-gradient-to-r from-violet-500 to-violet-600" : "bg-white/10"
                    }`}
                >
                  <span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300"
                    style={{ left: form.isDefault ? "calc(100% - 22px)" : "2px" }}
                  />
                </button>
              </div>

              {/* Save / Cancel */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-semibold text-sm hover:shadow-[0_0_28px_rgba(139,92,246,0.4)] transition flex items-center justify-center gap-2"
                >
                  {saved ? (
                    <><Check className="h-4 w-4" /> Saved!</>
                  ) : (
                    editing ? "Update Address" : "Save Address"
                  )}
                </button>
                <button
                  onClick={() => setSub("form")}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm transition"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsToggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <p className="text-white/90 text-sm font-medium">{label}</p>
        <p className="text-white/40 text-xs mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-all duration-300 flex-shrink-0 ${value ? "bg-gradient-to-r from-violet-600 to-indigo-600" : "bg-white/10"
          }`}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300"
          style={{ left: value ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </div>
  );
}

// ── Booked Sessions ──────────────────────────────────
function BookedSessionsPage({ go }: { go: (v: View) => void }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const ok = await deleteBookedSession(id);
    if (ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
    setMenuOpenId(null);
  };

  useEffect(() => {
    if (user) {
      getBookedSessions(user.id).then(data => setSessions(data));
    }
  }, [user]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 relative max-w-4xl mx-auto">
      <button
        onClick={() => go("home")}
        className="mb-8 flex items-center gap-2 text-white/50 hover:text-white transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </button>

      <div className="mb-10 relative">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 blur-xl opacity-50" />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight relative">
          Booked Sessions
        </h1>
        <p className="text-lg text-white/60 relative max-w-xl">
          Manage your upcoming appointments and therapy sessions.
        </p>
      </div>

      <div className="space-y-4">
        {sessions.map((s, i) => (
          <div key={s.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ animation: `fadeUp 0.5s ease-out ${i * 0.1}s both` }}>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                <BookMarked className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{s.therapist_name}</h3>
                <p className="text-white/50 text-sm">{s.session_type}</p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end">
              <div className="text-white/90 font-medium">{s.session_date}</div>
              <div className="text-white/50 text-sm">{s.session_time}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-semibold hidden sm:block">
                {s.status}
              </div>
              <div className="relative">
                <button
                  onClick={() => setMenuOpenId(menuOpenId === s.id ? null : s.id)}
                  className="p-2 text-white/40 hover:text-white transition rounded-lg hover:bg-white/5"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {menuOpenId === s.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                    <div className="absolute right-0 top-full mt-2 w-40 bg-[#1a1b2e] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1" style={{ animation: "fadeUp 0.2s ease-out forwards" }}>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-white/5 flex items-center gap-2 text-sm transition font-medium"
                      >
                        <Trash2 className="h-4 w-4" /> Cancel Session
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50">No upcoming sessions booked.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────
// Views that are only valid while unauthenticated — never persist these
const UNAUTH_VIEWS: View[] = ["start", "login"];

function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number, y: number, vx: number, vy: number, radius: number, color: string }[] = [];
    const colors = ['#00e5c0', '#c084fc', '#a855f7'];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const init = () => {
      particles = [];
      const num = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < num; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.5 + 0.5,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          let p2 = particles[j];
          let dx = p.x - p2.x;
          let dy = p.y - p2.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - (dist / 120)) * 0.15;
            ctx.lineWidth = 0.3;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#030008]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0118]/80 via-[#030008] to-[#060010]/70" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#6366f1]/10 blur-[120px] rounded-full mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#c084fc]/10 blur-[150px] rounded-full mix-blend-screen" />
      <canvas ref={canvasRef} className="absolute inset-0 opacity-80" />
    </div>
  );
}


function PageLoader() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 4 ? "." : d + ".");
    }, 375);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#030008]/80 backdrop-blur-2xl transition-all duration-500 animate-in fade-in">
      <div className="relative flex flex-col items-center gap-4">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-violet-600/20 blur-[100px] rounded-full scale-150 animate-pulse" />

        <div className="relative flex flex-col items-center gap-16">
          {/* Premium spinner */}
          <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-violet-500 animate-spin mb-4" />

          <div className="text-white text-3xl font-light tracking-[0.25em] font-mono flex items-baseline">
            <span className="opacity-90">loading</span>
            <span className="w-16 text-violet-400 font-bold ml-1">{dots}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoodMirrorInner() {
  const { user, profile, signOut } = useAuth();
  const [view, setView] = useState<View>("start");
  const [prevView, setPrevView] = useState<View | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const minDelayPassedRef = useRef(false);
  const splineLoadedRef = useRef(false);
  
  const handleHomeSplineLoad = useCallback(() => {
    splineLoadedRef.current = true;
    if (minDelayPassedRef.current) {
      setIsGlobalLoading(false);
    }
  }, []);
  
  // Name derives from Supabase profile if available, otherwise from local state
  const [name, setName] = useState("Alex");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dark, setDark] = useState(true);
  // Shared addresses state — starts empty, user adds their own
  const [addresses, setAddresses] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>(NOTIFICATIONS);

  useEffect(() => {
    if (user) {
      getAddresses(user.id).then(dbAddrs => {
        if (dbAddrs.length) {
          const mapped = dbAddrs.map(a => ({
            id: a.id, label: a.label, name: "User", line1: a.street, line2: "", city: a.city, state: "", pincode: "", phone: "", isDefault: a.is_default, lat: a.coordinates?.lat, lng: a.coordinates?.lng
          }));
          setAddresses(mapped);
        } else {
          setAddresses([]);
        }
      });
      getNotifications(user.id).then(dbNotifs => {
        if (dbNotifs.length) {
          setNotifs(dbNotifs);
        } else {
          setNotifs(NOTIFICATIONS); // Reset to default welcoming notifs
        }
      });
    } else {
      setAddresses([]);
      setNotifs(NOTIFICATIONS);
      setAvatar(null);
    }
  }, [user]);

  // ── go must be declared first so effects below can use it ──
  const go = useCallback((v: View) => {
    const isAfterLogin = !UNAUTH_VIEWS.includes(v);

    if (isAfterLogin) {
      setIsGlobalLoading(true);
      setTransitioning(true);
      minDelayPassedRef.current = false;

      // Switch view after brief fade out (300ms) to allow components to mount & fetch
      setTimeout(() => {
        setView(v);
        setPrevView(v);
        setTransitioning(false);
        try { localStorage.setItem("mm_view", v); } catch { }
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }, 300);

      if (v !== "home") {
        setTimeout(() => setIsGlobalLoading(false), 1500);
      } else {
        splineLoadedRef.current = false;
        setTimeout(() => {
          minDelayPassedRef.current = true;
          if (splineLoadedRef.current) setIsGlobalLoading(false);
        }, 1500);
        
        // Safety timeout just in case Spline fails completely
        setTimeout(() => setIsGlobalLoading(false), 10000);
      }
    } else {
      // Standard fast transition for start/login
      setTransitioning(true);
      setTimeout(() => {
        setView(v);
        setPrevView(v);
        setTransitioning(false);
        try {
          localStorage.removeItem("mm_view");
        } catch { }
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }, 220);
    }
  }, []);

  // Sync name from Supabase profile (runs after go is defined)
  useEffect(() => {
    if (profile?.display_name) {
      setName(profile.display_name.split(" ")[0]);
    } else if (user?.user_metadata?.full_name) {
      setName((user.user_metadata.full_name as string).split(" ")[0]);
    } else if (user?.email) {
      setName(user.email.split("@")[0]);
    }

    if (profile?.avatar_url) {
      setAvatar(profile.avatar_url);
    }
  }, [profile, user]);

  // Auto-navigate: if Supabase session exists, skip landing/login
  useEffect(() => {
    if (user && (view === "start" || view === "login")) {
      go("home");
    }
  }, [user, go]);

  const prevAddressesRef = useRef(addresses.length);
  useEffect(() => {
    if (addresses.length > prevAddressesRef.current) {
      setNotifs(prev => [{
        id: Date.now(),
        icon: "📍",
        title: "Sanctuary Added",
        body: "A new sanctuary has been added to your profile.",
        time: "Just now",
        unread: true
      }, ...prev]);
    }
    prevAddressesRef.current = addresses.length;
  }, [addresses.length]);

  const prevViewRef = useRef(view);
  useEffect(() => {
    if (prevViewRef.current === "login" && view === "home") {
      setNotifs(prev => [{
        id: Date.now() + 1,
        icon: "👋",
        title: `Welcome back, ${name}!`,
        body: "We're glad to see you again. Ready for your reflection?",
        time: "Just now",
        unread: true
      }, ...prev]);
    }
    prevViewRef.current = view;
  }, [view, name]);

  useEffect(() => {
    try {
      const d = localStorage.getItem("mm_dark");
      if (d !== null) setDark(d === "1");
      const n = localStorage.getItem("mm_name");
      if (n) setName(n);
      const savedView = localStorage.getItem("mm_view") as View | null;
      if (savedView && !UNAUTH_VIEWS.includes(savedView)) {
        setView(savedView);
      }
    } catch { }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("mm_dark", dark ? "1" : "0"); } catch { }
  }, [dark]);

  const handleName = (n: string) => {
    setName(n);
    try { localStorage.setItem("mm_name", n); } catch { }
  };

  const handleSignOut = async () => {
    if (user) {
      try {
        const { deleteChatHistory } = await import("@/lib/db");
        await deleteChatHistory(user.id);
      } catch (e) {
        console.error("Failed to delete chat history on signout", e);
      }
    }
    await signOut();
    setName("Alex");
    setAvatar(null);
    setAddresses([]);
    setNotifs(NOTIFICATIONS);
    try { 
      localStorage.removeItem("mm_view"); 
      localStorage.removeItem("mm_name"); 
      localStorage.removeItem("mm_dark"); 
      localStorage.removeItem("mm_chat");
    } catch { }
    go("start");
  };

  const showNav = !["start", "login"].includes(view);

  return (
    <div className={dark ? "" : "light"}>
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.3; }
          50% { transform: translate(30px,-40px) scale(1.15); opacity: 0.45; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 25px rgba(0,188,212,0.5); }
          50% { box-shadow: 0 0 50px rgba(0,188,212,0.85), 0 0 80px rgba(60,52,137,0.5); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sweep {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes wave {
          0%, 100% { height: 20%; }
          50% { height: 90%; }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        @keyframes lumiFloat {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1) translateY(-10px); }
        }
        @keyframes lumiGlowPulse {
          0%, 100% { box-shadow: 0 0 0 1.5px rgba(139,92,246,0.85), 0 0 12px rgba(139,92,246,0.55), 0 0 28px rgba(6,182,212,0.3); }
          50% { box-shadow: 0 0 0 1.5px rgba(139,92,246,1), 0 0 20px rgba(139,92,246,0.85), 0 0 44px rgba(6,182,212,0.55); }
        }
        @media print {
          nav, button { display: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#06060e]">
        {/* Persistent auth background — mounts once, no reload on start↔login nav */}
        {["start", "login"].includes(view) && (
          <SplineOverlay />
        )}






        {!(["start", "login"].includes(view)) && <NeuralBackground />}

        {showNav && <Navbar name={name} avatar={avatar} dark={dark} setDark={setDark} go={go} current={view} notifs={notifs} setNotifs={setNotifs} onSignOut={handleSignOut} />}

        {/* Page transition wrapper */}
        <div
          className="relative z-10"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? "translateY(10px) scale(0.99)" : "translateY(0) scale(1)",
            transition: "opacity 0.22s ease, transform 0.22s ease",
          }}
        >
          {view === "start" && <GetStarted go={go} />}
          {view === "login" && <Login go={go} setName={handleName} />}
          {view === "home" && <Home name={name} go={go} onLoadComplete={handleHomeSplineLoad} />}
          {view === "dashboard" && <Dashboard go={go} />}
          {view === "face" && <FacePage go={go} />}
          {view === "voice" && <VoicePage go={go} />}
          {view === "score" && <ScorePage go={go} />}
          {view === "journal" && <JournalPage go={go} />}
          {view === "history" && <HistoryPage go={go} />}
          {view === "nearby-resources" && <NearbyResourcesPage go={go} addresses={addresses} />}
          {view === "support" && <SupportPage go={go} />}
          {view === "exercise" && <ExercisePage go={go} />}
          {view === "settings" && <SettingsPage go={go} name={name} setName={handleName} avatar={avatar} setAvatar={setAvatar} />}
          {view === "booked-sessions" && <BookedSessionsPage go={go} />}
          {view === "address" && <AddressPage go={go} addresses={addresses} setAddresses={setAddresses} />}
        </div>

        {isGlobalLoading && <PageLoader />}

        {/* Chat widget only available after sign-in */}
        {!(["start", "login"] as View[]).includes(view) && <ChatWidget />}
      </div>
    </div>
  );
}

export default function MoodMirror() {
  return (
    <AuthProvider>
      <MoodMirrorInner />
    </AuthProvider>
  );
}
