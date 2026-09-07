import { useCallback, useEffect, useRef, useState } from 'react'

function useRotator(items, intervalMs) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)
  const resumeTimerRef = useRef(null)

  useEffect(() => {
    if (!items.length || items.length <= 1 || isPaused) {
      return undefined
    }

    timerRef.current = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % items.length)
    }, intervalMs)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [items, intervalMs, isPaused])

  const pause = useCallback((duration = 3000) => {
    // 清除之前的恢复定时器（如果有）
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current)
    }

    setIsPaused(true)

    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false)
      resumeTimerRef.current = null
    }, duration)
  }, [])

  return { activeIndex, pause, isPaused }
}

export default useRotator
