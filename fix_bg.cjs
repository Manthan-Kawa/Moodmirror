const fs = require('fs');
let code = fs.readFileSync('src/components/MoodMirror.tsx', 'utf8');

// Replace dark hex background colors with transparent so the global background shows through
code = code.replace(/backgroundColor: "#060a12"/g, 'backgroundColor: "transparent"');
code = code.replace(/bg-\\[#050508\\]/g, 'bg-transparent');
code = code.replace(/bg-\\[#06060e\\]/g, 'bg-[#050508]'); // The global background should be the dark base, everything else transparent

// Remove the hardcoded background from Home
let homeBg = `<div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulseGlow_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full mix-blend-screen animate-[pulseGlow_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-violet-500/10 blur-[100px] rounded-full mix-blend-screen animate-[pulseGlow_6s_ease-in-out_infinite]" />
      </div>`;
code = code.replace(homeBg, '');

// Inject the global background into MoodMirrorInner
let globalBg = `{!(["start", "login"].includes(view)) && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 fixed">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulseGlow_8s_ease-in-out_infinite]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full mix-blend-screen animate-[pulseGlow_10s_ease-in-out_infinite_reverse]" />
            <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-violet-500/10 blur-[100px] rounded-full mix-blend-screen animate-[pulseGlow_6s_ease-in-out_infinite]" />
          </div>
        )}`;

code = code.replace('{showNav && <Navbar', globalBg + '\n\n        {showNav && <Navbar');

fs.writeFileSync('src/components/MoodMirror.tsx', code);
