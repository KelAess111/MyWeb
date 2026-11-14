import { useEffect, useRef, useState } from 'react'
import '../styles/record-piano.css'



// Measures 5–6. Durations are in quarter-note beats, pitches are MIDI numbers.
const bars = [
  [
    [[0.75, 69, 76, 80], [0.75, 64], [0.5, 68], [2, 68, 75, 78]],
    [[0.5, 45], [0.5, 45], [0.25, 52, 57], [0.5, 45], [0.25, 45], [0.5, 44], [0.5, 44], [0.25, 51, 56], [0.5, 44], [0.25, 44]],
  ],
  [
    [[0.75, 68, 73, 76], [0.75, 59], [0.5, 64], [1, 64, 71, 74], [1, 76]],
    [[0.5, 37], [0.5, 37], [0.5, 40], [0.5, 40], [0.5, 44], [0.5, 44], [0.25, 44], [0.25, 51, 56], [0.5, 44]],
  ],
]
const dramaOpening = [
  [[0.75, 59, 63], [0.75, 59, 63], [0.5, 59, 63], [0.75, 62, 65], [0.75, 62, 65], [0.5, 62, 65]],
  [[0.75, 44], [0.75, 44], [0.5, 44], [0.75, 50], [0.75, 50], [0.5, 50]],
]
const dramaResponse = [
  [[0.75, 61, 66], [0.75, 61, 66], [0.75, 61, 66], [0.75, 61, 66], [1, 61, 66]],
  [[0.75, 51], [0.75, 51], [0.75, 51], [0.75, 51], [1, 51]],
]

const heatOpening = [
  [
    [[0.5, 68], [0.5, 61], [1, 73, 85], [1, 80, 92], [1, 73, 85]],
    [[0.5, 34], [0.5, 46], [0.5, 61], [0.5, 63], [0.5, 34], [0.5, 46], [0.5, 61], [0.5, 56]],
  ],
  [
    [[1, 72, 84], [1, 68, 80], [0.5, 65, 77], [0.5, 76], [0.5, 65, 77], [0.5, 76]],
    [[0.5, 34], [0.5, 46], [1, 46], [0.25, 53], [0.25, 49], [0.5, 29, 41], [0.25, 48], [0.25, 46], [0.5, 44]],
  ],
]

export const pianoPreviews = {
  'album-熱異常': { title: '熱異常', credit: '编排 触手猴 · 扒谱 雾雨marisa', bpm: 180, bars: heatOpening },
  'album-帝国少女': { title: '帝国少女', credit: '原曲 R Sound Design · 钢琴改编 天狼星', bpm: 118, bars },
  'album-拟剧论': {
    title: '拟剧论',
    credit: '原曲 Eve · 制谱 唐朝那些事儿',
    bpm: 149,
    bars: [dramaOpening, dramaResponse, dramaOpening, dramaResponse],
  },
}

function getScore(preview) {
  const beat = 60 / preview.bpm
  return preview.bars.flatMap((bar, index) => bar.flatMap((hand, voice) => {
    let position = index * 4
    return hand.map(([duration, ...notes]) => {
      const event = { at: position * beat, duration: duration * beat, notes, volume: voice ? 0.55 : 0.85 }
      position += duration
      return event
    })
  })).sort((a, b) => a.at - b.at)
}

const black = new Set([1, 3, 6, 8, 10])
const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const keys = Array.from({ length: 88 }, (_, index) => index + 21)
const keyMap = 'awsedftgyhujk'

function playNote(bus, note, at, duration, volume) {
  const context = bus.context
  const frequency = 440 * 2 ** ((note - 69) / 12)
  for (const [ratio, strength] of [[1, 1], [2, 0.28], [3, 0.09]]) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = frequency * ratio
    const level = volume * strength * 0.09
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(level, at + 0.008)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, level * 0.22), at + duration)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration + 0.2)
    oscillator.connect(gain).connect(bus)
    oscillator.start(at)
    oscillator.stop(at + duration + 0.22)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
  }
}

const fallLead = 0.8

function paintFallingNotes(canvas, score, elapsed, firstActive, reducedMotion) {
  if (!canvas) return
  const context = canvas.getContext('2d')
  if (!context) return
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const scale = Math.min(window.devicePixelRatio || 1, 2)
  if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) {
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
  }
  context.setTransform(scale, 0, 0, scale, 0, 0)
  context.clearRect(0, 0, width, height)
  if (!width || !height || reducedMotion.matches) return

  const canvasLeft = canvas.getBoundingClientRect().left
  const speed = height / fallLead
  for (let index = firstActive; index < score.length && score[index].at <= elapsed + fallLead; index++) {
    const { at, duration, notes } = score[index]
    const head = height - (at - elapsed) * speed
    const tail = Math.max(0, head - duration * speed)
    const bottom = Math.min(height, head)
    if (bottom <= tail) continue
    for (const note of notes) {
      const key = canvas.parentElement.querySelector(`[data-note="${note}"] > button`)
      if (!key) continue
      const accidental = black.has(note % 12)
      const bounds = key.getBoundingClientRect()
      const x = bounds.left - canvasLeft + bounds.width / 2
      const barWidth = bounds.width * (accidental ? 0.86 : 0.84)
      const gradient = context.createLinearGradient(0, tail, 0, bottom)
      gradient.addColorStop(0, accidental ? '#aa8aff29' : '#78a9f329')
      gradient.addColorStop(1, accidental ? '#cfb5ff' : '#a9daff')
      context.fillStyle = gradient
      context.beginPath()
      context.roundRect(x - barWidth / 2, tail, barWidth, bottom - tail, Math.min(4, (bottom - tail) / 2))
      context.fill()
    }
  }
}

export default function RecordPiano({ request, onStop }) {
  const [expanded, setExpanded] = useState(false)
  const [lit, setLit] = useState([])
  const [manual, setManual] = useState(null)
  const [error, setError] = useState('')
  const audio = useRef(null)
  const analyser = useRef(null)
  const keyboard = useRef(null)
  const fallingNotes = useRef(null)
  const particleId = useRef(0)
  const [particles, setParticles] = useState([])

  function floatNotes(notes) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const next = notes.map(note => ({ note, id: particleId.current++ }))
    setParticles(current => [...current, ...next].slice(-24))
  }
  const manualTimer = useRef(null)

  async function audioReady() {
    audio.current ??= new AudioContext()
    if (!analyser.current) {
      analyser.current = audio.current.createAnalyser()
      analyser.current.fftSize = 512
      analyser.current.connect(audio.current.destination)
    }
    await audio.current.resume()
    window.dispatchEvent(new CustomEvent('record-piano-spectrum', { detail: analyser.current }))
    return audio.current
  }

  async function strike(note) {
    try {
      const context = await audioReady()
      playNote(analyser.current, note, context.currentTime + 0.01, 0.38, 0.8)
      floatNotes([note])
      setManual(note)
      clearTimeout(manualTimer.current)
      manualTimer.current = setTimeout(() => setManual(null), 180)
      setError('')
    } catch {
      setError('无法启动钢琴声音，请重试。')
    }
  }

  useEffect(() => () => {
    window.dispatchEvent(new CustomEvent('record-piano-spectrum'))
    analyser.current = null
    clearTimeout(manualTimer.current)
    if (audio.current) {
      void audio.current.close()
      audio.current = null
    }
  }, [])

  useEffect(() => {
    if (!request) return undefined
    let bus
    let frame
    let scheduler
    let controller
    let stopped = false
    async function start() {
      try {
        const context = await audioReady()
        if (stopped) return
        setExpanded(true)
        bus = context.createGain()
        bus.connect(analyser.current)
        let score
        let duration
        if (request.fullScore) {
          controller = new AbortController()
          const response = await fetch(request.fullScore, { signal: controller.signal })
          if (!response.ok) throw new Error('Score request failed')
          const data = await response.json()
          if (!Number.isFinite(data.duration) || !data.events?.length) throw new Error('Invalid score')
          if (stopped) return
          duration = data.duration
          score = data.events.map(([at, length, note, volume]) => ({ at, duration: length, notes: [note], volume }))
        } else {
          score = getScore(request)
          duration = request.bars.length * 240 / request.bpm
        }
        let nextEvent = 0
        let nextScheduled = 0
        let firstActive = 0
        let previousKeys = ''
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
        const startAt = context.currentTime + (motion.matches ? 0.06 : fallLead)
        function schedule() {
          const now = context.currentTime
          const horizon = now - startAt + 0.25
          while (score[nextScheduled]?.at <= horizon) {
            const event = score[nextScheduled++]
            const end = startAt + event.at + event.duration
            const at = Math.max(now, startAt + event.at)
            if (end - at < 0.015) continue
            for (const note of event.notes) playNote(bus, note, at, end - at, event.volume)
          }
        }
        schedule()
        scheduler = window.setInterval(schedule, 40)
        function highlight() {
          const elapsed = context.currentTime - startAt
          if (elapsed >= duration + 0.2) {
            onStop()
            return
          }
          const hits = []
          while (score[nextEvent]?.at <= elapsed) hits.push(...score[nextEvent++].notes)
          if (hits.length) floatNotes([...new Set(hits)])
          while (firstActive < nextEvent && score[firstActive].at + score[firstActive].duration <= elapsed) firstActive++
          paintFallingNotes(fallingNotes.current, score, elapsed, firstActive, motion)
          const active = score.slice(firstActive, nextEvent).filter(({ at, duration }) => elapsed < at + duration)
            .flatMap(({ notes }) => notes)
          const keySignature = active.join(',')
          if (keySignature !== previousKeys) {
            previousKeys = keySignature
            setLit(active)
          }
          frame = requestAnimationFrame(highlight)
        }
        highlight()
      } catch {
        if (!stopped) {
          setError('无法播放钢琴片段，请重试。')
          onStop()
        }
      }
    }
    setError('')
    void start()
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      clearInterval(scheduler)
      controller?.abort()
      bus?.disconnect()
      const canvas = fallingNotes.current
      if (canvas) canvas.width = 0
      setLit([])
    }
  }, [request, onStop])

  const visible = expanded || Boolean(request)
  useEffect(() => {
    if (!visible) {
      window.dispatchEvent(new CustomEvent('record-piano-spectrum'))
      setParticles([])
    }
  }, [visible])
  useEffect(() => {
    if (!visible) return
    const scroller = keyboard.current
    const middleC = scroller.querySelector('[aria-label="C4"]')
    scroller.scrollLeft = middleC.offsetParent.offsetLeft - scroller.clientWidth / 2
  }, [visible])

  useEffect(() => {
    if (!request || !lit.length || !keyboard.current) return
    const scroller = keyboard.current
    const melody = [...scroller.querySelectorAll('button[data-active="true"]')].at(-1)
    const position = melody?.offsetParent.offsetLeft
    if (position < scroller.scrollLeft || position > scroller.scrollLeft + scroller.clientWidth - 24) {
      scroller.scrollLeft = position - scroller.clientWidth / 2
    }
  }, [lit, request])
  let whiteCount = 0
  return <aside className="record-piano" data-open={visible} aria-label="网页钢琴">
    <div className="record-piano-header">
      <button type="button" aria-expanded={visible} aria-controls="record-piano-keyboard" onClick={() => {
        if (request) { onStop(); setExpanded(false) }
        else setExpanded(!expanded)
      }}>{visible ? '收起钢琴' : '打开钢琴'}</button>
      {request && <><span className="record-piano-title">{request.title}</span><button type="button" onClick={onStop}>{request.fullScore ? '停止全曲' : '停止片段'}</button></>}
      {error && <span role="status">{error}</span>}
    </div>
    <div id="record-piano-keyboard" className="record-piano-panel" inert={!visible}><div ref={keyboard} className="record-piano-scroll" onKeyDown={(event) => {
      const index = keyMap.indexOf(event.key.toLowerCase())
      if (index < 0 || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
      event.preventDefault()
      void strike(60 + index)
    }}>
      <div className="record-piano-keys">
        <canvas ref={fallingNotes} className="record-piano-falling" aria-hidden="true" />
        {keys.map((note) => {
          const accidental = black.has(note % 12)
          const label = names[note % 12] + (Math.floor(note / 12) - 1)
          const active = (request && lit.includes(note)) || manual === note
          const position = accidental ? whiteCount : whiteCount++
          const floating = particles.filter(item => item.note === note)
          return <span key={note} className="record-piano-key" data-note={note} data-black={accidental} style={{ '--key-position': position }}><button type="button" aria-label={label} data-black={accidental} data-active={Boolean(active)} data-manual={manual === note}
            onClick={() => void strike(note)}>
            {!accidental && note % 12 === 0 ? label : null}
          </button>
          {floating.map(({ id }) => <span key={id} className="record-piano-note" aria-hidden="true" onAnimationEnd={() => setParticles(current => current.filter(item => item.id !== id))}>{id % 2 ? '♪' : '♫'}</span>)}
          </span>
        })}
      </div>
    </div>
    </div>
  </aside>
}
