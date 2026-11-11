import { useState } from 'react'
import Panel from './Panel'
import { ITEMS, effectText } from '../data/gameData'

export default function InventoryPanel({ inventory, onUse, onDrop, onClose }) {
  const [sel, setSel] = useState(null)
  const entries = Object.entries(inventory)
  const slots = Math.max(9, Math.ceil(entries.length / 3) * 3)
  const picked = sel && inventory[sel] ? sel : null
  return (
    <Panel title="🎒 Inventory" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: slots }, (_, i) => {
          const e = entries[i]
          return (
            <button key={i} disabled={!e} onClick={() => setSel(e[0])}
              className={`relative grid h-20 place-items-center rounded-xl border-2 bg-sky-200 text-4xl ${e && picked === e[0] ? 'border-yellow-400 ring-2 ring-yellow-300' : 'border-blue-300'}`}>
              {e && <><span>{ITEMS[e[0]].emoji}</span><span className="absolute bottom-0.5 right-1.5 text-sm font-extrabold">x{e[1]}</span></>}
            </button>
          )
        })}
      </div>
      <p className="mt-3 min-h-[2.5rem] text-center text-sm font-bold text-blue-900">
        {picked ? `${ITEMS[picked].name} — ${effectText(ITEMS[picked])}` : entries.length ? 'Tap an item.' : 'Empty. Buy food at the stores!'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-blue" disabled={!picked} onClick={() => onUse(picked)}>Use</button>
        <button className="btn-red" disabled={!picked} onClick={() => onDrop(picked)}>Drop</button>
      </div>
    </Panel>
  )
}
