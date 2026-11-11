import { useState } from 'react'
import Avatar from './Avatar'
import { HAIRS, OUTFITS } from '../data/gameData'

function Picker({ label, text, onPrev, onNext }) {
  return (
    <div>
      <p className="text-sm font-extrabold text-blue-900">{label}</p>
      <div className="flex items-center gap-2">
        <button className="btn-blue px-3 py-1" onClick={onPrev}>‹</button>
        <span className="flex-1 rounded-lg bg-white py-1 text-center font-bold">{text}</span>
        <button className="btn-blue px-3 py-1" onClick={onNext}>›</button>
      </div>
    </div>
  )
}

export default function CharacterCreation({ defaultName, onCreate, onBack }) {
  const [name, setName] = useState(defaultName)
  const [gender, setGender] = useState('male')
  const [hair, setHair] = useState(0)
  const [outfit, setOutfit] = useState(0)
  const look = { skin: '#f1c27d', hair: '#3b2417', hairStyle: hair, shirt: OUTFITS[outfit], gender }
  const cycle = (v, n, d) => (v + d + n) % n

  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-b from-sky-400 to-sky-200 p-3">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border-4 border-blue-700 bg-sky-100 shadow-2xl">
        <div className="bg-gradient-to-b from-blue-500 to-blue-700 px-4 py-2 text-center text-lg font-extrabold text-white">👕 Create Your Character</div>
        <div className="flex gap-4 p-4">
          <div className="flex items-center scale-110"><Avatar look={look} /></div>
          <div className="flex-1 space-y-3">
            <input className="field" value={name} maxLength={14} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-blue-900">Gender:</span>
              <button onClick={() => setGender('male')} className={`rounded-lg border-2 px-3 py-1 font-bold ${gender === 'male' ? 'border-blue-700 bg-blue-500 text-white' : 'border-slate-300 bg-white'}`}>♂</button>
              <button onClick={() => setGender('female')} className={`rounded-lg border-2 px-3 py-1 font-bold ${gender === 'female' ? 'border-pink-700 bg-pink-400 text-white' : 'border-slate-300 bg-white'}`}>♀</button>
            </div>
            <Picker label="Hair Style" text={`Style ${hair + 1}`} onPrev={() => setHair(cycle(hair, HAIRS.length, -1))} onNext={() => setHair(cycle(hair, HAIRS.length, 1))} />
            <Picker label="Outfit" text={<span className="inline-block h-4 w-8 rounded align-middle" style={{ background: OUTFITS[outfit] }} />} onPrev={() => setOutfit(cycle(outfit, OUTFITS.length, -1))} onNext={() => setOutfit(cycle(outfit, OUTFITS.length, 1))} />
          </div>
        </div>
        <div className="flex justify-between px-4 pb-4">
          <button className="btn-blue" onClick={onBack}>← Back</button>
          <button className="btn-green" disabled={!name.trim()} onClick={() => onCreate({ name: name.trim(), gender, look })}>✓ Create</button>
        </div>
      </div>
    </div>
  )
}
