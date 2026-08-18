import { useEffect, useRef, useState } from 'react'
import AnnouncementRotator from './AnnouncementRotator'
import OCShowcase from './OCShowcase'
import SpeechBubbleRotator from './SpeechBubbleRotator'
import { homepageDefaultScenes, homepageMusicScenes } from '../data/ocPhrases'
import useRotator from '../hooks/useRotator'
import '../styles/hero-section.css'

const OC_ROTATION_INTERVAL = 6200
const HERO_STAGGER_STEP = 140

function HeroSection({ isVisible = true, musicUiState, onOcAreaChange }) {
  const scenePool = musicUiState?.isMusicSceneActive ? homepageMusicScenes : homepageDefaultScenes
  const activeSceneIndex = useRotator(scenePool, OC_ROTATION_INTERVAL)
  const activeScene = scenePool[activeSceneIndex] ?? scenePool[0]
  const timersRef = useRef([])
  const visualColumnRef = useRef(null)
  const [isCopyVisible, setIsCopyVisible] = useState(false)
  const [isVisualVisible, setIsVisualVisible] = useState(false)
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false)
  const [isSpeechActive, setIsSpeechActive] = useState(false)

  useEffect(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []

    if (!isVisible) {
      setIsCopyVisible(false)
      setIsVisualVisible(false)
      setIsAnnouncementVisible(false)
      setIsSpeechActive(false)
      return undefined
    }

    setIsCopyVisible(true)
    setIsVisualVisible(false)
    setIsAnnouncementVisible(false)
    setIsSpeechActive(false)

    timersRef.current.push(window.setTimeout(() => setIsVisualVisible(true), HERO_STAGGER_STEP))
    timersRef.current.push(window.setTimeout(() => setIsAnnouncementVisible(true), HERO_STAGGER_STEP * 2))
    timersRef.current.push(window.setTimeout(() => setIsSpeechActive(true), HERO_STAGGER_STEP * 3))

    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current = []
    }
  }, [isVisible])

  useEffect(() => {
    if (!onOcAreaChange || !visualColumnRef.current) {
      return undefined
    }

    const updateBounds = () => {
      const rect = visualColumnRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }

      onOcAreaChange({
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    }

    updateBounds()

    window.addEventListener('resize', updateBounds)
    window.addEventListener('scroll', updateBounds, { passive: true })

    const timer = window.setTimeout(updateBounds, 900)

    return () => {
      window.removeEventListener('resize', updateBounds)
      window.removeEventListener('scroll', updateBounds)
      window.clearTimeout(timer)
    }
  }, [isAnnouncementVisible, isSpeechActive, isVisualVisible, onOcAreaChange, activeScene?.id])

  return (
    <section className={`hero ${isVisible ? 'hero--visible' : 'hero--hidden'}`} id="home">
      <div className="hero-layout">
        <div className={`hero-copy ${isCopyVisible ? 'hero-copy--visible' : 'hero-copy--hidden'}`}>
          <p className="hero-greeting">你好，欢迎来到这里。</p>
          <h1 className="hero-title">一个创作者</h1>
          <blockquote className="hero-quote">
            灵感偶尔会迟到，但它通常不会真的迷路。
          </blockquote>
          <p className="hero-desc">
            这是我的个人网站，也是我作品与想法的展示空间。
          </p>
          <div className="hero-buttons">
            <a href="#works" className="btn primary">
              查看作品
            </a>
            <a href="#about" className="btn secondary">
              了解我
            </a>
          </div>
        </div>

        <div
          ref={visualColumnRef}
          className={`hero-visual-column ${isVisualVisible ? 'hero-visual-column--visible' : 'hero-visual-column--hidden'}`}
        >
          <div className={`hero-announcement-shell ${isAnnouncementVisible ? 'hero-announcement-shell--visible' : 'hero-announcement-shell--hidden'}`}>
            <AnnouncementRotator />
          </div>
          <div className="hero-visual-stack">
            <SpeechBubbleRotator scene={activeScene} isActive={isSpeechActive} />
            <OCShowcase scene={activeScene} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
