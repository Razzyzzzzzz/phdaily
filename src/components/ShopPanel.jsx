import { useState } from 'react'
import Panel from './Panel'
import { ITEMS, SHOPS, JOBS, effectText } from '../data/gameData'

export default function ShopPanel({ shopId, money, onBuy, onWork, onClose }) {
  const shop = SHOPS[shopId]
  const [tab, setTab] = useState('Food')
  const job = shop.job && JOBS[shop.job]
  const list = shop.stock.filter((id) => ITEMS[id].cat === tab)
  return (
    <Panel title={`🛒 ${shop.title}`} onClose={onClose}>
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
      <p className="mt-2 text-center font-extrabold text-orange-600">🪙 ₱{Math.round(money).toLocaleString()}</p>
      {job && <button className="btn-blue mt-2 w-full" onClick={onWork}>{job.emoji} Job: {job.name}</button>}
    </Panel>
  )
}
