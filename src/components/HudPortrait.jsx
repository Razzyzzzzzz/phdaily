import { Component, lazy, memo, Suspense } from 'react'
import Avatar from './Avatar'

// Lazy so the 3D code (and Scene3D) isn't pulled into the main bundle by the HUD.
const PortraitCanvas = lazy(() => import('./PortraitCanvas'))

// 2D head-and-shoulders crop, used while loading or when WebGL fails
function Portrait2D({ look }) {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute left-1/2 top-0"
        style={{ transform: 'translateX(-50%) translateY(1px) scale(0.72)', transformOrigin: 'top center' }}
      >
        <Avatar look={look} />
      </div>
    </div>
  )
}

class Boundary extends Component {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  componentDidCatch(e) { console.warn('HudPortrait fallback:', e) }
  render() { return this.state.err ? this.props.fallback : this.props.children }
}

function HudPortrait({ look }) {
  const fallback = <Portrait2D look={look} />
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full bg-gradient-to-b from-sky-300 to-sky-100">
      <Boundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <PortraitCanvas look={look} />
        </Suspense>
      </Boundary>
    </div>
  )
}

export default memo(HudPortrait)