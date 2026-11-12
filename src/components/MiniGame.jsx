import { useEffect, useRef, useState } from 'react'

const rnd = (n) => Math.floor(Math.random() * n)
const shuffle = (a) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = rnd(i + 1)
    const t = b[i]; b[i] = b[j]; b[j] = t
  }
  return b
}

/* ---------------- quiz banks ---------------- */
const PINOY = [
  { q: 'Sino ang pambansang bayani ng Pilipinas?', o: ['Jose Rizal', 'Andres Bonifacio', 'Emilio Aguinaldo', 'Apolinario Mabini'], a: 0 },
  { q: 'Ano ang pambansang prutas?', o: ['Mangga', 'Saging', 'Pinya', 'Papaya'], a: 0 },
  { q: 'Ano ang pambansang bulaklak?', o: ['Rosas', 'Sampaguita', 'Gumamela', 'Santan'], a: 1 },
  { q: 'Ano ang pambansang ibon?', o: ['Maya', 'Kalapati', 'Agila (Haribon)', 'Loro'], a: 2 },
  { q: 'Ano ang pambansang puno?', o: ['Narra', 'Mahogany', 'Niyog', 'Acacia'], a: 0 },
  { q: 'Ano ang pambansang sayaw?', o: ['Cariñosa', 'Tinikling', 'Pandanggo', 'Maglalatik'], a: 1 },
  { q: 'Ano ang pinakamataas na bundok sa Pilipinas?', o: ['Mt. Mayon', 'Mt. Pulag', 'Mt. Apo', 'Mt. Pinatubo'], a: 2 },
  { q: 'Ano ang kabisera ng Pilipinas?', o: ['Quezon City', 'Maynila', 'Cebu', 'Davao'], a: 1 },
  { q: 'Ilan ang bituin sa watawat ng Pilipinas?', o: ['2', '3', '5', '8'], a: 1 },
  { q: 'Kailan ipinagdiriwang ang Araw ng Kalayaan?', o: ['Hunyo 12', 'Agosto 21', 'Enero 1', 'Disyembre 30'], a: 0 },
  { q: 'Ano ang tawag sa Pasko sa gabi bago ang Noche Buena na misa?', o: ['Simbang Gabi', 'Flores de Mayo', 'Santacruzan', 'Pahiyas'], a: 0 },
  { q: 'Ano ang tawag sa tradisyunal na laro na may lata at tsinelas?', o: ['Tumbang Preso', 'Piko', 'Luksong Tinik', 'Sipa'], a: 0 },
]
const SCHOOL = [
  { q: '12 × 3 = ?', o: ['32', '36', '38', '24'], a: 1 },
  { q: '15 + 27 = ?', o: ['41', '43', '42', '52'], a: 2 },
  { q: 'Ano ang pinakamalaking planeta sa solar system?', o: ['Mars', 'Jupiter', 'Saturn', 'Earth'], a: 1 },
  { q: 'Ano ang kemikal na simbolo ng tubig?', o: ['CO2', 'O2', 'H2O', 'NaCl'], a: 2 },
  { q: 'Ano ang square root ng 81?', o: ['7', '8', '9', '10'], a: 2 },
  { q: 'Anong gas ang kinukuha ng halaman sa hangin?', o: ['Oxygen', 'Carbon dioxide', 'Helium', 'Hydrogen'], a: 1 },
  { q: 'Ilang minuto ang nasa 2 oras?', o: ['90', '100', '120', '150'], a: 2 },
  { q: '100 ÷ 4 = ?', o: ['20', '25', '30', '40'], a: 1 },
]
const prep = (x) => ({ q: x.q, o: shuffle(x.o), c: x.o[x.a] })
const sukli = () => {
  const price = 15 + rnd(17) * 5
  const paid = shuffle([50, 100, 200].filter((p) => p > price))[0]
  const ans = paid - price
  const wrong = shuffle([ans + 5, ans - 5, ans + 10, ans - 10, ans + 20].filter((v) => v > 0)).slice(0, 3)
  return { q: `Bayad ₱${paid}, presyo ₱${price}. Magkano ang sukli?`, o: shuffle([ans, ...wrong].map((v) => `₱${v}`)), c: `₱${ans}` }
}

/* ---------------- TAP ---------------- */
function TapGame({ cfg, emoji, done }) {
  const target = cfg.target || 20
  const total = (cfg.time || 6) * 1000
  const [n, setN] = useState(0)
  const [left, setLeft] = useState(total)
  const [started, setStarted] = useState(false)
  const over = useRef(false)

  useEffect(() => {
    if (!started) return
    const t0 = Date.now()
    const id = setInterval(() => setLeft(Math.max(0, total - (Date.now() - t0))), 80)
    return () => clearInterval(id)
  }, [started, total])

  useEffect(() => {
    if (over.current) return
    if (n >= target || (started && left <= 0)) { over.current = true; done(Math.min(1, n / target)) }
  }, [n, left, started])

  const tap = () => { if (over.current) return; setStarted(true); setN((v) => v + 1) }
  const ref = useRef(tap)
  ref.current = tap
  useEffect(() => {
    const h = (e) => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) ref.current() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-extrabold text-blue-900">
        <span>{n}/{target}</span><span>⏱ {(left / 1000).toFixed(1)}s</span>
      </div>
      <div className="mb-1 h-3 overflow-hidden rounded-full bg-slate-300">
        <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.min(100, (n / target) * 100)}%` }} />
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-300">
        <div className="h-full bg-orange-400" style={{ width: `${(left / total) * 100}%` }} />
      </div>
      <button className="btn-orange w-full py-6 text-5xl" onPointerDown={tap}>{emoji}</button>
      <p className="mt-1 text-xs font-bold text-slate-500">{started ? 'Bilis!' : 'Pindutin para magsimula (o Space)'}</p>
    </div>
  )
}

/* ---------------- TIMING ---------------- */
function TimingGame({ cfg, emoji, done }) {
  const rounds = cfg.rounds || 5
  const [r, setR] = useState(0)
  const [pts, setPts] = useState(0)
  const [pos, setPos] = useState(0)
  const [fb, setFb] = useState('')
  const [zone, setZone] = useState(() => 0.2 + Math.random() * 0.6)
  const posRef = useRef(0)
  const roundRef = useRef(0)
  const over = useRef(false)
  const W = 0.2 // laki ng zone

  useEffect(() => {
    let raf
    const t0 = performance.now()
    const loop = (t) => {
      const speed = 0.0009 * (1 + roundRef.current * 0.22)
      const x = ((t - t0) * speed) % 2
      const p = x < 1 ? x : 2 - x
      posRef.current = p
      setPos(p)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const press = () => {
    if (over.current) return
    const d = Math.abs(posRef.current - zone)
    const p = d <= W / 2 ? 1 : d <= W ? 0.5 : 0
    setFb(p === 1 ? 'Perfect! 🎯' : p ? 'Okay 👍' : 'Miss ❌')
    const np = pts + p
    const nr = r + 1
    setPts(np); setR(nr); roundRef.current = nr
    if (nr >= rounds) { over.current = true; setTimeout(() => done(np / rounds), 600) }
    else setZone(0.2 + Math.random() * 0.6)
  }
  const ref = useRef(press)
  ref.current = press
  useEffect(() => {
    const h = (e) => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) ref.current() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-extrabold text-blue-900">
        <span>Tira {Math.min(r + 1, rounds)}/{rounds}</span><span>⭐ {pts.toFixed(1)}</span>
      </div>
      <div className="relative mb-2 h-10 overflow-hidden rounded-full border-2 border-slate-400 bg-slate-200">
        <div className="absolute inset-y-0 bg-green-400/80" style={{ left: `${(zone - W / 2) * 100}%`, width: `${W * 100}%` }} />
        <div className="absolute inset-y-0 w-2 -translate-x-1/2 rounded bg-red-600" style={{ left: `${pos * 100}%` }} />
      </div>
      <p className="mb-2 h-6 text-lg font-extrabold text-blue-900" key={r} style={{ animation: 'mg-pop .35s both' }}>{fb}</p>
      <button className="btn-green w-full py-4 text-3xl" onPointerDown={press}>{emoji} Ngayon!</button>
    </div>
  )
}

/* ---------------- MEMORY ---------------- */
function MemoryGame({ cfg, done }) {
  const pool = cfg.pool || ['🍅', '🧅', '🧄', '🌶️']
  const len = cfg.length || 4
  const [seq] = useState(() => Array.from({ length: len }, () => pool[rnd(pool.length)]))
  const [shown, setShown] = useState(-1)
  const [phase, setPhase] = useState('show')
  const [got, setGot] = useState(0)
  const [bad, setBad] = useState(false)
  const over = useRef(false)

  useEffect(() => {
    const ts = []
    seq.forEach((_, i) => {
      ts.push(setTimeout(() => setShown(i), 700 + i * 900))
      ts.push(setTimeout(() => setShown(-1), 700 + i * 900 + 600))
    })
    ts.push(setTimeout(() => setPhase('input'), 700 + len * 900))
    return () => ts.forEach(clearTimeout)
  }, [])

  const pick = (e) => {
    if (phase !== 'input' || over.current) return
    if (e !== seq[got]) { over.current = true; setBad(true); setTimeout(() => done(got / len), 700); return }
    const n = got + 1
    setGot(n)
    if (n >= len) { over.current = true; setTimeout(() => done(1), 500) }
  }

  return (
    <div>
      <div className="mb-3 grid h-24 place-items-center rounded-2xl border-4 border-sky-700 bg-white text-6xl">
        {phase === 'show'
          ? (shown >= 0 ? <span key={shown} style={{ animation: 'mg-pop .35s both' }}>{seq[shown]}</span> : <span className="text-base font-extrabold text-slate-400">Tandaan...</span>)
          : <span className={`text-base font-extrabold ${bad ? 'text-red-600' : 'text-blue-900'}`} style={bad ? { animation: 'mg-shake .4s' } : undefined}>{bad ? 'Mali! ❌' : `Ulitin: ${got}/${len}`}</span>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {pool.map((e) => (
          <button key={e} disabled={phase !== 'input'} onPointerDown={() => pick(e)} className="btn-blue py-3 text-3xl">{e}</button>
        ))}
      </div>
    </div>
  )
}

/* ---------------- QUIZ ---------------- */
function QuizGame({ cfg, done }) {
  const count = cfg.count || 3
  const [qs] = useState(() => cfg.topic === 'sukli'
    ? Array.from({ length: count }, () => sukli())
    : shuffle(cfg.topic === 'school' ? SCHOOL : PINOY).slice(0, count).map(prep))
  const [i, setI] = useState(0)
  const [ok, setOk] = useState(0)
  const [pick, setPick] = useState(null)
  const q = qs[i]

  const answer = (o) => {
    if (pick) return
    setPick(o)
    const n = ok + (o === q.c ? 1 : 0)
    setOk(n)
    setTimeout(() => {
      if (i + 1 >= qs.length) done(n / qs.length)
      else { setI(i + 1); setPick(null) }
    }, 800)
  }

  return (
    <div>
      <p className="mb-1 text-sm font-extrabold text-blue-900">Tanong {i + 1}/{qs.length} · ✅ {ok}</p>
      <p className="mb-3 rounded-xl bg-white p-3 text-lg font-extrabold">{q.q}</p>
      <div className="grid grid-cols-2 gap-2">
        {q.o.map((o) => {
          const cls = !pick ? 'border-blue-300 bg-white' : o === q.c ? 'border-green-700 bg-green-300' : o === pick ? 'border-red-700 bg-red-300' : 'border-blue-200 bg-white opacity-60'
          return <button key={o} onPointerDown={() => answer(o)} className={`rounded-xl border-2 px-2 py-3 font-extrabold text-slate-800 active:scale-95 ${cls}`}>{o}</button>
        })}
      </div>
    </div>
  )
}

/* ---------------- PICK A BOX ---------------- */
function PickGame({ cfg, done }) {
  const [prizes] = useState(() => shuffle(cfg.prizes || [0, 30, 200]))
  const [sel, setSel] = useState(null)
  const best = Math.max(...prizes)
  const pick = (i) => {
    if (sel !== null) return
    setSel(i)
    const p = prizes[i]
    setTimeout(() => done(p >= best && p > 0 ? 1 : p > 0 ? 0.5 : 0, { prize: p }), 1100)
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {prizes.map((p, i) => (
        <button key={i} onPointerDown={() => pick(i)} disabled={sel !== null}
          className={`grid h-24 place-items-center rounded-2xl border-4 text-4xl ${sel === null ? 'border-pink-500 bg-pink-200' : i === sel ? 'border-yellow-500 bg-yellow-200' : 'border-slate-300 bg-slate-100 opacity-70'}`}
          style={sel === i ? { animation: 'mg-pop .4s both' } : undefined}>
          {sel === null ? '🎁' : <span className="text-lg font-extrabold">{p ? `₱${p}` : '💨'}</span>}
        </button>
      ))}
    </div>
  )
}

const GAMES = { tap: TapGame, timing: TimingGame, memory: MemoryGame, quiz: QuizGame, pick: PickGame }
const MSG = ['Sayang! Subukan ulit.', 'Pwede na!', 'Magaling!', 'Ang galing mo! 🔥']

/**
 * act: activity from ACTIVITIES (must have act.game)
 * preview(res) -> string describing the rewards for the result screen
 * onFinish(res) -> { score: 0..1, prize? } ; onCancel() -> closes without applying anything
 */
export default function MiniGame({ act, preview, onFinish, onCancel }) {
  const cfg = act.game
  const [phase, setPhase] = useState('intro') // intro | play | result
  const [res, setRes] = useState(null)
  const Game = GAMES[cfg.type]
  const stars = res ? (res.score >= 0.8 ? 3 : res.score >= 0.5 ? 2 : res.score > 0 ? 1 : 0) : 0
  const finish = (score, extra = {}) => { setRes({ score, ...extra }); setPhase('result') }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/70 p-3" style={{ animation: 'elph-pop .25s both' }}>
      <div className="w-[min(94%,24rem)] overflow-hidden rounded-3xl border-4 border-blue-700 bg-sky-100 shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-b from-blue-500 to-blue-700 px-4 py-1.5 text-white">
          <span className="font-extrabold">{act.emoji} {act.name}</span>
          {phase !== 'result' && <button onClick={onCancel} aria-label="Close" className="rounded-lg border-b-2 border-red-800 bg-red-500 px-2 font-extrabold">✕</button>}
        </div>
        <div className="p-4 text-center">
          {phase === 'intro' && (
            <>
              <p className="text-6xl">{act.emoji}</p>
              <p className="mt-1 font-bold text-slate-700">{act.text}</p>
              <p className="my-2 rounded-xl bg-white p-2 text-sm font-bold text-blue-900">🎮 {cfg.label}</p>
              <p className="mb-3 text-xs font-bold text-slate-500">Mas mataas ang score, mas malaki ang gantimpala.</p>
              <button className="btn-green w-full py-3 text-xl" onClick={() => setPhase('play')}>▶ Simulan</button>
            </>
          )}
          {phase === 'play' && <Game cfg={cfg} emoji={act.emoji} done={finish} />}
          {phase === 'result' && (
            <div style={{ animation: 'mg-pop .4s both' }}>
              <p className="text-4xl tracking-widest">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</p>
              <p className="mt-1 text-2xl font-extrabold text-blue-900">{MSG[stars]}</p>
              <p className="my-2 rounded-xl bg-white p-2 font-extrabold text-green-700">{preview(res) || 'Walang premyo'}</p>
              <button className="btn-green w-full py-3 text-xl" onClick={() => onFinish(res)}>✅ Kunin</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}