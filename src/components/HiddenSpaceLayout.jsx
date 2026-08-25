import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import rainyBg from '../assets/background/Reset_Rainy.png'
import OCShowcase from './OCShowcase'
import SpeechBubbleRotator from './SpeechBubbleRotator'
import { hiddenSpaceOcScenes } from '../data/hiddenSpaceOcLines'
import { secretRoom } from '../data/secretRoom'

function readStorageFlag(key) {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(key) === 'true'
}

function HiddenSpaceLayout() {
  const location = useLocation()
  const [isUnlocked] = useState(() => readStorageFlag(secretRoom.unlockStorageKey))
  const [hasSeenIntro] = useState(() => readStorageFlag(secretRoom.introSeenStorageKey))
  const [introIndex, setIntroIndex] = useState(0)
  const [activeScene, setActiveScene] = useState(hasSeenIntro ? hiddenSpaceOcScenes.returnGreeting : hiddenSpaceOcScenes.firstVisit[0])

  const defaultScene = useMemo(() => {
    if (location.pathname.endsWith('/games')) {
      return hiddenSpaceOcScenes.defaults.games
    }

    if (location.pathname.endsWith('/painting')) {
      return hiddenSpaceOcScenes.defaults.painting
    }

    if (location.pathname.endsWith('/writing')) {
      return hiddenSpaceOcScenes.defaults.writing
    }

    if (location.pathname.endsWith('/journal')) {
      return hiddenSpaceOcScenes.defaults.journal
    }

    if (location.pathname.endsWith('/personal')) {
      return hiddenSpaceOcScenes.defaults.personal
    }

    return hiddenSpaceOcScenes.defaults.home
  }, [location.pathname])

  useEffect(() => {
    if (!isUnlocked) {
      return undefined
    }

    if (hasSeenIntro) {
      const timer = window.setTimeout(() => setActiveScene(defaultScene), 0)
      return () => window.clearTimeout(timer)
    }

    const sceneTimer = window.setTimeout(() => {
      setActiveScene(hiddenSpaceOcScenes.firstVisit[introIndex])
    }, 0)

    if (introIndex >= hiddenSpaceOcScenes.firstVisit.length - 1) {
      window.localStorage.setItem(secretRoom.introSeenStorageKey, 'true')
      const finalTimer = window.setTimeout(() => {
        setActiveScene(defaultScene)
      }, 2600)
      return () => {
        window.clearTimeout(sceneTimer)
        window.clearTimeout(finalTimer)
      }
    }

    const timer = window.setTimeout(() => {
      setIntroIndex((current) => current + 1)
    }, 2800)

    return () => {
      window.clearTimeout(sceneTimer)
      window.clearTimeout(timer)
    }
  }, [defaultScene, hasSeenIntro, introIndex, isUnlocked])

  if (!isUnlocked) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="hidden-space-layout">
      <div className="hidden-space-background" style={{ backgroundImage: `url(${rainyBg})` }} aria-hidden="true">
        <div className="hidden-space-background-overlay" />
      </div>

      <div className="hidden-space-content-shell">
        <aside className="hidden-space-sidebar">
          <div className="hidden-space-oc-shell">
            <SpeechBubbleRotator scene={activeScene} isActive />
            <OCShowcase scene={activeScene} />
          </div>
        </aside>

        <section className="hidden-space-main">
          <Outlet context={{ activeScene, setActiveScene, defaultScene }} />
        </section>
      </div>
    </main>
  )
}

export default HiddenSpaceLayout
