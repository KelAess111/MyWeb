import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AUTOPLAY_INTERVAL = 10400
const INTERACTION_PAUSE = 2400

const launcherItems = [
  {
    id: 'interests',
    label: '个人兴趣',
    path: '/interests',
  },
  {
    id: 'profile',
    label: '关于我',
    path: '/profile#intro',
  },
  {
    id: 'blog',
    label: '博客日志',
    path: '/journal',
  },
  {
    id: 'portfolio',
    label: '个人作品集',
    path: '/portfolio',
  },
  {
    id: 'share',
    label: '分享',
    path: '/share',
  },
]

function HomeLauncher({ isVisible = true }) {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)
  const [motionSettings, setMotionSettings] = useState({ reduced: false, mobile: false, hidden: false })
  const autoplayPausedRef = useRef(false)
  const pauseTimerRef = useRef(null)

  const visibleItems = useMemo(() => {
    const itemCount = launcherItems.length
    const maxDistance = Math.floor(itemCount / 2)

    return launcherItems.map((item, index) => {
      const clockwiseDistance = (index - activeIndex + itemCount) % itemCount
      const distance = clockwiseDistance > maxDistance
        ? clockwiseDistance - itemCount
        : clockwiseDistance
      const slot = distance === 0
        ? 'center'
        : distance < 0
          ? `upper-${Math.abs(distance)}`
          : `lower-${distance}`

      return {
        ...item,
        slot,
        hidden: Math.abs(distance) > maxDistance,
        index,
      }
    })
  }, [activeIndex])

  const rotateLauncher = (direction) => {
    setActiveIndex((current) => (current + direction + launcherItems.length) % launcherItems.length)
  }

  const pauseAutoplay = () => {
    autoplayPausedRef.current = true
    if (pauseTimerRef.current) {
      window.clearTimeout(pauseTimerRef.current)
    }
    pauseTimerRef.current = window.setTimeout(() => {
      autoplayPausedRef.current = false
      pauseTimerRef.current = null
    }, INTERACTION_PAUSE)
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileQuery = window.matchMedia('(max-width: 720px)')
    const updateMotionSettings = () => {
      setMotionSettings({
        reduced: mediaQuery.matches,
        mobile: mobileQuery.matches,
        hidden: document.hidden,
      })
    }
    const handleVisibilityChange = () => {
      setMotionSettings((current) => ({ ...current, hidden: document.hidden }))
    }

    updateMotionSettings()
    mediaQuery.addEventListener?.('change', updateMotionSettings)
    mobileQuery.addEventListener?.('change', updateMotionSettings)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mediaQuery.removeEventListener?.('change', updateMotionSettings)
      mobileQuery.removeEventListener?.('change', updateMotionSettings)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!isVisible || motionSettings.reduced || motionSettings.mobile || motionSettings.hidden) {
      return undefined
    }

    const autoplayTimer = window.setInterval(() => {
      if (document.hidden || autoplayPausedRef.current) {
        return
      }
      rotateLauncher(-1)
    }, AUTOPLAY_INTERVAL)

    return () => window.clearInterval(autoplayTimer)
  }, [isVisible, motionSettings])

  useEffect(() => () => {
    if (pauseTimerRef.current) {
      window.clearTimeout(pauseTimerRef.current)
    }
    autoplayPausedRef.current = false
  }, [])

  const handleWheel = (event) => {
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
      return
    }

    if (event.cancelable && event.currentTarget.contains(event.target)) {
      event.preventDefault()
    }

    pauseAutoplay()
    rotateLauncher(event.deltaY > 0 ? 1 : -1)
  }

  const handleItemDoubleClick = (path) => {
    pauseAutoplay()
    navigate(path)
  }

  const handleItemKeyDown = (event, index, path) => {
    pauseAutoplay()

    if (event.key === 'Enter') {
      event.preventDefault()
      if (index === activeIndex) {
        navigate(path)
        return
      }

      setActiveIndex(index)
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      rotateLauncher(-1)
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      rotateLauncher(1)
    }
  }

  return (
    <section
      className={`home-launcher ${isVisible ? 'home-launcher--visible' : 'home-launcher--hidden'}`}
      aria-label="首页功能跳转"
      onPointerEnter={pauseAutoplay}
      onFocus={pauseAutoplay}
    >
      <div className="home-launcher-stage" onWheel={handleWheel} tabIndex={0} aria-live="polite">
        <div className="home-launcher-arc" aria-hidden="true" />
        <div className="home-launcher-band" aria-hidden="true">
          {visibleItems.map((item) => (
            <span
              key={`${item.id}-band`}
              className={`home-launcher-band-slot home-launcher-band-slot--${item.slot}${item.hidden ? ' is-hidden' : ''}`}
            />
          ))}
        </div>

        <div className="home-launcher-items">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.index === activeIndex
                ? 'home-launcher-item home-launcher-item--center is-active'
                : `home-launcher-item home-launcher-item--${item.slot}`}
              aria-pressed={item.index === activeIndex}
              onDoubleClick={() => handleItemDoubleClick(item.path)}
              onKeyDown={(event) => handleItemKeyDown(event, item.index, item.path)}
            >
              <span className="home-launcher-item-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomeLauncher
