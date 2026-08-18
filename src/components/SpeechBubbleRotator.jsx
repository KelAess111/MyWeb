import { useEffect, useState } from 'react'
import '../styles/speech-bubble.css'

const TYPE_INTERVAL = 38

function SpeechBubbleRotator({ scene, isActive = true }) {
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    if (!isActive) {
      setDisplayText('')
      return undefined
    }

    const fullText = scene?.text ?? ''
    setDisplayText('')

    if (!fullText) {
      return undefined
    }

    let currentIndex = 0
    const timer = window.setInterval(() => {
      currentIndex += 1
      setDisplayText(fullText.slice(0, currentIndex))

      if (currentIndex >= fullText.length) {
        window.clearInterval(timer)
      }
    }, TYPE_INTERVAL)

    return () => window.clearInterval(timer)
  }, [isActive, scene?.id, scene?.text])

  return (
    <div className="speech-bubble" aria-live="polite">
      <p>{displayText}</p>
    </div>
  )
}

export default SpeechBubbleRotator
