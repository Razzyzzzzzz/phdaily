export default function Avatar({ look }) {
  const style = look.hairStyle ?? 0
  const female = look.gender === 'female'
  const pants = look.pants ?? '#334155'
  const shoes = '#1e293b'
  const edge = 'ring-1 ring-black/10' // keeps white outfits visible

  return (
    <div className="relative h-36 w-20 shrink-0">
      {/* long hair (back) */}
      {style === 2 && <div className="absolute left-1 top-3 h-14 w-[72px] rounded-t-full" style={{ background: look.hair }} />}
      {/* female: shoulder-length hair on both sides */}
      {female && style !== 2 && (
        <>
          <div className="absolute left-2 top-5 h-12 w-4 rounded-b-xl" style={{ background: look.hair }} />
          <div className="absolute left-[56px] top-5 h-12 w-4 rounded-b-xl" style={{ background: look.hair }} />
        </>
      )}

      {/* legs + shoes */}
      <div className="absolute left-[22px] top-[96px] h-7 w-[14px] rounded-b" style={{ background: female ? look.skin : pants }} />
      <div className="absolute left-[44px] top-[96px] h-7 w-[14px] rounded-b" style={{ background: female ? look.skin : pants }} />
      <div className="absolute left-[19px] top-[122px] h-3 w-5 rounded-full" style={{ background: shoes }} />
      <div className="absolute left-[41px] top-[122px] h-3 w-5 rounded-full" style={{ background: shoes }} />

      {/* arms */}
      <div className={`absolute left-[2px] top-[60px] h-9 w-3 rounded-full ${edge}`} style={{ background: look.shirt }} />
      <div className={`absolute left-[66px] top-[60px] h-9 w-3 rounded-full ${edge}`} style={{ background: look.shirt }} />
      {/* hands */}
      <div className="absolute left-[2px] top-[92px] h-3 w-3 rounded-full" style={{ background: look.skin }} />
      <div className="absolute left-[66px] top-[92px] h-3 w-3 rounded-full" style={{ background: look.skin }} />

      {/* body */}
      {female ? (
        <>
          <div className={`absolute left-4 top-[58px] h-9 w-12 rounded-t-lg ${edge}`} style={{ background: look.shirt }} />
          <div className={`absolute left-2 top-[88px] h-9 w-16 rounded-b-2xl ${edge}`} style={{ background: look.shirt }} />
        </>
      ) : (
        <>
          <div className={`absolute left-3 top-[58px] h-10 w-14 rounded-lg ${edge}`} style={{ background: look.shirt }} />
          <div className="absolute left-3 top-[92px] h-5 w-14 rounded-b-md" style={{ background: pants }} />
        </>
      )}

      {/* neck + head */}
      <div className="absolute left-[32px] top-[50px] h-3 w-4" style={{ background: look.skin }} />
      <div className="absolute left-4 top-3 h-12 w-12 rounded-full" style={{ background: look.skin }} />

      {/* hair (front) */}
      <div className={`absolute top-2 rounded-t-full ${style === 1 ? 'left-3 h-7 w-14' : 'left-4 h-5 w-12'}`} style={{ background: look.hair }} />

      {/* eyes */}
      <div className="absolute left-[26px] top-[34px] h-1.5 w-1.5 rounded-full bg-slate-900" />
      <div className="absolute left-[44px] top-[34px] h-1.5 w-1.5 rounded-full bg-slate-900" />
      {/* mouth */}
      <div className="absolute left-[33px] top-[44px] h-1 w-3.5 rounded-full bg-rose-700/70" />

      {female && (
        <>
          <div className="absolute left-[22px] top-[41px] h-1.5 w-2.5 rounded-full bg-pink-400/60" />
          <div className="absolute left-[46px] top-[41px] h-1.5 w-2.5 rounded-full bg-pink-400/60" />
        </>
      )}
    </div>
  )
}