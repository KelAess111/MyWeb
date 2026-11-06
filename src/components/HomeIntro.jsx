import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../styles/home-intro.css'

const stages = {
  greeting: [820, 'ready'],
  shatter: [1580, 'star'],
  star: [650, 'wave'],
  wave: [1500, 'scan'],
  scan: [2410, 'reveal'],
  reveal: [3160, 'done'],
}

function Glyphs({ text, offset }) {
  return Array.from(text, (glyph, index) => {
    const n = index + offset
    const jitter = (factor, range) => (n * factor + 17) % range
    const style = {
      '--glyph-x': (jitter(53, 110) - 55) + 'px',
      '--glyph-y': (jitter(37, 76) - 38) + 'px',
      '--glyph-turn': (jitter(67, 260) - 130) + 'deg',
      '--glyph-delay': jitter(137, 470) + 'ms',
      '--glyph-time': (750 + jitter(43, 350)) + 'ms',
    }
    return <span key={index} style={style}>{glyph}</span>
  })
}

const dataGlyphs = '01011010∷⋮⌁⟡'
const scanSweepDuration = 2080

function makeDataStreams() {
  return Array.from({ length: 4 }, () => Array.from({ length: 13 }, () => {
    const duration = 2200 + Math.random() * 3500
    const length = Math.random() < .7 ? 1 : 2 + Math.floor(Math.random() * 3)
    return {
      text: Array.from({ length }, () => dataGlyphs[Math.floor(Math.random() * dataGlyphs.length)]).join(''),
      x: Math.random() * 90,
      y: 18 + Math.random() * 100,
      drift: (Math.random() - .5) * 52,
      rise: 9 + Math.random() * 16,
      duration,
      delay: -Math.random() * duration,
      size: 8 + Math.random() * 6,
      opacity: .32 + Math.random() * .56,
      color: ['#64e9f6', '#b58bff', '#ff78c7'][Math.floor(Math.random() * 3)],
    }
  }))
}

function DataStreams() {
  const [corners] = useState(makeDataStreams)
  return <div className="home-intro-streams" aria-hidden="true">
    {corners.map((particles, corner) => <div className="home-intro-stream" key={corner}>
      {particles.map((particle, index) => <span className="home-intro-data-particle" key={index} style={{
        left: particle.x + '%',
        top: particle.y + '%',
        '--stream-time': particle.duration + 'ms',
        '--stream-delay': particle.delay + 'ms',
        '--stream-drift': particle.drift + 'px',
        '--stream-rise': -particle.rise + 'vh',
        '--stream-opacity': particle.opacity,
        color: particle.color,
        fontSize: particle.size + 'px',
      }}>{particle.text}</span>)}
    </div>)}
  </div>
}

function CrossStar() {
  return <svg className="home-intro-star" viewBox="0 0 160 160" aria-hidden="true">
    <circle className="home-intro-star-core" cx="80" cy="80" r="15" />
    <circle className="home-intro-star-ring" cx="80" cy="80" r="34" pathLength="100" fill="none" />
    <path className="home-intro-star-rays" d="M80 5 82.2 77.8 155 80 82.2 82.2 80 155 77.8 82.2 5 80 77.8 77.8Z" />
  </svg>
}

function DataWave() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    let cells = []
    let width, height, unit, radius, frame, start
    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      unit = Math.max(13, Math.ceil(Math.sqrt(width * height / 1450)))
      radius = Math.hypot(width / 2, height / 2)
      cells = []
      for (let y = height / 2 % unit; y < height + unit; y += unit) {
        for (let x = width / 2 % unit; x < width + unit; x += unit) {
          cells.push({ x, y, distance: Math.hypot(x - width / 2, y - height / 2) })
        }
      }
    }
    const face = (ax, ay, bx, by, cx, cy, dx, dy) => {
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(bx, by)
      ctx.lineTo(cx, cy)
      ctx.lineTo(dx, dy)
      ctx.closePath()
      ctx.fill()
    }
    const draw = (now) => {
      start ??= now
      const progress = Math.min((now - start) / stages.wave[0], 1)
      const band = unit * 6
      const front = progress * (radius + band)
      ctx.clearRect(0, 0, width, height)
      for (const cell of cells) {
        const offset = (cell.distance - front) / band
        if (Math.abs(offset) >= 1) continue
        const crest = Math.cos(offset * Math.PI / 2) ** 2
        const baseSize = unit * (.39 + crest * .33)
        const half = baseSize / 2
        // An overhead camera sees the top straight on at the center.
        // Toward the edges, taller tops project outward and expose a side.
        const lift = crest * unit * .45
        const dx = (cell.x - width / 2) / radius * lift
        const dy = (cell.y - height / 2) / radius * lift
        const spread = lift * .15
        const left = cell.x - half
        const right = cell.x + half
        const top = cell.y - half
        const bottom = cell.y + half
        const topLeft = left + dx - spread
        const topRight = right + dx + spread
        const topTop = top + dy - spread
        const topBottom = bottom + dy + spread
        ctx.globalAlpha = crest * .55
        ctx.fillStyle = '#8198bb'
        ctx.fillRect(left, top, baseSize, baseSize)
        if (dx > spread) face(left, top, left, bottom, topLeft, topBottom, topLeft, topTop)
        if (dx < -spread) face(right, top, right, bottom, topRight, topBottom, topRight, topTop)
        ctx.globalAlpha = crest * .76
        ctx.fillStyle = '#a9bdd8'
        if (dy > spread) face(left, top, right, top, topRight, topTop, topLeft, topTop)
        if (dy < -spread) face(left, bottom, right, bottom, topRight, topBottom, topLeft, topBottom)
        ctx.globalAlpha = crest * .96
        ctx.fillStyle = '#f0f6ff'
        ctx.fillRect(topLeft, topTop, topRight - topLeft, topBottom - topTop)
      }
      if (progress < 1) frame = requestAnimationFrame(draw)
    }
    resize()
    window.addEventListener('resize', resize)
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas className="home-intro-wave" ref={canvasRef} aria-hidden="true" />
}

const scanTargets = [
  ['nav', '.site-header'],
  ['clock', '.home-clock'],
  ['announcement', '.hero-announcement-shell'],
  ['card-1', '.hero-hotspot-card--one'],
  ['card-2', '.hero-hotspot-card--two'],
  ['card-3', '.hero-hotspot-card--three'],
  ['card-4', '.hero-hotspot-card--four'],
  ['oc', '.hero-visual-stack .oc-image-stack'],
  ['speech', '.hero-visual-stack .speech-bubble'],
  ['launcher', '.home-launcher-stage'],
  ['moon', '.moon-phases'],
]

function scanRadius(width, height) {
  return Math.hypot(width, height) / 2 + 28
}

function readScanLayout() {
  const { innerWidth: width, innerHeight: height } = window
  const radius = scanRadius(width, height)
  const grid = width < 640 ? 24 : 32
  const snap = (value) => Math.round(value / grid) * grid
  const areas = scanTargets.flatMap(([kind, selector]) => {
    const rect = document.querySelector(selector)?.getBoundingClientRect()
    if (!rect?.width || !rect.height || rect.bottom <= 0 || rect.right <= 0 ||
      rect.left >= width || rect.top >= height) return []
    const left = snap(Math.max(0, rect.left))
    const top = snap(Math.max(0, rect.top))
    const right = Math.max(left + grid, snap(Math.min(width, rect.right)))
    const bottom = Math.max(top + grid, snap(Math.min(height, rect.bottom)))
    const x = (left + right) / 2
    const y = (top + bottom) / 2
    const delay = Math.hypot(x - width / 2, y - height / 2) / radius * scanSweepDuration
    return [{ kind, left, top, width: right - left, height: bottom - top, x, y, delay }]
  })
  return { radius, grid, areas }
}

function LayoutScan({ layout }) {
  if (!layout) return null
  const { radius, grid, areas } = layout
  return <div className="home-intro-scan" aria-hidden="true" style={{
    '--sweep-time': scanSweepDuration + 'ms',
    '--sweep-radius': radius + 'px',
    '--sweep-diameter': radius * 2 + 'px',
  }}>
    <svg className="home-intro-scan-map" width="100%" height="100%">
      <defs>
        <pattern id="home-intro-coordinate-grid" width={grid} height={grid} patternUnits="userSpaceOnUse">
          <path d={'M0 ' + grid + 'V0H' + grid} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#home-intro-coordinate-grid)" />
      {areas.map(area => <rect key={area.kind} className="home-intro-scan-area"
        x={area.left} y={area.top} width={area.width} height={area.height} />)}
    </svg>
    <div className="home-intro-scan-ring" />
    {areas.map(({ kind, x, y, delay }) => <i
      className="home-intro-scan-ping"
      data-ping={kind}
      key={kind}
      style={{ left: x, top: y, '--ping-delay': delay + 'ms' }}
    />)}
  </div>
}

export default function HomeIntro({ homeReady, onReveal, onDone }) {
  const [stage, setStage] = useState('loading')
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const enterRef = useRef(null)
  const [scanLayout, setScanLayout] = useState(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  useEffect(() => {
    if (stage === 'ready') {
      enterRef.current?.focus({ preventScroll: true })
      return undefined
    }
    if (stage === 'reveal') onReveal()
    const [duration, next] = stage === 'loading'
      ? (homeReady ? [650, 'greeting'] : [6500, 'greeting'])
      : stages[stage]
    const timer = window.setTimeout(() => {
      if (next === 'done') onDone()
      else {
        if (next === 'scan') setScanLayout(readScanLayout())
        setStage(next)
      }
    }, reduced && stage === 'reveal' ? 140 : duration)
    return () => window.clearTimeout(timer)
  }, [stage, homeReady, reduced, onReveal, onDone])

  const waiting = ['loading', 'greeting', 'ready', 'shatter'].includes(stage)
  return createPortal(
    <div className={'home-intro home-intro--' + stage} role="dialog" aria-modal="true" aria-label="首页入场">
      {waiting && <div className="home-intro-welcome" aria-hidden="true">
        {stage === 'loading' ? <div className="intro-loader home-intro-loader">
          <span className="intro-loader-dot" /><span className="intro-loader-dot" /><span className="intro-loader-dot" />
        </div> : <>
          <div className="home-intro-heading">
            <div className="home-intro-kicker"><Glyphs text="WELCOME" offset={1} /></div>
            <h1><Glyphs text="你好，创作者" offset={9} /></h1>
          </div>
          {stage !== 'greeting' && <p className="home-intro-prompt"><Glyphs text="点击屏幕任意处" offset={16} /></p>}
        </>}
      </div>}
      {(stage === 'ready' || stage === 'shatter') && <DataStreams />}
      {stage === 'loading' && <span className="home-intro-sr" role="status">正在加载首页</span>}
      {stage === 'ready' && <button ref={enterRef} className="home-intro-enter" type="button" aria-label="你好，创作者。点击屏幕任意处进入首页" onClick={() => setStage(reduced ? 'reveal' : 'shatter')} />}
      {stage === 'star' && <CrossStar />}
      {stage === 'wave' && <DataWave />}
      {(stage === 'scan' || stage === 'reveal') && <LayoutScan layout={scanLayout} />}
    </div>,
    document.body,
  )
}
