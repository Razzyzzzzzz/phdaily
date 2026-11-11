import { Component, lazy, Suspense } from 'react'
import Avatar from './Avatar'

// 3D preview ng character (lazy-loaded). Kapag walang WebGL / may error, babalik sa lumang 2D Avatar.
const Canvas3D = lazy(() => import('./CharacterCanvas'))

class Boundary extends Component {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  componentDidCatch(e) { console.warn('CharacterPreview fallback:', e) }
  render() { return this.state.err ? this.props.fallback : this.props.children }
}

export default function CharacterPreview({ look, className = '' }) {
  const fallback = <div className="grid h-full w-full place-items-center"><Avatar look={look} /></div>
  return (
    <div className={className}>
      <Boundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <Canvas3D look={look} />
        </Suspense>
      </Boundary>
    </div>
  )
}