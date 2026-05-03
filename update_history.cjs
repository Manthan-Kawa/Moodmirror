const fs = require('fs');
let code = fs.readFileSync('src/components/MoodMirror.tsx', 'utf8');

// 1. Add journals state to HistoryPage
const historyStateTarget = `function HistoryPage({ go }: { go: (v: View) => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [rawLogs, setRawLogs] = useState<any[]>([]);`;
const historyStateReplacement = `function HistoryPage({ go }: { go: (v: View) => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [rawLogs, setRawLogs] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);`;
code = code.replace(historyStateTarget, historyStateReplacement);

// 2. Add fetch journals to useEffect in HistoryPage
const historyEffectTarget = `      setRawLogs(logs);
      // Map logs to past 7 days`;
const historyEffectReplacement = `      setRawLogs(logs);
      getJournals(user.id, 5).then((dbJournals) => setJournals(dbJournals || []));
      // Map logs to past 7 days`;
code = code.replace(historyEffectTarget, historyEffectReplacement);

// 3. Update the MOOD JOURNAL section
const journalSectionTarget = `      {/* Mood Journal */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-2xl p-5 mb-6 animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "0.9s" }}>
        <h3 className="text-white/50 text-xs font-bold tracking-wider uppercase mb-4">MOOD JOURNAL</h3>
        <div className="space-y-3">
          <div className="bg-[#12121c] rounded-xl p-4 border-l-4 border-l-teal-400 animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "1.0s" }}>
            <p className="text-white/60 text-xs mb-1">Thursday</p>
            <p className="text-white text-sm">Great session. Energy high after morning walk.</p>
          </div>
          <div className="bg-[#12121c] rounded-xl p-4 border-l-4 border-l-purple-500 animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "1.1s" }}>
            <p className="text-white/60 text-xs mb-1">Saturday</p>
            <p className="text-white text-sm">Time with family. Best mood this week.</p>
          </div>
          <div className="bg-[#12121c] rounded-xl p-4 border-l-4 border-l-red-500 animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "1.2s" }}>
            <p className="text-white/60 text-xs mb-1">Tuesday</p>
            <p className="text-white text-sm">Skipped physio. Feeling low, need better sleep.</p>
          </div>
        </div>
      </div>`;

const journalSectionReplacement = `      {/* Mood Journal */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-2xl p-5 mb-6 animate-[fadeUp_0.6s_ease-out_forwards]" style={{ opacity: 0, animationDelay: "0.9s" }}>
        <h3 className="text-white/50 text-xs font-bold tracking-wider uppercase mb-4">MOOD JOURNAL</h3>
        <div className="space-y-3">
          {journals.length === 0 ? (
            <p className="text-white/40 text-sm">No journal entries found. Go to the Journal page to write one!</p>
          ) : (
            journals.map((j, i) => {
              const date = new Date(j.ts);
              const dayName = date.toLocaleDateString("en-US", { weekday: 'long' });
              const colors = ["border-l-teal-400", "border-l-purple-500", "border-l-red-500", "border-l-indigo-400"];
              return (
                <div key={j.id} className={\`bg-[#12121c] rounded-xl p-4 border-l-4 \${colors[i % colors.length]} animate-[fadeUp_0.6s_ease-out_forwards]\`} style={{ opacity: 0, animationDelay: \`\${1.0 + i * 0.1}s\` }}>
                  <p className="text-white/60 text-xs mb-1">{dayName} - {date.toLocaleDateString()}</p>
                  <p className="text-white text-sm whitespace-pre-wrap">{j.text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>`;
code = code.replace(journalSectionTarget, journalSectionReplacement);

fs.writeFileSync('src/components/MoodMirror.tsx', code);
