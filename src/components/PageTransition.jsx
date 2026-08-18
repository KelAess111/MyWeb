import { useEffect, useState } from 'react'

function PageTransition({ children, transitionKey, className = '' }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    setIsVisible(true)
  }, [transitionKey])

  return <div className={`page-transition ${isVisible ? 'is-visible' : ''} ${className}`.trim()}>{children}</div>
}

export default PageTransition
