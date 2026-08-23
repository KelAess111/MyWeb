import { useEffect, useState } from 'react'
import '../styles/speech-bubble.css'

const TYPE_INTERVAL = 38

function SpeechBubbleRotator({ scene, overrideText = '', isActive = true }) {
  const [displayText, setDisplayText] = useState('')
  const fullText = overrideText || scene?.text || ''

  useEffect(() => {
    if (!isActive || !fullText) return undefined
    let currentIndex = 0
    window.setTimeout(() => setDisplayText(''), 0)
    const typeTimer = window.setInterval(() => {
      currentIndex += 1
      setDisplayText(fullText.slice(0, currentIndex))
      if (currentIndex >= fullText.length) window.clearInterval(typeTimer)
    }, TYPE_INTERVAL)
    return () => window.clearInterval(typeTimer)
  }, [fullText, isActive])

  return <div className="speech-bubble" aria-live="polite"><p>{displayText || ' '}</p></div>
}

export default SpeechBubbleRotator
