import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicGalleryData } from '../data/publicGalleryData'

const OBSERVER_OPTIONS = {
  rootMargin: '-22% 0px -28% 0px',
  threshold: [0.15, 0.35, 0.6],
}

function PublicGalleryPage() {
  const [activeYear, setActiveYear] = useState(publicGalleryData[0]?.year ?? '')
  const entryRefs = useRef(new Map())
  const activeYearRef = useRef(activeYear)
  const activeEntry = publicGalleryData.find((entry) => entry.year === activeYear) ?? publicGalleryData[0]
  const timelineRange = publicGalleryData.length
    ? `${publicGalleryData[0].year} → ${publicGalleryData[publicGalleryData.length - 1].year}`
    : ''

  useEffect(() => {
    activeYearRef.current = activeYear
  }, [activeYear])

  useEffect(() => {
    const entries = [...entryRefs.current.entries()]
    if (!entries.length || typeof IntersectionObserver === 'undefined') {
      return undefined
    }

    let frameId = null
    const updateActiveYear = () => {
      frameId = null
      const viewportCenter = window.innerHeight / 2
      const nextYear = entries
        .map(([entryYear, node]) => ({
          entryYear,
          distance: Math.abs(node.getBoundingClientRect().top + node.offsetHeight / 2 - viewportCenter),
        }))
        .sort((left, right) => left.distance - right.distance)[0]?.entryYear

      if (nextYear && nextYear !== activeYearRef.current) {
        activeYearRef.current = nextYear
        setActiveYear(nextYear)
      }
    }

    const observer = new IntersectionObserver((observations) => {
      if (!observations.some((observation) => observation.isIntersecting) || frameId !== null) {
        return
      }

      frameId = window.requestAnimationFrame(updateActiveYear)
    }, OBSERVER_OPTIONS)

    entries.forEach(([, node]) => observer.observe(node))
    return () => {
      observer.disconnect()
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  return (
    <main
      className="public-gallery-page"
      style={{ '--public-gallery-active-cover': `url("${activeEntry?.cover ?? ''}")` }}
    >
      <section className="public-gallery-shell" aria-labelledby="public-gallery-title">
        <header className="public-gallery-heading">
          <div>
            <span className="section-kicker">Works / 美图分享</span>
            <h1 id="public-gallery-title">美图分享</h1>
            <p>从 2026 开始向未来延伸，把每一年的图片整理成一条可以逐年打开的图册时间线。</p>
          </div>
          <Link to="/interests" className="public-gallery-back-link">
            <span aria-hidden="true">←</span> 返回个人兴趣
          </Link>
        </header>

        <div className="public-gallery-context" aria-live="polite">
          <span className="public-gallery-context-label">年份图册</span>
          <strong>{timelineRange}</strong>
          <span>点击任意节点进入对应图册</span>
        </div>

        <ol className="public-gallery-timeline" aria-label={`美图分享年份时间线，顶部 ${publicGalleryData[0]?.year ?? ''}，底部 ${publicGalleryData[publicGalleryData.length - 1]?.year ?? ''}`}>
          {publicGalleryData.map((entry) => (
            <li
              key={entry.id}
              ref={(node) => {
                if (node) {
                  entryRefs.current.set(entry.year, node)
                } else {
                  entryRefs.current.delete(entry.year)
                }
              }}
              data-year={entry.year}
              className={`public-gallery-entry public-gallery-entry-${entry.side} public-gallery-entry--${entry.status} ${activeYear === entry.year ? 'is-active' : ''}`}
              data-text={entry.title}
            >
              <div className="public-gallery-marker" aria-hidden="true">
                <span />
              </div>
              <article className="public-gallery-card">
                <Link to={`/works/painting/${entry.year}`} className="public-gallery-card-link" aria-label={`打开 ${entry.year} 图册`}>
                  <div className="public-gallery-art">
                    <img src={entry.cover} alt={`${entry.year} 图册封面`} loading={entry.year === publicGalleryData[0]?.year ? 'eager' : 'lazy'} fetchPriority={entry.year === publicGalleryData[0]?.year ? 'high' : 'auto'} decoding="async" />
                    <span className="public-gallery-art-caption">{entry.year}</span>
                  </div>
                  <div className="public-gallery-card-body">
                    <span className="public-gallery-period">Album / {entry.year}</span>
                    <h2>{entry.title}</h2>
                    <p className="public-gallery-summary">{entry.summary}</p>
                    <p className="public-gallery-note">{entry.note}</p>
                    <span className="public-gallery-focus-button">
                      进入图册 <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}

export default PublicGalleryPage
