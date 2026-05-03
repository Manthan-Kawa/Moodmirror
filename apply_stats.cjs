const fs = require('fs');
let code = fs.readFileSync('src/components/MoodMirror.tsx', 'utf8');

// 1. Add stats state and update useEffect
const stateTarget = `const [showMore, setShowMore] = useState(false);`;
const stateReplacement = `const [showMore, setShowMore] = useState(false);
  const [stats, setStats] = useState<any>({
    activeVideoId: null,
    sessionsCompleted: 0,
    minutesWatched: 0,
    streakDays: 0,
    lastActiveDate: null,
    weekDays: [false, false, false, false, false, false, false]
  });`;
code = code.replace(stateTarget, stateReplacement);

const effectTarget = `  useEffect(() => {
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
  }, [user]);`;

const effectReplacement = `  useEffect(() => {
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
  }, [user]);`;
code = code.replace(effectTarget, effectReplacement);

// 2. Update handleStartSession and handleEndSession
const startSessionTarget = `  const handleStartSession = (vid: any) => {
    setActiveVideo(vid);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (user) saveExerciseState(user.id, vid.id.toString());
  };`;

const startSessionReplacement = `  const handleStartSession = (vid: any) => {
    setActiveVideo(vid);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (user) {
      const newStats = { ...stats, activeVideoId: vid.id.toString() };
      setStats(newStats);
      saveExerciseState(user.id, newStats);
    }
  };`;
code = code.replace(startSessionTarget, startSessionReplacement);

const endSessionTarget = `  const handleEndSession = () => {
    setActiveVideo(null);
    if (user) saveExerciseState(user.id, null);
  };`;

const endSessionReplacement = `  const handleEndSession = () => {
    setActiveVideo(null);
    if (user && activeVideo) {
      const minMatch = activeVideo.tags.find((t: string) => t.includes("min"));
      const minutes = minMatch ? parseInt(minMatch) : 0;
      
      const dayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
      const newWeekDays = [...(stats.weekDays || [false,false,false,false,false,false,false])];
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
  };`;
code = code.replace(endSessionTarget, endSessionReplacement);

// 3. Update UI variables
const uiStreakTarget = `<div className="font-bold text-xl mb-1" style={{ color: "#8b5cf6" }}>12-day streak</div>`;
const uiStreakReplacement = `<div className="font-bold text-xl mb-1" style={{ color: "#8b5cf6" }}>{stats.streakDays || 0}-day streak</div>`;
code = code.replace(uiStreakTarget, uiStreakReplacement);

const uiGoalTarget = `<span className="font-bold text-purple-400">4/6 Sessions</span>`;
const uiGoalReplacement = `<span className="font-bold text-purple-400">{Math.min(stats.sessionsCompleted || 0, 12)}/12 Sessions</span>`;
code = code.replace(uiGoalTarget, uiGoalReplacement);

const uiProgressTarget = `<div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: "67%", backgroundColor: "#a855f7" }}></div>`;
const uiProgressReplacement = `<div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: \`\${Math.min(((stats.sessionsCompleted || 0) / 12) * 100, 100)}%\`, backgroundColor: "#a855f7" }}></div>`;
code = code.replace(uiProgressTarget, uiProgressReplacement);

const uiDaysTarget = `                {[
                  { day: "M", done: true },
                  { day: "T", done: true },
                  { day: "W", done: false },
                  { day: "T", done: true },
                  { day: "F", done: true },
                  { day: "S", done: false },
                  { day: "S", done: false },
                ].map((d, i) => (`.trim();

const uiDaysReplacement = `                {[
                  { day: "M", done: stats?.weekDays?.[0] || false },
                  { day: "T", done: stats?.weekDays?.[1] || false },
                  { day: "W", done: stats?.weekDays?.[2] || false },
                  { day: "T", done: stats?.weekDays?.[3] || false },
                  { day: "F", done: stats?.weekDays?.[4] || false },
                  { day: "S", done: stats?.weekDays?.[5] || false },
                  { day: "S", done: stats?.weekDays?.[6] || false },
                ].map((d, i) => (`;
code = code.replace(uiDaysTarget, uiDaysReplacement);

const uiSessionsTarget = `<span className="text-2xl font-extrabold mb-1 text-violet-400">24</span>`;
const uiSessionsReplacement = `<span className="text-2xl font-extrabold mb-1 text-violet-400">{stats.sessionsCompleted || 0}</span>`;
code = code.replace(uiSessionsTarget, uiSessionsReplacement);

const uiMinutesTarget = `<span className="text-2xl font-extrabold mb-1 text-purple-400">340</span>`;
const uiMinutesReplacement = `<span className="text-2xl font-extrabold mb-1 text-purple-400">{stats.minutesWatched || 0}</span>`;
code = code.replace(uiMinutesTarget, uiMinutesReplacement);

fs.writeFileSync('src/components/MoodMirror.tsx', code);
