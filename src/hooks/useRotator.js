import { useEffect, useState } from 'react'

function useRotator(items, intervalMs) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!items.length || items.length <= 1) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % items.length)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [items, intervalMs])

  return activeIndex
}

export default useRotator
