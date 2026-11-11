const stroke = { WebkitTextStroke: '4px #1e3a8a', paintOrder: 'stroke fill' }

// bawat letra ay may maliit na "wave" na animation
function Wave({ text, className, delay = 0 }) {
  return (
    <p className={className} style={stroke} aria-label={text}>
      {[...text].map((ch, i) =>
        ch === ' ' ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <span key={i} aria-hidden="true" className="inline-block" style={{ animation: `elph-wave 2.4s ease-in-out ${delay + i * 0.08}s infinite` }}>
            {ch}
          </span>
        ),
      )}
    </p>
  )
}

export default function Title() {
  return (
    <div className="elph-anim relative text-center leading-none drop-shadow-lg" style={{ animation: 'elph-pop 0.6s both' }}>
      <span className="absolute -left-6 -top-3 text-2xl" style={{ animation: 'elph-twinkle 2s ease-in-out infinite' }}>✨</span>
      <span className="absolute -right-6 top-6 text-xl" style={{ animation: 'elph-twinkle 2.6s ease-in-out 0.8s infinite' }}>✨</span>
      <Wave text="EVERYDAY LIFE:" className="text-3xl font-extrabold text-white sm:text-4xl" />
      <Wave text="PHILIPPINES" className="text-5xl font-extrabold text-yellow-300 sm:text-7xl" delay={0.3} />
      <p className="mx-auto mt-3 w-fit rounded-full border-2 border-white/70 bg-blue-900 px-4 py-0.5 text-sm font-bold text-white shadow-md">
        Live · Work · Explore
      </p>
    </div>
  )
}