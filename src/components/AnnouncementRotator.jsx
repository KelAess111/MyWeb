import { useEffect, useState } from 'react'
import { announcements } from '../data/announcements'
import '../styles/announcement-rotator.css'

const ROTATION_INTERVAL = 4800

function AnnouncementRotator() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (announcements.length <= 1) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % announcements.length)
    }, ROTATION_INTERVAL)

    return () => window.clearInterval(timer)
  }, [])

  const activeAnnouncement = announcements[activeIndex]

  return (
    <a className="announcement-rotator" href={activeAnnouncement.href}>
      <span className="announcement-label">{activeAnnouncement.label}</span>
      <span className="announcement-text">{activeAnnouncement.text}</span>
      <span className="announcement-arrow" aria-hidden="true">
        ↗
      </span>
    </a>
  )
}

export default AnnouncementRotator
