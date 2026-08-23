import { useEffect, useState } from 'react'

const clickShapes = ['star', 'triangle', 'square', 'circle']
const clickColors = ['#ffe6f7', '#a2d2ff', '#f8d7ff', '#c8ffe8']

function buildClickParticles(event) {
  return Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 10
    const distance = 26 + (index % 4) * 10
    return { id: `${event.timeStamp}-${index}`, x: event.clientX, y: event.clientY, dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance, delay: (index % 3) * 18, shape: clickShapes[index % clickShapes.length], color: clickColors[index % clickColors.length] }
  })
}

function ClickEffects() {
  const [particles, setParticles] = useState([])
  const [trail, setTrail] = useState([])

  useEffect(() => {
    let lastTrail = 0
    const handlePointerMove = (event) => {
      if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const now = performance.now()
      if (now - lastTrail < 32) return
      lastTrail = now
      const node = { id: `${now}-${event.clientX}-${event.clientY}`, x: event.clientX, y: event.clientY }
      setTrail((current) => [...current.slice(-16), node])
      window.setTimeout(() => setTrail((current) => current.filter((item) => item.id !== node.id)), 620)
    }
    const handlePointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      const nextParticles = buildClickParticles(event)
      setParticles((current) => [...current.slice(-36), ...nextParticles])
      window.setTimeout(() => setParticles((current) => current.filter((particle) => !nextParticles.some((nextParticle) => nextParticle.id === particle.id))), 860)
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown)
    return () => { window.removeEventListener('pointermove', handlePointerMove); window.removeEventListener('pointerdown', handlePointerDown) }
  }, [])

  return <div className="click-effects-layer" aria-hidden="true">
    {trail.map((item) => <span key={item.id} className="pointer-trail-dot" style={{ left: item.x, top: item.y }} />)}
    {particles.map((particle) => <span key={particle.id} className={`click-particle click-particle--${particle.shape}`} style={{ left: particle.x, top: particle.y, '--particle-x': `${particle.dx}px`, '--particle-y': `${particle.dy}px`, '--particle-delay': `${particle.delay}ms`, '--particle-color': particle.color }} />)}
  </div>
}

export default ClickEffects
