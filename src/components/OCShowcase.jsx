import { useEffect, useState } from 'react'
import chibiPlaceholder from '../assets/oc/chibi-placeholder.png'
import '../styles/oc-showcase.css'

const CROSSFADE_DURATION = 420

function OCShowcase({ scene, onClick, className = '' }) {
  const [currentScene, setCurrentScene] = useState(scene)
  const [incomingScene, setIncomingScene] = useState(null)

  useEffect(() => {
    if (!scene || scene.id === currentScene?.id) return undefined

    const startTimer = window.setTimeout(() => setIncomingScene(scene), 0)
    const timer = window.setTimeout(() => {
      setCurrentScene(scene)
      setIncomingScene(null)
    }, CROSSFADE_DURATION)

    return () => {
      window.clearTimeout(startTimer)
      window.clearTimeout(timer)
    }
  }, [scene, currentScene?.id])

  const renderScene = incomingScene ?? currentScene ?? scene
  const expressionName = renderScene?.expression ?? 'default'
  const caption = renderScene?.caption ?? '这里之后会放上你的原创角色形象与不同版本立绘。'

  return (
    <div className={`oc-showcase ${className}`.trim()}>
      <button type="button" className={`oc-frame oc-frame--${expressionName}`} onClick={onClick} aria-label="点击 OC 与她对话">
        <div className="oc-glow" aria-hidden="true" />
        <div className="oc-image-stack">
          {[currentScene, incomingScene].filter(Boolean).map((item, index) => (
            <img
              key={`${item.id}-${index === 0 ? 'current' : 'incoming'}`}
              className={`oc-image ${index === 1 ? 'oc-image--incoming' : 'oc-image--current'}${incomingScene && index === 1 ? ' is-entering' : ''}`}
              src={item.image ?? chibiPlaceholder}
              alt={item.alt ?? '站在首页迎接来访者的 Q 版原创角色占位形象'}
            />
          ))}
        </div>
      </button>
      <div className="oc-caption">
        <p className="oc-caption-title">OC 接待位</p>
        <p className="oc-caption-text">{caption}</p>
      </div>
    </div>
  )
}

export default OCShowcase
