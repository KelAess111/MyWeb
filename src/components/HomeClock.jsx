import { useEffect, useState } from 'react'
import '../styles/home-environment.css'

function formatClockParts(date) {
  return {
    time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    date: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
  }
}

function HomeClock({ isVisible = true, now, weather }) {
  const [localNow, setLocalNow] = useState(() => new Date())
  const clockNow = now ?? localNow

  useEffect(() => {
    if (now) return undefined
    const timer = window.setInterval(() => setLocalNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [now])

  const clockParts = formatClockParts(clockNow)
  return (
    <aside className={`home-clock ${isVisible ? 'home-clock--visible' : 'home-clock--hidden'}`} aria-label="当前日期时间和天气">
      <span className="home-clock-kicker">Local / {weather?.status === 'ready' ? weather.label : 'Weather'}</span>
      <time className="home-clock-time" dateTime={clockNow.toISOString()}>{clockParts.time}</time>
      <span className="home-clock-date">{clockParts.date}</span>
      <span className="home-clock-weather">{weather?.temperature == null ? (weather?.label ?? '天气读取中') : `${weather.label} · ${weather.temperature}°C`}</span>
    </aside>
  )
}

export default HomeClock
