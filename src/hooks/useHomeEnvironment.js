import { useEffect, useMemo, useState } from 'react'

const REQUEST_TIMEOUT = 7000

function getDayPeriod(date) {
  const hour = date.getHours()
  return hour >= 6 && hour < 18 ? 'day' : 'night'
}

function weatherKind(code) {
  if (code === 0) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code <= 67 || code === 80 || code === 81) return 'rain'
  if (code <= 77 || code >= 85) return 'snow'
  if (code >= 95) return 'storm'
  return 'cloudy'
}

const weatherLabels = {
  clear: '晴朗',
  cloudy: '多云',
  rain: '降雨',
  snow: '降雪',
  storm: '雷雨',
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return response.json()
}

function useHomeEnvironment() {
  const [now, setNow] = useState(() => new Date())
  const [weather, setWeather] = useState({ status: 'loading', kind: null, label: '天气读取中', temperature: null })

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    async function loadWeather() {
      try {
        const location = await fetchJson('https://ipapi.co/json/', controller.signal)
        if (!Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude))) {
          throw new Error('Location unavailable')
        }

        const params = new URLSearchParams({
          latitude: location.latitude,
          longitude: location.longitude,
          current: 'temperature_2m,weather_code',
          timezone: 'auto',
        })
        const forecast = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`, controller.signal)
        const kind = weatherKind(Number(forecast.current?.weather_code))
        setWeather({
          status: 'ready',
          kind,
          label: weatherLabels[kind],
          temperature: Number.isFinite(Number(forecast.current?.temperature_2m)) ? Math.round(forecast.current.temperature_2m) : null,
          region: location.city || location.region || '',
        })
      } catch {
        if (!controller.signal.aborted) setWeather({ status: 'fallback', kind: null, label: '天气暂不可用', temperature: null })
      }
    }

    loadWeather()
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  const dayPeriod = useMemo(() => getDayPeriod(now), [now])
  return { now, dayPeriod, weather }
}

export default useHomeEnvironment
