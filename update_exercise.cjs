const fs = require('fs');
let code = fs.readFileSync('src/components/MoodMirror.tsx', 'utf8');
let s = code.indexOf('function ExercisePage({ go }');
let e = code.indexOf('// ── Support');
const newCode = `function ExercisePage({ go }: { go: (v: View) => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [animKey, setAnimKey] = useState(0);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

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
      id: 4, accent: "#a78bdb", embed: "https://www.youtube.com/embed/bpakjE-x7-c", level: "Intermediate",
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
    { id: 9, accent: "#8b5cf6", embed: "https://www.youtube.com/embed/K-1sP84b3iU", level: "Beginner", name: "Neck & Shoulders", desc: "Relieve tech neck — by Yoga With Adriene", tags: ["15 min", "50 cal", "6 poses"], btnBg: "#8b5cf6", btnText: "#000000", steps: ["Neck Rolls", "Eagle Arms"], summary: "Quick relief for tension carried in the upper body." },
    { id: 10, accent: "#f5a623", embed: "https://www.youtube.com/embed/hJbRpHZr_d0", level: "Advanced", name: "Power Vinyasa", desc: "High intensity flow — by Travis Eliot", tags: ["45 min", "250 cal", "25 poses"], btnBg: "#f5a623", btnText: "#000000", steps: ["Chaturanga", "Crow Pose"], summary: "A challenging, sweaty power yoga flow." },
    { id: 11, accent: "#a78bdb", embed: "https://www.youtube.com/embed/LqXZ628YNj4", level: "Intermediate", name: "Yoga for Back Pain", desc: "Strengthen and heal — by Yoga With Adriene", tags: ["30 min", "120 cal", "15 poses"], btnBg: "#a78bdb", btnText: "#000000", steps: ["Cat-Cow", "Sphinx Pose"], summary: "Gentle strengthening and stretching for the spine." },
    { id: 12, accent: "#8b5cf6", embed: "https://www.youtube.com/embed/4pKly2JojMw", level: "Beginner", name: "Total Body Yoga", desc: "Deep stretch for beginners — by Yoga With Adriene", tags: ["45 min", "150 cal", "20 poses"], btnBg: "#8b5cf6", btnText: "#000000", steps: ["Mountain Pose", "Downward Dog"], summary: "A comprehensive total body flow accessible for all levels." }
  ];

  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [activeTab, showMore]);

  useEffect(() => {
    if (user) {
      getExerciseState(user.id).then(id => {
        if (id) {
          const v = YOGA_VIDEOS.find(x => x.id.toString() === id);
          if (v) setActiveVideo(v);
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
    if (user) saveExerciseState(user.id, vid.id.toString());
  };

  const handleEndSession = () => {
    setActiveVideo(null);
    if (user) saveExerciseState(user.id, null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/50">Loading sessions...</div>;

  if (activeVideo) {
    return (
      <div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center mm-page-enter bg-transparent">
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8 animate-[fadeUp_0.5s_ease-out]">
          <button onClick={handleEndSession} className="text-sm flex items-center gap-2 mb-6 text-white/50 hover:text-white transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Library
          </button>
          
          <div className="rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.15)] mb-8" style={{ border: \`1px solid \${activeVideo.accent}40\` }}>
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
                  <span className="text-xs font-bold tracking-wide px-3 py-1 rounded-full uppercase" style={{ backgroundColor: \`\${activeVideo.accent}20\`, color: activeVideo.accent }}>{activeVideo.level}</span>
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
                  <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: \`\${activeVideo.accent}20\`, color: activeVideo.accent }}>
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
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">Yoga Sessions</h1>
          <p className="text-lg" style={{ color: "#4a6070" }}>Find your balance, build your strength</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 backdrop-blur-md" style={{ backgroundColor: "rgba(17,24,39,0.7)", border: "0.5px solid rgba(139,92,246,0.3)", borderRadius: "13px", animation: "fadeUp 0.5s ease-out 0.1s both" }}>
            <div className="flex-1 flex items-center gap-4">
              <span className="text-4xl animate-pulse">🔥</span>
              <div>
                <div className="font-bold text-xl mb-1" style={{ color: "#8b5cf6" }}>12-day streak</div>
                <div className="text-sm text-white/60">Keep it up! You're doing great.</div>
              </div>
            </div>
            <div className="hidden sm:block h-16 w-px" style={{ backgroundColor: "rgba(139,92,246,0.3)" }}></div>
            <div className="w-full sm:w-px h-px sm:h-0 sm:hidden" style={{ backgroundColor: "rgba(139,92,246,0.3)" }}></div>
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white/60">Weekly Goal</span>
                <span className="font-bold text-purple-400">4/6 Sessions</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(168, 85, 247, 0.2)" }}>
                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: "67%", backgroundColor: "#a855f7" }}></div>
              </div>
            </div>
          </div>

          <div className="p-6 flex flex-col xl:flex-row gap-6 items-center backdrop-blur-md" style={{ backgroundColor: "rgba(17,24,39,0.7)", border: "0.5px solid rgba(139,92,246,0.3)", borderRadius: "13px", animation: "fadeUp 0.5s ease-out 0.2s both" }}>
            <div className="flex-1 w-full">
              <h4 className="text-xs font-bold mb-4 tracking-widest uppercase text-white/60">This Week</h4>
              <div className="flex justify-between">
                {[
                  { day: "M", done: true },
                  { day: "T", done: true },
                  { day: "W", done: false },
                  { day: "T", done: true },
                  { day: "F", done: true },
                  { day: "S", done: false },
                  { day: "S", done: false },
                ].map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110" style={{
                      backgroundColor: d.done ? "#8b5cf6" : "transparent",
                      border: d.done ? "none" : "0.5px solid rgba(139,92,246,0.3)"
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
                <span className="text-2xl font-extrabold mb-1 text-violet-400">24</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">Sessions</span>
              </div>
              <div className="flex-1 xl:w-28 p-3 rounded-xl flex flex-col items-center justify-center transition-colors hover:bg-white/10" style={{ backgroundColor: "rgba(10,21,32,0.5)", border: "0.5px solid rgba(139,92,246,0.3)" }}>
                <span className="text-2xl font-extrabold mb-1 text-purple-400">340</span>
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
                animation: \`fadeUp 0.5s ease-out \${0.3 + i * 0.05}s both\`,
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
                animation: \`fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) \${i * 0.1}s both\`
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
                    backgroundColor: \`\${vid.accent}20\`,
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
`;
code = code.substring(0, s) + newCode + "\n" + code.substring(e);
fs.writeFileSync('src/components/MoodMirror.tsx', code);
