import Title from './Title'
import CharacterPreview from './CharacterPreview'

// ---------- background art (pure SVG/CSS, walang image files) ----------
const Cloud = ({ top, size = 1, duration, delay }) => (
  <div className="absolute left-0" style={{ top, animation: `elph-drift ${duration}s linear ${delay}s infinite`, transform: `scale(${size})` }}>
    <div className="relative h-9 w-28 rounded-full bg-white/90">
      <div className="absolute -top-4 left-5 h-9 w-14 rounded-full bg-white/90" />
      <div className="absolute -top-2 left-14 h-7 w-12 rounded-full bg-white/90" />
    </div>
  </div>
)

function Palm({ className, delay = 0 }) {
  return (
    <svg viewBox="0 0 130 230" className={`absolute ${className}`} style={{ transformOrigin: '50% 100%', animation: `elph-sway 5s ease-in-out ${delay}s infinite alternate` }}>
      <path d="M60 230 Q68 150 62 74 L72 74 Q80 150 74 230 Z" fill="#7c4a21" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <rect key={i} x="62" y={90 + i * 16} width="12" height="3" fill="#5a3416" opacity="0.6" />)}
      {[-105, -75, -45, -15, 15, 45, 75, 105].map((a, i) => (
        <ellipse key={a} cx="67" cy="46" rx="9" ry="38" transform={`rotate(${a} 67 74)`} fill={i % 2 ? '#2b8a3e' : '#37b24d'} />
      ))}
      <circle cx="61" cy="80" r="6" fill="#7c4a21" />
      <circle cx="74" cy="82" r="6" fill="#7c4a21" />
    </svg>
  )
}

function Jeep({ color = '#ef476f' }) {
  return (
    <svg viewBox="0 0 112 50" width="120" height="54">
      <ellipse cx="56" cy="46" rx="50" ry="4" fill="#000" opacity="0.2" />
      <rect x="0" y="12" width="112" height="28" rx="6" fill={color} />
      <rect x="8" y="4" width="92" height="10" fill={color} />
      <rect x="6" y="2" width="96" height="4" fill="#fff" opacity="0.35" />
      <rect x="0" y="30" width="112" height="4" fill="#fcd116" />
      <rect x="0" y="35" width="112" height="2" fill="#fff" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={10 + i * 20} y="16" width="15" height="11" fill="#bfe9ff" />)}
      <rect x="92" y="16" width="12" height="11" fill="#bfe9ff" />
      <rect x="108" y="26" width="4" height="5" fill="#fff3a0" />
      <circle cx="26" cy="40" r="8" fill="#111" /><circle cx="26" cy="40" r="3" fill="#9ca3af" />
      <circle cx="88" cy="40" r="8" fill="#111" /><circle cx="88" cy="40" r="3" fill="#9ca3af" />
    </svg>
  )
}

const Bird = ({ top, duration, delay, size = 1 }) => (
  <div className="absolute left-0" style={{ top, animation: `elph-fly ${duration}s linear ${delay}s infinite` }}>
    <svg viewBox="0 0 40 16" width={34 * size} height={14 * size} style={{ animation: 'elph-flap 0.45s ease-in-out infinite alternate', transformOrigin: '50% 100%' }}>
      <path d="M2 12 Q11 -2 20 10 Q29 -2 38 12" fill="none" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </div>
)

const Butterfly = ({ left, bottom, color, delay }) => (
  <div className="absolute" style={{ left, bottom, animation: `elph-float 6s ease-in-out ${delay}s infinite alternate` }}>
    <span className="block text-xl" style={{ filter: `drop-shadow(0 0 4px ${color})` }}>🦋</span>
  </div>
)

function Scene() {
  return (
    <div className="elph-anim pointer-events-none absolute inset-0 overflow-hidden">
      {/* araw */}
      <div className="absolute right-[8%] top-[8%] h-24 w-24 sm:h-28 sm:w-28">
        <div className="absolute -inset-5 rounded-full border-4 border-dashed border-yellow-200/60" style={{ animation: 'elph-spin 60s linear infinite' }} />
        <div className="absolute -inset-2 animate-pulse rounded-full bg-yellow-200/50" />
        <div className="absolute inset-0 rounded-full bg-yellow-300 shadow-[0_0_40px_10px_rgba(253,224,71,0.55)]" />
      </div>
      <Bird top="16%" duration={28} delay={-6} />
      <Bird top="20%" duration={28} delay={-4.5} size={0.7} />
      <Bird top="12%" duration={40} delay={-22} size={0.9} />
      {/* mga ulap */}
      <Cloud top="10%" duration={70} delay={-10} />
      <Cloud top="22%" size={0.8} duration={95} delay={-55} />
      <Cloud top="6%" size={1.2} duration={120} delay={-90} />
      <Cloud top="30%" size={0.6} duration={80} delay={-30} />
      {/* bundok */}
      <svg viewBox="0 0 1200 220" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[20%] h-40 w-full sm:h-56">
        <path d="M0 220 L0 120 L150 30 L300 130 L460 50 L620 140 L780 40 L960 140 L1100 70 L1200 130 L1200 220 Z" fill="#8cc2ae" />
        <path d="M0 220 L0 160 L120 100 L260 170 L420 110 L580 180 L740 110 L900 175 L1060 120 L1200 170 L1200 220 Z" fill="#5fa38e" />
      </svg>
      {/* lupa */}
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-b from-green-400 to-green-500" />
      {/* kalsada */}
      <div className="absolute inset-x-0 bottom-[5%] h-12 bg-slate-600">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#fcd116 0 36px,transparent 36px 72px)' }} />
      </div>
      <div className="absolute bottom-[calc(5%+6px)] left-0" style={{ animation: 'elph-drive 22s linear infinite' }}><Jeep color="#ef476f" /></div>
      <div className="absolute bottom-[calc(5%+2px)] left-0" style={{ animation: 'elph-drive 34s linear -14s infinite' }}><Jeep color="#06d6a0" /></div>
      <Butterfly left="22%" bottom="24%" color="#f472b6" delay={0} />
      <Butterfly left="72%" bottom="27%" color="#fde047" delay={-2} />
      <Butterfly left="46%" bottom="22%" color="#60a5fa" delay={-4} />
      {/* puno ng niyog */}
      <Palm className="bottom-[14%] left-[2%] h-56 sm:h-80" />
      <Palm className="bottom-[16%] left-[13%] hidden h-40 sm:block" delay={1.2} />
      <Palm className="bottom-[15%] right-[3%] h-60 sm:h-80" delay={0.6} />
      <Palm className="bottom-[17%] right-[14%] hidden h-44 sm:block" delay={1.8} />
    </div>
  )
}

export default function MainMenu({ user, look, onPlay, onCreate, onSettings, onExit }) {
  const pop = (i) => ({ animation: `elph-pop 0.5s ${0.25 + i * 0.1}s both` })
  const hover = 'transition hover:-translate-y-0.5 hover:brightness-110'
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden bg-gradient-to-b from-sky-400 via-sky-200 to-green-200 p-4">
      <Scene />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <Title />
        <div className="elph-anim flex items-center gap-4 rounded-3xl bg-gradient-to-b from-white/45 to-white/20 p-4 shadow-2xl ring-2 ring-white/60 backdrop-blur-md">
          <div className="flex flex-col items-center">
            <CharacterPreview look={look} className="h-56 w-36 cursor-grab active:cursor-grabbing sm:h-72 sm:w-52" />
            <p className="-mt-1 max-w-[9rem] truncate rounded-full border-2 border-white/70 bg-blue-900 px-4 py-0.5 text-sm font-extrabold text-white shadow-md">{user}</p>
            <p className="mt-1 text-[10px] font-bold text-blue-900/70">✋ Drag to rotate</p>
          </div>
          <div className="flex w-56 flex-col gap-3">
            <button className={`btn-orange py-3 text-2xl ${hover}`} style={{ animation: `elph-pop 0.5s 0.25s both, elph-pulse 2.2s 1s infinite` }} onClick={onPlay}>▶ Play</button>
            <button className={`btn-blue ${hover}`} style={pop(1)} onClick={onCreate}>🧑 Character Creator</button>
            <button className={`btn-blue ${hover}`} style={pop(2)} onClick={onSettings}>⚙️ Settings</button>
            <button className={`btn-red ${hover}`} style={pop(3)} onClick={onExit}>🚪 Exit</button>
          </div>
        </div>
        <p className="rounded-full bg-white/70 px-4 py-0.5 text-sm font-bold text-blue-900 shadow">Logged in as {user}</p>
      </div>
    </div>
  )
}