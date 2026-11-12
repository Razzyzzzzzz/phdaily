import { useEffect, useRef, useState } from 'react'
import { LEARN, learnReward } from '../data/gameData'

/* ---------------- helpers ---------------- */
const rnd = (n) => Math.floor(Math.random() * n)
const shuffle = (a) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = rnd(i + 1)
    const t = b[i]; b[i] = b[j]; b[j] = t
  }
  return b
}
const hashStr = (s) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

const MAX_FILE = 300 * 1024 // bytes
const MAX_LESSON = 20000 // characters
const MAX_Q = 100

/* ---------------- module file format (.txt / .md) ----------------
TITLE: Pangalan ng module
LESSON:
(aralin...)
QUIZ:
Q: Tanong?
- Maling sagot
* Tamang sagot        <- lagyan ng * ang tama
- Maling sagot

Pwede rin: A) B) C) D) tapos "ANS: B" sa dulo ng tanong.
------------------------------------------------------------------- */
const Q_RE = /^(?:Q|Question|Tanong)\s*\d*\s*[:.)]\s*(.+)$/i
const OPT_OK = /^(?:\*|✓|✔)\s*(?:[A-Ha-h][.)]\s*)?(.+)$/
const OPT = /^(?:[A-Ha-h][.)]|[-•])\s*(.+)$/
const ANS = /^(?:ANS|ANSWER|SAGOT)\s*:\s*([A-Ha-h])\b/i
const TITLE = /^TITLE\s*:\s*(.+)$/i

export function parseModule(text, fallbackTitle = 'Module') {
  const lines = String(text).replace(/\r/g, '').split('\n')
  let title = ''
  let mode = 'lesson'
  const lesson = []
  const qs = []
  let cur = null
  let skipped = 0
  const push = () => {
    if (!cur) return
    if (cur.o.length >= 2 && cur.a >= 0 && cur.a < cur.o.length) qs.push({ q: cur.q, o: cur.o.slice(0, 6), a: cur.a })
    else skipped++
    cur = null
  }
  for (const raw of lines) {
    const line = raw.trim()
    let m
    if ((m = line.match(TITLE))) { title = m[1].trim(); continue }
    if (/^(?:LESSON|ARALIN)\s*:?\s*$/i.test(line) && mode === 'lesson') continue
    if (/^(?:QUIZ|PAGSUSULIT)\s*:?\s*$/i.test(line)) { push(); mode = 'quiz'; continue }
    if ((m = line.match(Q_RE))) { push(); mode = 'quiz'; cur = { q: m[1].trim(), o: [], a: -1 }; continue }
    if (mode === 'lesson') {
      if (!title && !lesson.length && (m = line.match(/^#\s+(.+)$/))) { title = m[1].trim(); continue }
      lesson.push(raw.trimEnd())
      continue
    }
    if (!cur || !line) continue
    if ((m = line.match(ANS))) { cur.a = m[1].toUpperCase().charCodeAt(0) - 65; continue }
    if ((m = line.match(OPT_OK))) { cur.o.push(m[1].trim()); cur.a = cur.o.length - 1; continue }
    if ((m = line.match(OPT))) { cur.o.push(m[1].trim()); continue }
    if (!cur.o.length) cur.q += ' ' + line // tuloy ng tanong sa susunod na linya
  }
  push()
  if (qs.length < 3) {
    return { error: `Kailangan ng kahit 3 wastong tanong (nakita: ${qs.length}${skipped ? `, ${skipped} na-skip dahil walang tamang sagot o kulang ang pagpipilian` : ''}). Tingnan ang format sa baba.` }
  }
  const questions = qs.slice(0, MAX_Q)
  const t = (title || fallbackTitle || 'Module').slice(0, 60)
  const id = hashStr(t + '|' + questions.map((q) => q.q).join('|'))
  return {
    module: { id, title: t, lesson: lesson.join('\n').trim().slice(0, MAX_LESSON), questions, added: Date.now() },
    skipped,
  }
}

export const SAMPLE = `TITLE: Sample: Mga Pambansang Sagisag
LESSON:
Ang Pilipinas ay may mga pambansang sagisag na sumisimbolo sa ating bansa.

Pambansang bayani: Jose Rizal
Pambansang bulaklak: Sampaguita
Pambansang prutas: Mangga
Pambansang puno: Narra
Pambansang ibon: Philippine Eagle (Haribon)
Pambansang sayaw: Tinikling
Kabisera ng bansa: Maynila

QUIZ:
Q: Sino ang pambansang bayani ng Pilipinas?
- Andres Bonifacio
* Jose Rizal
- Emilio Aguinaldo
- Apolinario Mabini

Q: Ano ang pambansang bulaklak?
- Rosas
- Gumamela
* Sampaguita
- Santan

Q: Ano ang pambansang prutas?
* Mangga
- Saging
- Pinya
- Papaya

Q: Aling ibon ang pambansang ibon ng Pilipinas?
A) Maya
B) Kalapati
C) Philippine Eagle (Haribon)
D) Loro
ANS: C

Q: Ano ang pambansang sayaw?
- Cariñosa
* Tinikling
- Pandanggo
- Maglalatik
`

const FORMAT_HELP = `TITLE: Pangalan ng module
LESSON:
(isulat o i-paste ang aralin dito)
QUIZ:
Q: Ano ang ...?
- Maling sagot
* Tamang sagot   (lagyan ng *)
- Maling sagot

Pwede rin ang A) B) C) D) at
ANS: B  sa dulo ng tanong.`

const pctText = (v) => `${Math.round((v || 0) * 100)}%`

/* ---------------- component ---------------- */
// props: modules, learn (progress by module id), energy, hunger,
//        notify(msg), onAdd(module), onDelete(id), onFinish(hash, correct, total), onClose()
export default function LearningPanel({ modules = [], learn = {}, energy = 100, hunger = 100, notify, onAdd, onDelete, onFinish, onClose }) {
  const [view, setView] = useState('list') // list | add | module | quiz | result
  const [sel, setSel] = useState(null)
  const [qs, setQs] = useState([])
  const [i, setI] = useState(0)
  const [ok, setOk] = useState(0)
  const [pick, setPick] = useState(null)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const [text, setText] = useState('')
  const alive = useRef(true)
  const fin = useRef(false)
  useEffect(() => () => { alive.current = false }, [])

  const addText = (txt, name) => {
    const r = parseModule(txt, name)
    if (r.error) return setErr(r.error)
    if (!modules.some((m) => m.id === r.module.id) && modules.length >= LEARN.maxModules) return setErr(`Hanggang ${LEARN.maxModules} modules lang. Mag-delete muna ng isa.`)
    onAdd(r.module)
    setErr(''); setText(''); setView('list')
    notify?.(`📂 Na-add: ${r.module.title}${r.skipped ? ` (${r.skipped} tanong na-skip)` : ''}`)
  }
  const onFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > MAX_FILE) return setErr('Masyadong malaki ang file (max 300 KB).')
    try { addText(await f.text(), f.name.replace(/\.[^.]+$/, '')) } catch { setErr('Hindi mabasa ang file.') }
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'sample-module.txt'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const start = (m) => {
    if (energy < LEARN.energy) return notify?.('😴 Too tired! Magpahinga muna.')
    if (hunger < LEARN.hunger) return notify?.('🍽️ Too hungry! Kumain muna.')
    const picked = shuffle(m.questions).slice(0, LEARN.maxQ).map((q) => ({ q: q.q, c: q.o[q.a], o: shuffle(q.o) }))
    fin.current = false
    setSel(m); setQs(picked); setI(0); setOk(0); setPick(null); setRes(null); setView('quiz')
  }
  const answer = (o) => {
    if (pick !== null) return
    setPick(o)
    const n = ok + (o === qs[i].c ? 1 : 0)
    setOk(n)
    setTimeout(() => {
      if (!alive.current) return
      if (i + 1 < qs.length) { setI(i + 1); setPick(null); return }
      if (fin.current) return
      fin.current = true
      const r = learnReward(learn[sel.id], n, qs.length) // preview bago i-apply ng reducer
      setRes({ ...r, correct: n, total: qs.length })
      onFinish(sel.id, n, qs.length)
      setView('result')
    }, 850)
  }

  const back = () => { setErr(''); setView(view === 'result' || view === 'module' ? 'list' : view === 'quiz' ? 'module' : 'list') }
  const titles = { list: '📂 My Learning Modules', add: '➕ Mag-add ng Module', module: `📖 ${sel?.title || ''}`, quiz: `📝 ${sel?.title || ''}`, result: '🏁 Resulta' }
  const stars = res ? (res.pct >= 0.8 ? 3 : res.pct >= 0.6 ? 2 : res.pct > 0 ? 1 : 0) : 0

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/70 p-3" style={{ animation: 'elph-pop .25s both' }}>
      <div className="flex max-h-[92dvh] w-[min(96%,28rem)] flex-col overflow-hidden rounded-3xl border-4 border-blue-700 bg-sky-100 shadow-2xl">
        <div className="flex items-center gap-2 bg-gradient-to-b from-blue-500 to-blue-700 px-3 py-1.5 text-white">
          {view !== 'list' && view !== 'quiz' && <button onClick={back} aria-label="Back" className="rounded-lg border-b-2 border-blue-900 bg-blue-400 px-2 font-extrabold">←</button>}
          <span className="min-w-0 flex-1 truncate font-extrabold">{titles[view]}</span>
          <button onClick={onClose} aria-label="Close" className="rounded-lg border-b-2 border-red-800 bg-red-500 px-2 font-extrabold">✕</button>
        </div>

        <div className="overflow-y-auto p-3">
          {/* ---------- LIST ---------- */}
          {view === 'list' && (
            <div className="space-y-2">
              <button className="btn-green w-full py-2" onClick={() => { setErr(''); setView('add') }}>➕ Mag-upload / Mag-paste ng Module</button>
              {modules.length === 0 && (
                <div className="rounded-xl bg-white p-3 text-center">
                  <p className="font-bold text-slate-600">Wala pang module.</p>
                  <button className="btn-blue mt-2 px-3 py-1" onClick={() => addText(SAMPLE, 'Sample')}>🎁 Subukan ang Sample Module</button>
                </div>
              )}
              <ul className="space-y-2">
                {modules.map((m) => {
                  const p = learn[m.id]
                  return (
                    <li key={m.id} className="rounded-xl bg-white p-2">
                      <div className="flex items-start gap-2">
                        <span className="text-3xl">{p?.perfect ? '🏅' : p?.passed ? '🎓' : '📄'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-extrabold leading-tight">{m.title}</p>
                          <p className="text-xs text-slate-500">{m.questions.length} tanong · Best: {p ? pctText(p.best) : '—'} · Tries: {p?.tries || 0}</p>
                        </div>
                        <button aria-label="Delete" className="px-1 text-lg" onClick={() => { if (window.confirm(`I-delete ang "${m.title}"?`)) onDelete(m.id) }}>🗑️</button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button className="btn-blue py-1" onClick={() => { setSel(m); setView('module') }}>📖 Basahin</button>
                        <button className="btn-green py-1" onClick={() => start(m)}>📝 Quiz</button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p className="rounded-lg bg-amber-100 p-2 text-center text-xs font-bold text-amber-900">
                Bawat quiz: hanggang {LEARN.maxQ} random na tanong · ⚡ -{LEARN.energy} · 🍽️ -{LEARN.hunger}.<br />
                Premyo sa pagbuti ng score (max ₱250 bawat module).
              </p>
            </div>
          )}

          {/* ---------- ADD ---------- */}
          {view === 'add' && (
            <div className="space-y-2">
              <label className="btn-blue block w-full cursor-pointer py-2 text-center">
                📁 Pumili ng file (.txt / .md)
                <input type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" className="hidden" onChange={onFile} />
              </label>
              <p className="text-center text-xs font-bold text-slate-500">o i-paste ang laman ng module dito:</p>
              <textarea className="field h-32 resize-none text-sm" placeholder="TITLE: ..." value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn-green w-full py-2" disabled={!text.trim()} onClick={() => addText(text, 'Pasted module')}>✅ I-add ang na-paste</button>
              {err && <p className="rounded-lg bg-red-100 p-2 text-xs font-bold text-red-700">{err}</p>}
              <div className="rounded-xl bg-white p-2">
                <p className="mb-1 text-sm font-extrabold text-blue-900">Format ng file</p>
                <pre className="whitespace-pre-wrap rounded-lg bg-slate-100 p-2 text-[11px] leading-snug text-slate-700">{FORMAT_HELP}</pre>
                <p className="mt-1 text-[11px] font-bold text-slate-500">Kailangan ng kahit 3 tanong. Hanggang {MAX_Q} tanong at 300 KB bawat file.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-blue py-1" onClick={download}>⬇️ Sample file</button>
                <button className="btn-orange py-1" onClick={() => addText(SAMPLE, 'Sample')}>🎁 Add sample</button>
              </div>
            </div>
          )}

          {/* ---------- MODULE (lesson) ---------- */}
          {view === 'module' && sel && (
            <div className="space-y-2">
              <div className="max-h-[48dvh] overflow-y-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-sm font-bold leading-relaxed text-slate-800">
                {sel.lesson || 'Walang aralin sa file na ito. Diretso na sa quiz!'}
              </div>
              <p className="text-center text-xs font-bold text-slate-500">{sel.questions.length} tanong · Best: {learn[sel.id] ? pctText(learn[sel.id].best) : '—'}</p>
              <button className="btn-green w-full py-3 text-lg" onClick={() => start(sel)}>📝 Simulan ang Quiz <span className="text-sm">(⚡ -{LEARN.energy})</span></button>
            </div>
          )}

          {/* ---------- QUIZ ---------- */}
          {view === 'quiz' && qs[i] && (
            <div>
              <div className="mb-1 flex justify-between text-sm font-extrabold text-blue-900">
                <span>Tanong {i + 1}/{qs.length}</span><span>✅ {ok}</span>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-300">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${(i / qs.length) * 100}%` }} />
              </div>
              <p className="mb-3 rounded-xl bg-white p-3 text-lg font-extrabold leading-snug">{qs[i].q}</p>
              <div className="space-y-2">
                {qs[i].o.map((o, k) => {
                  const cls = pick === null ? 'border-blue-300 bg-white' : o === qs[i].c ? 'border-green-700 bg-green-300' : o === pick ? 'border-red-700 bg-red-300' : 'border-blue-200 bg-white opacity-60'
                  return <button key={k} onClick={() => answer(o)} className={`w-full rounded-xl border-2 px-3 py-2 text-left font-extrabold text-slate-800 active:scale-95 ${cls}`}>{String.fromCharCode(65 + k)}. {o}</button>
                })}
              </div>
            </div>
          )}

          {/* ---------- RESULT ---------- */}
          {view === 'result' && res && (
            <div className="space-y-2 text-center" style={{ animation: 'mg-pop .4s both' }}>
              <p className="text-4xl tracking-widest">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</p>
              <p className="text-3xl font-extrabold text-blue-900">{res.correct}/{res.total} <span className="text-lg">({pctText(res.pct)})</span></p>
              <p className="font-extrabold text-blue-900">{res.perfect ? 'Perfect! Ang galing mo! 🔥' : res.passed ? 'Pasado! Magaling!' : `Kailangan ng ${pctText(LEARN.pass)} para pumasa. Basahin ulit at subukan muli!`}</p>
              <div className="rounded-xl bg-white p-2 font-extrabold text-green-700">
                {res.money > 0 ? `🪙 +₱${res.money}` : 'Walang dagdag na premyo (mas mataas na score lang ang may dagdag).'}
                {res.firstPass && <p className="text-xs text-slate-600">🎓 Unang pasa: +₱50 at +1 sa Level progress</p>}
                {res.firstPerfect && <p className="text-xs text-slate-600">🏅 Unang perfect: +₱100</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-blue py-2" onClick={() => setView('list')}>📂 Modules</button>
                <button className="btn-green py-2" onClick={() => start(sel)}>🔁 Ulitin</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}