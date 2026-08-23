import { useEffect, useState } from 'react'

function PageTransition({ children, transitionKey, className = '' }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setIsVisible(false), 0)
    const enterTimer = window.setTimeout(() => setIsVisible(true), 48)

    return () => {
      window.clearTimeout(leaveTimer)
      window.clearTimeout(enterTimer)
    }
  }, [transitionKey])

  return <div className={`page-transition ${isVisible ? 'is-visible' : ''} ${className}`.trim()}>{children}</div>
}

export default PageTransition
