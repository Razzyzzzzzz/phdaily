import Title from './Title'
import Avatar from './Avatar'

export default function MainMenu({ user, look, onPlay, onCreate, onSettings, onExit }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-400 via-sky-200 to-green-300 p-4">
      <Title />
      <div className="flex items-center gap-6">
        <div className="hidden scale-125 sm:block"><Avatar look={look} /></div>
        <div className="flex w-56 flex-col gap-3">
          <button className="btn-orange py-3 text-2xl" onClick={onPlay}>▶ Play</button>
          <button className="btn-blue" onClick={onCreate}>🧑 Character Creator</button>
          <button className="btn-blue" onClick={onSettings}>⚙️ Settings</button>
          <button className="btn-red" onClick={onExit}>🚪 Exit</button>
        </div>
      </div>
      <p className="text-sm font-bold text-blue-900">Logged in as {user}</p>
    </div>
  )
}
