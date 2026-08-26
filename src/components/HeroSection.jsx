import { useEffect, useRef, useState } from 'react'
import AnnouncementRotator from './AnnouncementRotator'
import OCShowcase from './OCShowcase'
import SpeechBubbleRotator from './SpeechBubbleRotator'
import HotspotCarousel from './HotspotCarousel'
import { homepageDefaultScenes, homepageMusicScenes } from '../data/ocPhrases'
import useRotator from '../hooks/useRotator'
import '../styles/hero-section.css'

const OC_ROTATION_INTERVAL = 6200
const HERO_STAGGER_STEP = 140

function HeroSection({ isVisible = true, dayPeriod = 'day', musicUiState, onOcAreaChange }) {
  const scenePool = musicUiState?.isMusicSceneActive ? homepageMusicScenes : homepageDefaultScenes
  const activeSceneIndex = useRotator(scenePool, OC_ROTATION_INTERVAL)
  const activeScene = scenePool[activeSceneIndex] ?? scenePool[0]
  const timersRef = useRef([])
  const visualColumnRef = useRef(null)
  const [isVisualVisible, setIsVisualVisible] = useState(false)
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false)
  const [isSpeechActive, setIsSpeechActive] = useState(false)
  const [clickResponse, setClickResponse] = useState('')

  useEffect(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
    if (!isVisible) {
      const resetTimer = window.setTimeout(() => {
        setIsVisualVisible(false); setIsAnnouncementVisible(false); setIsSpeechActive(false)
      }, 0)
      timersRef.current.push(resetTimer)
      return () => window.clearTimeout(resetTimer)
    }
    const resetTimer = window.setTimeout(() => {
      setIsVisualVisible(false); setIsAnnouncementVisible(false); setIsSpeechActive(false)
    }, 0)
    timersRef.current.push(resetTimer)
    timersRef.current.push(window.setTimeout(() => setIsVisualVisible(true), HERO_STAGGER_STEP))
    timersRef.current.push(window.setTimeout(() => setIsAnnouncementVisible(true), HERO_STAGGER_STEP * 2))
    timersRef.current.push(window.setTimeout(() => setIsSpeechActive(true), HERO_STAGGER_STEP * 3))
    return () => timersRef.current.forEach((timer) => window.clearTimeout(timer))
  }, [isVisible])

  useEffect(() => {
    if (!onOcAreaChange || !visualColumnRef.current) return undefined
    const updateBounds = () => {
      const rect = visualColumnRef.current?.getBoundingClientRect()
      if (rect) onOcAreaChange({ top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height })
    }
    updateBounds()
    window.addEventListener('resize', updateBounds)
    window.addEventListener('scroll', updateBounds, { passive: true })
    const timer = window.setTimeout(updateBounds, 900)
    return () => { window.removeEventListener('resize', updateBounds); window.removeEventListener('scroll', updateBounds); window.clearTimeout(timer) }
  }, [isAnnouncementVisible, isSpeechActive, isVisualVisible, onOcAreaChange, activeScene?.id])

  const handleOcClick = () => {
    const responses = ['嗯？你叫我吗？', '看到啦，今天也请多关照。', '再点一下的话，我可能会记住你。']
    setClickResponse(responses[Math.floor(Math.random() * responses.length)])
    window.setTimeout(() => setClickResponse(''), 3600)
  }

  return (
    <section className={`hero ${isVisible ? 'hero--visible' : 'hero--hidden'}`} id="home">
      <div className="hero-layout">
        <div ref={visualColumnRef} className={`hero-visual-column ${isVisualVisible ? 'hero-visual-column--visible' : 'hero-visual-column--hidden'}`}>
          <div className="hero-canvas">
            <div className={`hero-announcement-shell ${isAnnouncementVisible ? 'hero-announcement-shell--visible' : 'hero-announcement-shell--hidden'}`}><AnnouncementRotator /></div>
            <div className="hero-visual-stack">
              <SpeechBubbleRotator scene={activeScene} overrideText={clickResponse} isActive={isSpeechActive} />
              <OCShowcase scene={activeScene} onClick={handleOcClick} />
            </div>
            <div className="hero-hotspot-grid">
              <div className="hero-hotspot-card hero-hotspot-card--one"><HotspotCarousel folderId="1" variant="fade" /></div>
              <div className="hero-hotspot-card hero-hotspot-card--two"><HotspotCarousel folderId="2" variant="fade" /></div>
              <div className="hero-hotspot-card hero-hotspot-card--three"><HotspotCarousel folderId="3" variant="slide-x" /></div>
              <div className="hero-hotspot-card hero-hotspot-card--four"><HotspotCarousel folderId="4" variant="slide-y" /></div>
              <div className={`hero-hotspot-card hero-hotspot-card--day ${dayPeriod === 'night' ? 'is-night' : 'is-day'}`}>
                <span aria-hidden="true">☀︎</span><span aria-hidden="true">☾</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
