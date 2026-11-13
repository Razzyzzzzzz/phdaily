import { useEffect, useState } from 'react'
import Panel from './Panel'
import { MISSIONS } from '../data/gameData'
import {
  DAILY_BY_ID, DAILY_BONUS, dailyProgress, LOGIN_REWARDS, ACHIEVEMENTS, COLLECTIBLES,
  eventState, eventProgress, fmtMs, rewardText,
} from '../data/progression'

const TABS = [['daily', '📅 Daily'], ['event', '🎉 Event'], ['login', '🎁 Login'], ['ach', '🏅 Awards'], ['hunt', '💎 Hunt']]

function Row({ icon, text, sub, reward, cur, goal, claimed, onClaim, label = '→' }) {
  const done = cur >= goal
  return (
    <li className="flex items-center gap-2 rounded-xl bg-white p-2">
      <span className="text-3xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">{text}</p>
        {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(100, (cur / goal) * 100)}%` }} /></div>
        <p className="text-[11px] font-bold text-slate-500">{cur} / {goal} · {rewardText(reward)}</p>
      </div>
      {claimed ? <span className="w-9 text-center text-xl">✅</span>
        : <button type="button" className="btn-blue px-3 py-1" disabled={!done} onClick={onClaim}>{label}</button>}
    </li>
  )
}

// One panel for every "things to do" list. `tab` = which tab opens first.
// props: state, dispatch (the game reducer), onGo(placeId) to travel, onClose
export default function QuestsPanel({ state, dispatch, tab = 'daily', onGo, onClose }) {
  const [t, setT] = useState(tab)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])

  const daily = state.daily
  const allClaimed = daily && daily.ids.every((id) => daily.claimed[id])
  const loginReady = state.login.last && state.login.claimed !== state.login.last
  const ev = eventState(now)
  const mine = state.events[ev.slot]
  const joined = !!mine && mine.evId === ev.ev.id
  const [ecur, egoal] = joined ? eventProgress(state, ev.slot, ev.ev.id) : [0, ev.ev.goal]
  const claimable = MISSIONS.filter((m) => !state.claimed[m.id] && m.done(state)).length

  return (
    <Panel title="🏆 Quests & Rewards" onClose={onClose}>
      <div className="mb-2 flex gap-1 overflow-x-auto">
        {TABS.map(([id, l]) => (
          <button key={id} type="button" onClick={() => setT(id)} className={`shrink-0 rounded-lg px-2 py-1 text-xs font-extrabold ${t === id ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-800'}`}>{l}</button>
        ))}
      </div>

      <div className="max-h-[56dvh] overflow-y-auto">
        {t === 'daily' && (
          <ul className="space-y-2">
            {(daily?.ids || []).map((id) => {
              const q = DAILY_BY_ID[id], [cur, goal] = dailyProgress(state, id)
              return <Row key={id} icon={q.icon} text={q.text} reward={q.reward} cur={cur} goal={goal} claimed={!!daily.claimed[id]} onClaim={() => dispatch({ type: 'DAILY_CLAIM', id })} />
            })}
            <li className="flex items-center gap-2 rounded-xl bg-yellow-100 p-2">
              <span className="text-3xl">🎁</span>
              <p className="flex-1 text-sm font-bold">Tapusin lahat ng daily quest<br /><span className="text-[11px] text-slate-600">{rewardText(DAILY_BONUS)}</span></p>
              {daily?.bonus ? <span className="text-xl">✅</span>
                : <button type="button" className="btn-green px-3 py-1" disabled={!allClaimed} onClick={() => dispatch({ type: 'DAILY_BONUS' })}>Claim</button>}
            </li>
            <li className="px-1 pt-1 text-center text-[11px] font-bold text-slate-500">Nagre-reset ang daily quests tuwing hatinggabi (oras mo).</li>
            <li className="pt-2 text-sm font-extrabold text-blue-900">📜 Mga Mission {claimable > 0 && <span className="text-orange-600">· {claimable} na pwedeng i-claim</span>}</li>
            {MISSIONS.map((m) => {
              const [cur, goal] = m.prog ? m.prog(state) : [m.done(state) ? 1 : 0, 1]
              return <Row key={m.id} icon={m.icon} text={m.text} reward={{ money: m.reward, xp: 40 }} cur={cur} goal={goal} claimed={!!state.claimed[m.id]} onClaim={() => dispatch({ type: 'CLAIM', id: m.id })} />
            })}
          </ul>
        )}

        {t === 'event' && (
          <div className="space-y-2">
            <div className={`rounded-2xl p-3 text-center ${ev.live ? 'bg-orange-200' : 'bg-white'}`}>
              <p className="text-5xl">{ev.ev.icon}</p>
              <p className="text-lg font-extrabold">{ev.ev.name}</p>
              <p className="text-sm font-bold text-slate-600">{ev.ev.text}</p>
              <p className={`mt-1 text-sm font-extrabold ${ev.live ? 'text-orange-700' : 'text-blue-700'}`}>
                {ev.live ? `🔴 LIVE · ${fmtMs(ev.msLeft)} na lang` : `Magsisimula sa ${fmtMs(ev.msToStart)}`}
              </p>
              <p className="text-xs font-bold text-slate-500">Premyo: {rewardText(ev.ev.reward)}</p>
            </div>
            {ev.live && !joined && !mine && <button type="button" className="btn-green w-full py-2" onClick={() => dispatch({ type: 'EVENT_JOIN', now: Date.now() })}>🎟️ Sumali sa event</button>}
            {joined && (
              <>
                <Row icon={ev.ev.icon} text={ev.ev.text} reward={ev.ev.reward} cur={ecur} goal={egoal} claimed={mine.claimed} onClaim={() => dispatch({ type: 'EVENT_CLAIM', slot: ev.slot, now: Date.now() })} label="Claim" />
                <p className="text-center text-[11px] font-bold text-slate-500">Pwede mong i-claim hanggang matapos ang 30-minutong slot.</p>
              </>
            )}
            {onGo && <button type="button" className="btn-blue w-full py-2" onClick={() => { onGo(ev.ev.where); onClose?.() }}>📍 Pumunta sa event</button>}
          </div>
        )}

        {t === 'login' && (
          <div className="space-y-2">
            <p className="text-center text-sm font-extrabold text-blue-900">🔥 Login streak: {state.login.streak || 0} araw</p>
            <div className="grid grid-cols-4 gap-1.5">
              {LOGIN_REWARDS.map((r, i) => {
                const day = i + 1, cur = ((Math.max(1, state.login.streak) - 1) % 7) + 1
                const got = day < cur || (day === cur && !loginReady)
                return (
                  <div key={day} className={`rounded-xl p-1.5 text-center ${day === cur && loginReady ? 'bg-yellow-300 ring-2 ring-orange-500' : got ? 'bg-green-200' : 'bg-white'}`}>
                    <p className="text-[10px] font-extrabold text-slate-500">Day {day}</p>
                    <p className="text-2xl">{got ? '✅' : r.icon}</p>
                    <p className="text-[10px] font-bold leading-tight">₱{r.reward.money}{r.reward.gems ? ` +💎${r.reward.gems}` : ''}</p>
                  </div>
                )
              })}
            </div>
            <button type="button" className="btn-green w-full py-2 disabled:opacity-40" disabled={!loginReady} onClick={() => dispatch({ type: 'LOGIN_CLAIM' })}>
              {loginReady ? '🎁 Claim today\'s reward' : '✅ Nakuha mo na ngayong araw'}
            </button>
          </div>
        )}

        {t === 'ach' && (
          <ul className="space-y-2">
            {ACHIEVEMENTS.map((a) => {
              const [cur, goal] = a.prog(state)
              return <Row key={a.id} icon={a.icon} text={a.text} reward={a.reward} cur={cur} goal={goal} claimed={!!state.ach[a.id]} onClaim={() => dispatch({ type: 'ACH_CLAIM', id: a.id })} />
            })}
          </ul>
        )}

        {t === 'hunt' && (
          <ul className="space-y-2">
            <li className="rounded-xl bg-white p-2 text-center text-sm font-extrabold">💎 {Object.keys(state.collected).length} / {COLLECTIBLES.length} nahanap</li>
            {COLLECTIBLES.map((c) => {
              const got = !!state.collected[c.id]
              return (
                <li key={c.id} className="flex items-center gap-2 rounded-xl bg-white p-2">
                  <span className="text-3xl">{got ? c.icon : '❔'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{got ? c.name : c.secret ? 'Sikretong collectible' : 'Hindi pa nahahanap'}</p>
                    <p className="text-[11px] text-slate-500">{got ? rewardText(c.reward) : `Clue: ${c.clue}`}</p>
                  </div>
                  {got ? <span className="text-xl">✅</span>
                    : onGo && !c.secret && <span className="text-[11px] font-bold text-slate-400">Maglakad at hanapin</span>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Panel>
  )
}
