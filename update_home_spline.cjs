const fs = require('fs');
let code = fs.readFileSync('src/components/MoodMirror.tsx', 'utf8');

// 1. Update Home component signature
const homeTarget = `function Home({ name, go }: { name: string; go: (v: View) => void }) {`;
const homeReplacement = `function Home({ name, go, onLoadComplete }: { name: string; go: (v: View) => void; onLoadComplete?: () => void }) {`;
code = code.replace(homeTarget, homeReplacement);

// 2. Add onLoad to the Spline component in Home
const splineTarget = `<Spline
                  scene="https://prod.spline.design/yIB0EIiPHLV-xBVn/scene.splinecode"
                  style={{ width: "100%", height: "100%" }}
                />`;
const splineReplacement = `<Spline
                  scene="https://prod.spline.design/yIB0EIiPHLV-xBVn/scene.splinecode"
                  style={{ width: "100%", height: "100%" }}
                  onLoad={() => {
                    if (onLoadComplete) onLoadComplete();
                  }}
                />`;
code = code.replace(splineTarget, splineReplacement);

// 3. Update MoodMirrorInner variables
const varsTarget = `  const [transitioning, setTransitioning] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  // Name derives from Supabase profile if available, otherwise from local state
  const [name, setName] = useState("Alex");`;
const varsReplacement = `  const [transitioning, setTransitioning] = useState(false);
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
  const [name, setName] = useState("Alex");`;
code = code.replace(varsTarget, varsReplacement);

// 4. Update go function logic
const goTarget = `  // ── go must be declared first so effects below can use it ──
  const go = useCallback((v: View) => {
    const isAfterLogin = !UNAUTH_VIEWS.includes(v);

    if (isAfterLogin) {
      setIsGlobalLoading(true);
      setTransitioning(true);

      // Fixed 1.5s delay for any authenticated page transitions
      setTimeout(() => {
        setView(v);
        setPrevView(v);
        setTransitioning(false);
        setIsGlobalLoading(false);
        try {
          localStorage.setItem("mm_view", v);
        } catch { }
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }, 1500);
    } else {`;
const goReplacement = `  // ── go must be declared first so effects below can use it ──
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
    } else {`;
code = code.replace(goTarget, goReplacement);

// 5. Update Home prop passing
const viewTarget = `{view === "home" && <Home name={name} go={go} />}`;
const viewReplacement = `{view === "home" && <Home name={name} go={go} onLoadComplete={handleHomeSplineLoad} />}`;
code = code.replace(viewTarget, viewReplacement);

fs.writeFileSync('src/components/MoodMirror.tsx', code);
