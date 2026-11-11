import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import GameScene from '../game/GameScene'

export default function GameCanvas({ bridge, look }) {
  const ref = useRef(null)
  useEffect(() => {
    bridge.look = look
    const game = new Phaser.Game({
      type: Phaser.AUTO, parent: ref.current, backgroundColor: '#86c66b', roundPixels: true,
      physics: { default: 'arcade', arcade: { debug: false } },
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      scene: [GameScene],
      callbacks: { preBoot: (g) => g.registry.set('bridge', bridge) },
    })
    return () => game.destroy(true)
  }, [])
  return <div ref={ref} className="absolute inset-0" />
}
