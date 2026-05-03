const fs = require('fs');
let code = fs.readFileSync('src/components/MoodMirror.tsx', 'utf8');

const neuralBgComponent = `
function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number, y: number, vx: number, vy: number, radius: number, color: string }[] = [];
    const colors = ['#00e5c0', '#a855f7', '#6366f1'];
    let animationFrameId: number;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const init = () => {
      particles = [];
      const num = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < num; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 0.5,
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
            ctx.globalAlpha = 1 - (dist / 120);
            ctx.lineWidth = 0.5;
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
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#020108]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#12051f]/40 via-[#020108] to-[#041a2a]/30" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#6366f1]/10 blur-[120px] rounded-full mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#c084fc]/10 blur-[150px] rounded-full mix-blend-screen" />
      <canvas ref={canvasRef} className="absolute inset-0 opacity-70" />
    </div>
  );
}
`;

code = code.replace('function MoodMirrorInner', neuralBgComponent + '\\nfunction MoodMirrorInner');

const oldBg = \`{!(["start", "login"].includes(view)) && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 fixed">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulseGlow_8s_ease-in-out_infinite]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full mix-blend-screen animate-[pulseGlow_10s_ease-in-out_infinite_reverse]" />
            <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-violet-500/10 blur-[100px] rounded-full mix-blend-screen animate-[pulseGlow_6s_ease-in-out_infinite]" />
          </div>
        )}\`;

code = code.replace(oldBg, '{!(["start", "login"].includes(view)) && <NeuralBackground />}');

code = code.replace(/bg-\\[#050508\\]/g, 'bg-[#020108]');

fs.writeFileSync('src/components/MoodMirror.tsx', code);
