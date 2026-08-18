import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import rainyBg from '../assets/background/Reset_Rainy.png'
import OCShowcase from './OCShowcase'
import PageTransition from './PageTransition'
import SpeechBubbleRotator from './SpeechBubbleRotator'
import { hiddenSpaceOcScenes } from '../data/hiddenSpaceOcLines'
import { secretRoom } from '../data/secretRoom'

function HiddenSpaceLayout() {
  const location = useLocation()
  const isUnlocked = window.localStorage.getItem(secretRoom.unlockStorageKey) === 'true'
  const hasSeenIntro = window.localStorage.getItem(secretRoom.introSeenStorageKey) === 'true'
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
      setActiveScene(defaultScene)
      return undefined
    }

    setActiveScene(hiddenSpaceOcScenes.firstVisit[introIndex])

    if (introIndex >= hiddenSpaceOcScenes.firstVisit.length - 1) {
      window.localStorage.setItem(secretRoom.introSeenStorageKey, 'true')
      const finalTimer = window.setTimeout(() => {
        setActiveScene(defaultScene)
      }, 2600)
      return () => window.clearTimeout(finalTimer)
    }

    const timer = window.setTimeout(() => {
      setIntroIndex((current) => current + 1)
    }, 2800)

    return () => window.clearTimeout(timer)
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
          <PageTransition transitionKey={location.pathname} className="hidden-space-route-transition">
            <Outlet context={{ activeScene, setActiveScene, defaultScene }} />
          </PageTransition>
        </section>
      </div>
    </main>
  )
}

export default HiddenSpaceLayout
