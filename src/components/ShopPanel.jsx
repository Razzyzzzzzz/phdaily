import { useState } from 'react'
import Panel from './Panel'
import MiniGame from './MiniGame'
import { ITEMS, SHOPS, JOBS, ACTIVITIES, effectText } from '../data/gameData'

const fx = (a) =>
  [
    a.cost && `🪙 -₱${a.cost}`,
    a.money && `🪙 +₱${a.money}`,
    a.energy && `⚡ ${a.energy > 0 ? '+' : ''}${a.energy}`,
    a.hunger && `🍽️ ${a.hunger > 0 ? '+' : ''}${a.hunger}`,
    a.health && `❤️ ${a.health > 0 ? '+' : ''}${a.health}`,
    a.give && Object.entries(a.give).map(([id, q]) => `${ITEMS[id]?.emoji || '🎁'} ×${q}`).join(' '),
  ].filter(Boolean).join('  ')

// Apply the mini-game score: positive rewards scale 0.4x (bad) .. 1.2x (perfect). Costs / effort stay the same.
const settle = (a, res) => {
  const m = 0.4 + 0.8 * res.score
  const sc = (v) => (v > 0 ? Math.round(v * m) : v)
  const out = { ...a, money: res.prize != null ? res.prize : sc(a.money || 0), health: sc(a.health || 0), energy: sc(a.energy || 0), hunger: sc(a.hunger || 0) }
  if (a.give) out.give = Object.fromEntries(Object.entries(a.give).map(([id, q]) => [id, Math.max(1, Math.round(q * (0.5 + 0.5 * res.score)))]))
  return out
}

// onActivity(placeId, activity): App must apply the deltas (see ACTIVITIES in gameData.js)
// onLearn(): App opens LearningPanel (upload ng module + quiz)
export default function ShopPanel({ shopId, money, energy = 100, hunger = 100, onBuy, onWork, onActivity, onLearn, onClose }) {
  const shop = SHOPS[shopId]
  const [tab, setTab] = useState('Food')
  const [game, setGame] = useState(null)
  if (!shop) return null
  const job = shop.job && JOBS[shop.job]
  const acts = ACTIVITIES[shopId] || []
  const stock = shop.stock || []
  const list = stock.filter((id) => ITEMS[id]?.cat === tab)
  return (
    <Panel title={`${shop.icon || '🛒'} ${shop.title}`} onClose={onClose}>
      <div className="max-h-[62dvh] overflow-y-auto">
        {acts.length > 0 && (
          <ul className="mb-2 space-y-2 rounded-xl bg-sky-100 p-2">
            {acts.map((a) => {
              const tired = a.energy < 0 && energy + a.energy < 0
              const hungry = a.hunger < 0 && hunger + a.hunger < 0
              const broke = money < (a.cost || 0)
              const why = broke ? 'Not enough money' : tired ? 'Too tired' : hungry ? 'Too hungry' : ''
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-lg bg-white p-2">
                  <span className="text-3xl">{a.emoji}</span>
                  <div className="flex-1">
                    <p className="font-extrabold leading-tight">{a.name} {a.game && <span className="rounded-full bg-purple-200 px-1.5 text-[10px] font-extrabold text-purple-800">🎮 Mini-game</span>}{a.learn && <span className="rounded-full bg-emerald-200 px-1.5 text-[10px] font-extrabold text-emerald-800">🎓 Upload</span>}</p>
                    <p className="text-xs text-slate-500">{a.text}</p>
                    <p className="text-xs font-bold text-slate-600">{fx(a)}</p>
                    {why && <p className="text-xs font-bold text-red-600">{why}</p>}
                  </div>
                  <button className="btn-green px-3 py-1" disabled={a.learn ? !onLearn : !!why || !onActivity}
                    onClick={() => (a.learn ? onLearn() : a.game ? setGame(a) : onActivity(shopId, a))}>{a.learn ? 'Open' : a.game ? 'Play' : 'Do'}</button>
                </li>
              )
            })}
          </ul>
        )}
        {stock.length > 0 && (
          <>
            <div className="mb-2 flex gap-2">
              {['Food', 'Items'].map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-full border-2 py-1 font-extrabold ${tab === t ? 'border-orange-600 bg-yellow-400' : 'border-blue-300 bg-blue-200 text-blue-800'}`}>{t}</button>
              ))}
            </div>
            <ul className="space-y-2 rounded-xl bg-amber-100 p-2">
              {list.map((id) => (
                <li key={id} className="flex items-center gap-3 rounded-lg bg-amber-50 p-2">
                  <span className="text-3xl">{ITEMS[id].emoji}</span>
                  <div className="flex-1">
                    <p className="font-extrabold">{ITEMS[id].name}</p>
                    <p className="text-xs text-slate-500">₱{ITEMS[id].price} · {effectText(ITEMS[id])}</p>
                  </div>
                  <button className="btn-green px-4 py-1" disabled={money < ITEMS[id].price} onClick={() => onBuy(id)}>Buy</button>
                </li>
              ))}
              {!list.length && <li className="p-3 text-center text-slate-500">Nothing here.</li>}
            </ul>
          </>
        )}
        <p className="mt-2 text-center font-extrabold text-orange-600">🪙 ₱{Math.round(money).toLocaleString()}</p>
        {job && <button className="btn-blue mt-2 w-full" onClick={onWork}>{job.emoji} Job: {job.name}</button>}
      </div>
      {game && (
        <MiniGame
          act={game}
          preview={(res) => fx({ ...settle(game, res), cost: 0 })}
          onCancel={() => setGame(null)}
          onFinish={(res) => { onActivity?.(shopId, settle(game, res)); setGame(null) }}
        />
      )}
    </Panel>
  )
}