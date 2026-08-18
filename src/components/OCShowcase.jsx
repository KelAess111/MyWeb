import { useEffect, useState } from 'react'
import chibiPlaceholder from '../assets/oc/chibi-placeholder.png'
import '../styles/oc-showcase.css'

const FADE_DURATION = 220

function OCShowcase({ scene, className = '' }) {
  const [displayedScene, setDisplayedScene] = useState(scene)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (!scene || scene.id === displayedScene?.id) {
      return undefined
    }

    setIsFading(true)

    const swapTimer = window.setTimeout(() => {
      setDisplayedScene(scene)
      setIsFading(false)
    }, FADE_DURATION)

    return () => window.clearTimeout(swapTimer)
  }, [scene, displayedScene?.id])

  const activeScene = displayedScene ?? scene
  const imageSrc = activeScene?.image ?? chibiPlaceholder
  const expressionName = activeScene?.expression ?? 'default'
  const caption = activeScene?.caption ?? '这里之后会放上你的原创角色形象与不同版本立绘。'
  const alt = activeScene?.alt ?? '站在首页迎接来访者的 Q 版原创角色占位形象'

  return (
    <div className={`oc-showcase ${className}`.trim()}>
      <div className={`oc-frame oc-frame--${expressionName} ${isFading ? 'is-fading' : 'is-visible'}`.trim()}>
        <div className="oc-glow" aria-hidden="true" />
        <img className={`oc-image ${isFading ? 'is-fading' : 'is-visible'}`} src={imageSrc} alt={alt} />
      </div>
      <div className={`oc-caption ${isFading ? 'is-fading' : 'is-visible'}`}>
        <p className="oc-caption-title">OC 接待位</p>
        <p className="oc-caption-text">{caption}</p>
      </div>
    </div>
  )
}

export default OCShowcase
