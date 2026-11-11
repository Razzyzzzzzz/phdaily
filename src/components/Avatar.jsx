export default function Avatar({ look }) {
  const style = look.hairStyle ?? 0
  const female = look.gender === 'female'
  return (
    <div className="relative h-32 w-20 shrink-0">
      {/* long hair (back) */}
      {style === 2 && <div className="absolute left-1 top-3 h-14 w-[72px] rounded-t-full" style={{ background: look.hair }} />}
      {/* female: shoulder-length hair on both sides of the face */}
      {female && style !== 2 && (
        <>
          <div className="absolute left-2 top-5 h-12 w-4 rounded-b-xl" style={{ background: look.hair }} />
          <div className="absolute left-[56px] top-5 h-12 w-4 rounded-b-xl" style={{ background: look.hair }} />
        </>
      )}
      {/* head */}
      <div className="absolute left-4 top-3 h-12 w-12 rounded-full" style={{ background: look.skin }} />
      {/* hair (front) */}
      <div className={`absolute top-2 rounded-t-full ${style === 1 ? 'left-3 h-7 w-14' : 'left-4 h-5 w-12'}`} style={{ background: look.hair }} />
      {/* body */}
      {female ? (
        <>
          <div className="absolute left-4 top-[58px] h-10 w-12 rounded-t-lg" style={{ background: look.shirt }} />
          <div className="absolute left-2 top-[92px] h-8 w-16 rounded-b-2xl" style={{ background: look.shirt }} />
        </>
      ) : (
        <div className="absolute left-3 top-[58px] h-16 w-14 rounded-lg" style={{ background: look.shirt }} />
      )}
      {/* eyes */}
      <div className="absolute left-[26px] top-[34px] h-1.5 w-1.5 rounded-full bg-slate-900" />
      <div className="absolute left-[44px] top-[34px] h-1.5 w-1.5 rounded-full bg-slate-900" />
      {/* female: blush */}
      {female && (
        <>
          <div className="absolute left-[22px] top-[41px] h-1.5 w-2.5 rounded-full bg-pink-400/60" />
          <div className="absolute left-[46px] top-[41px] h-1.5 w-2.5 rounded-full bg-pink-400/60" />
        </>
      )}
    </div>
  )
}