const stroke = { WebkitTextStroke: '4px #1e3a8a', paintOrder: 'stroke fill' }
export default function Title() {
  return (
    <div className="text-center leading-none drop-shadow-lg">
      <p className="text-3xl font-extrabold text-white sm:text-4xl" style={stroke}>EVERYDAY LIFE:</p>
      <p className="text-5xl font-extrabold text-yellow-300 sm:text-7xl" style={stroke}>PHILIPPINES</p>
      <p className="mx-auto mt-2 w-fit rounded-full bg-blue-900 px-3 py-0.5 text-sm font-bold text-white">Live · Work · Explore</p>
    </div>
  )
}
