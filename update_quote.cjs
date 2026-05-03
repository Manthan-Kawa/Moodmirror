const fs = require('fs');
let code = fs.readFileSync('src/components/MoodMirror.tsx', 'utf8');

const quotesArray = `const HISTORY_QUOTES = [
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
];\n\n`;

// Insert array right before function HistoryPage
code = code.replace('function HistoryPage({ go }: { go: (v: View) => void }) {', quotesArray + 'function HistoryPage({ go }: { go: (v: View) => void }) {');

// Insert states into HistoryPage
const historyStateTarget = `  const [journals, setJournals] = useState<any[]>([]);`;
const historyStateReplacement = `  const [journals, setJournals] = useState<any[]>([]);
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
  }, [quoteText, isDeletingQuote, quoteIdx]);`;
code = code.replace(historyStateTarget, historyStateReplacement);

// Replace quote render
const quoteRenderTarget = `        <div>
          <p className="text-white italic">"You don't have to be positive all the time. It's okay to feel what you feel."</p>
          <p className="text-white/50 text-xs mt-1">— Lori Deschene</p>
        </div>`;
const quoteRenderReplacement = `        <div className="flex-1 min-h-[4rem] flex flex-col justify-center">
          <p className="text-white italic flex">
            <span>"{quoteText}"</span>
            <span className="w-[2px] h-[1em] ml-1 bg-pink-400 animate-pulse inline-block self-center" />
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
        </div>`;
code = code.replace(quoteRenderTarget, quoteRenderReplacement);

fs.writeFileSync('src/components/MoodMirror.tsx', code);
