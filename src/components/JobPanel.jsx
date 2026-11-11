import { useEffect, useRef, useState } from 'react'
import Panel from './Panel'
import { JOBS } from '../data/gameData'

const CSS = `
@keyframes job-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes job-dash{from{transform:translateX(0)}to{transform:translateX(-96px)}}
@keyframes job-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes job-slide{from{transform:translateX(-60px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes job-fly{0%{transform:translate(0,0) scale(.6);opacity:1}85%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0}}
@keyframes job-pop{0%{transform:translateY(0) scale(.6);opacity:0}20%{opacity:1}100%{transform:translateY(-70px) scale(1.2);opacity:0}}
@keyframes job-rise{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
`
const SCENE = {
  cashier: { items: ['🥫', '🧃', '🍞', '🧴', '🍫', '🥤'], people: ['👩', '👨', '👵', '👦', '🧑', '👧'] },
  rider: { items: ['📦', '📮', '🍔', '💐'], people: ['🙋‍♀️', '🙋‍♂️', '👵', '🧑‍🦱'] },
  restaurant: { items: ['🍲', '🍛', '🍗', '🥘', '🍜'], people: ['👩', '👨', '👴', '👧', '🧑'] },
}
const SHELF_A = ['🥫', '🧃', '🍞', '🧴', '🍫', '🥤', '🍿', '🧂']
const SHELF_B = ['🥤', '🍫', '🧴', '🍞', '🧃', '🥫', '🍪', '🧂']
const TOWN = ['🏠', '🌴', '🏢', '🏘️', '🌳', '🏬', '🏠', '🌴']

function Scene({ id, job, taps, last }) {
  const sc = SCENE[id]
  const next = sc.items[taps % sc.items.length]
  const person = sc.people[taps % sc.people.length]
  const coin = Math.round(job.pay / job.taps)
  const fly = (dx, dy, cls) => last && (
    <div key={'f' + last.n} className={`absolute text-5xl ${cls}`} style={{ '--dx': dx, '--dy': dy, animation: 'job-fly .5s ease-in forwards' }}>{last.item}</div>
  )
  const coinPop = (cls) => last && (
    <div key={'c' + last.n} className={`absolute text-2xl font-extrabold text-yellow-300 ${cls}`} style={{ animation: 'job-pop .9s ease-out forwards', textShadow: '0 2px 0 #854d0e' }}>+₱{coin}</div>
  )

  if (id === 'cashier') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-amber-200 to-amber-400">
        <div className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-red-600 px-4 py-0.5 font-extrabold text-white">🏪 Sari-Sari Store</div>
        {[[SHELF_A, 10], [SHELF_B, 28]].map(([row, t]) => (
          <div key={t} className="absolute inset-x-0 flex justify-around border-b-8 border-amber-800 text-3xl sm:text-5xl" style={{ top: `${t}%` }}>
            {row.map((e, i) => <span key={i}>{e}</span>)}
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 h-[30%] border-t-8 border-amber-900 bg-amber-700" />
        <div key={'p' + taps} className="absolute bottom-[28%] left-[10%] text-7xl sm:text-8xl" style={{ animation: 'job-slide .4s ease-out' }}>{person}</div>
        <div className="absolute bottom-[52%] left-[8%] rounded-2xl bg-white px-3 py-1 text-3xl shadow">{next}</div>
        <div className="absolute bottom-[28%] right-[12%] text-7xl sm:text-8xl" style={{ animation: last ? 'job-bob .3s' : undefined }}>🧑‍💼</div>
        <div className="absolute bottom-[28%] right-[30%] text-5xl">🧾</div>
        {fly('45vw', '0px', 'bottom-[34%] left-[18%]')}
        {coinPop('bottom-[52%] right-[14%]')}
      </div>
    )
  }
  if (id === 'rider') {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-sky-100">
        <div className="absolute left-[8%] top-[8%] text-6xl">☁️</div>
        <div className="absolute right-[15%] top-[16%] text-5xl">☁️</div>
        <div className="absolute bottom-[32%] left-0 flex w-[200%] text-6xl sm:text-8xl" style={{ animation: 'job-scroll 14s linear infinite' }}>
          {[0, 1].map((k) => <div key={k} className="flex w-1/2 justify-around">{TOWN.map((e, i) => <span key={i}>{e}</span>)}</div>)}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[32%] overflow-hidden bg-slate-600">
          <div className="absolute left-0 top-1/2 h-2 w-[200%]" style={{ background: 'repeating-linear-gradient(90deg,#fde047 0 48px,transparent 48px 96px)', animation: 'job-dash .4s linear infinite' }} />
        </div>
        <div className="absolute bottom-[24%] left-[20%] text-7xl sm:text-8xl" style={{ animation: 'job-bob .5s ease-in-out infinite' }}>🛵</div>
        <div className="absolute bottom-[32%] right-[6%] text-7xl sm:text-8xl">🏠</div>
        <div key={'p' + taps} className="absolute bottom-[32%] right-[22%] text-5xl" style={{ animation: 'job-slide .4s ease-out' }}>{person}</div>
        <div className="absolute bottom-[58%] right-[18%] rounded-2xl bg-white px-3 py-1 text-3xl shadow">{next}</div>
        {fly('50vw', '-6vh', 'bottom-[36%] left-[26%]')}
        {coinPop('bottom-[52%] right-[8%]')}
      </div>
    )
  }
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-orange-200 to-orange-400">
      <div className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-red-700 px-4 py-0.5 font-extrabold text-white">🍽️ Karinderya</div>
      <div className="absolute inset-x-0 top-[12%] flex justify-around border-b-8 border-orange-900 text-4xl sm:text-6xl"><span>🍳</span><span>🥘</span><span>🫕</span><span>🥣</span><span>🍳</span></div>
      <div className="absolute inset-x-0 bottom-0 h-[30%] border-t-8 border-orange-950 bg-orange-800" />
      <div className="absolute bottom-[28%] left-[10%] text-7xl sm:text-8xl" style={{ animation: last ? 'job-bob .3s' : undefined }}>🧑‍🍳</div>
      <div className="absolute bottom-[28%] left-[28%] text-5xl">🔥</div>
      <div key={'p' + taps} className="absolute bottom-[28%] right-[10%] text-7xl sm:text-8xl" style={{ animation: 'job-slide .4s ease-out' }}>{person}</div>
      <div className="absolute bottom-[52%] right-[8%] rounded-2xl bg-white px-3 py-1 text-3xl shadow">{next}</div>
      {fly('42vw', '0px', 'bottom-[34%] left-[20%]')}
      {coinPop('bottom-[52%] right-[24%]')}
    </div>
  )
}

export default function JobPanel({ here, state, notify, onComplete, onClose }) {
  const [phase, setPhase] = useState('list') // list | work | done
  const [id, setId] = useState(null)
  const [taps, setTaps] = useState(0)
  const [last, setLast] = useState(null)
  const finishing = useRef(false)
  const timer = useRef()
  const job = id ? JOBS[id] : null

  useEffect(() => () => clearTimeout(timer.current), [])

  const start = (jid) => {
    const j = JOBS[jid]
    if (state.energy < j.energy) return notify('😴 Too tired! Sleep or drink coffee first.')
    if (state.hunger < j.hunger) return notify('🍽️ Too hungry! Eat something first.')
    finishing.current = false
    setId(jid); setTaps(0); setLast(null); setPhase('work')
  }
  const tap = () => {
    if (phase !== 'work' || finishing.current) return
    const n = taps + 1
    const items = SCENE[id].items
    setTaps(n)
    setLast({ n, item: items[taps % items.length] })
    if (n >= job.taps) {
      finishing.current = true
      timer.current = setTimeout(() => { onComplete(id); setPhase('done') }, 700)
    }
  }
  useEffect(() => {
    if (phase !== 'work') return
    const h = (e) => { if (e.code === 'Space') { e.preventDefault(); tap() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  if (phase === 'list') {
    return (
      <Panel title="💼 Jobs" onClose={onClose}>
        <ul className="space-y-2">
          {Object.entries(JOBS).map(([jid, j]) => (
            <li key={jid} className="flex items-center gap-3 rounded-xl bg-white p-2">
              <span className="text-4xl">{j.emoji}</span>
              <div className="flex-1">
                <p className="font-extrabold leading-tight">{j.name}</p>
                <p className="text-xs text-slate-500">📍 {j.place}</p>
                <p className="text-xs font-bold">₱{j.pay} · ⚡ -{j.energy} · 🍽️ -{j.hunger}</p>
              </div>
              {here === jid
                ? <button className="btn-green px-3 py-1" onClick={() => start(jid)}>Work</button>
                : <span className="max-w-[5.5rem] text-right text-xs font-bold text-slate-400">Go to {j.place}</span>}
            </li>
          ))}
        </ul>
      </Panel>
    )
  }

  const canAgain = state.energy >= job.energy && state.hunger >= job.hunger
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-900">
      <style>{CSS}</style>
      <div className="flex items-center justify-between bg-slate-900/90 px-3 py-2 text-white">
        <span className="font-extrabold">{job.emoji} {job.name} — {job.place}</span>
        <button className="btn-red px-3 py-1" onClick={() => { clearTimeout(timer.current); setPhase('list') }}>✕</button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <Scene id={id} job={job} taps={taps} last={last} />
        {phase === 'done' && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/60 p-4">
            <div className="w-[min(92%,22rem)] rounded-2xl border-4 border-blue-700 bg-sky-100 p-4 text-center shadow-2xl" style={{ animation: 'job-rise .4s ease-out' }}>
              <p className="text-5xl">✅</p>
              <p className="text-2xl font-extrabold text-blue-900">Shift complete!</p>
              <p className="my-2 text-3xl font-extrabold text-green-700">+₱{job.pay}</p>
              <p className="mb-3 text-sm font-bold text-slate-600">⚡ -{job.energy} · 🍽️ -{job.hunger}</p>
              <div className="space-y-2">
                <button className="btn-green w-full" disabled={!canAgain} onClick={() => start(id)}>{canAgain ? '🔁 Work again' : '😴 Too tired or hungry'}</button>
                <button className="btn-blue w-full" onClick={onClose}>Done</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="bg-slate-900/90 p-3">
        <div className="mb-2 h-4 overflow-hidden rounded-full bg-slate-700">
          <div className="h-full bg-green-400 transition-all" style={{ width: `${(taps / job.taps) * 100}%` }} />
        </div>
        <button className="btn-orange w-full py-4 text-2xl" disabled={phase !== 'work'} onClick={tap}>
          {SCENE[id].items[taps % SCENE[id].items.length]} {job.task} ({taps}/{job.taps})
        </button>
      </div>
    </div>
  )
}