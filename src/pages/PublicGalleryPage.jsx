import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicGalleryData } from '../data/publicGalleryData'

function PublicGalleryPage() {
  const [activeId, setActiveId] = useState(publicGalleryData[0]?.id ?? '')
  const entryRefs = useRef(new Map())

  useEffect(() => {
    const entries = [...entryRefs.current.values()]
    if (!entries.length || typeof IntersectionObserver === 'undefined') {
      return undefined
    }

    const observer = new IntersectionObserver(
      (observations) => {
        const visibleEntry = observations
          .filter((observation) => observation.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]

        if (visibleEntry) {
          setActiveId(visibleEntry.target.dataset.galleryId)
        }
      },
      { rootMargin: '-30% 0px -45% 0px', threshold: [0.15, 0.4, 0.75] },
    )

    entries.forEach((entry) => observer.observe(entry))
    return () => observer.disconnect()
  }, [])

  const activeEntry = publicGalleryData.find((entry) => entry.id === activeId) ?? publicGalleryData[0]

  return (
    <main
      className={`public-gallery-page public-gallery-theme-${activeEntry?.palette ?? 'dawn'}`}
    >
      <section className="public-gallery-shell" aria-labelledby="public-gallery-title">
        <header className="public-gallery-heading">
          <div>
            <span className="section-kicker">Works / 美图分享</span>
            <h1 id="public-gallery-title">美图分享</h1>
            <p>把色彩、构图和仍在变化的画面整理成一条可继续延伸的视觉时间线。</p>
          </div>
          <Link to="/interests" className="public-gallery-back-link">
            <span aria-hidden="true">←</span> 返回个人兴趣
          </Link>
        </header>

        <div className="public-gallery-context" aria-live="polite">
          <span className="public-gallery-context-label">当前记录</span>
          <strong>{activeEntry?.title}</strong>
          <span>{activeEntry?.period}</span>
        </div>

        <ol className="public-gallery-timeline" aria-label="美图分享时间线">
          {publicGalleryData.map((entry) => {
            const isActive = entry.id === activeId
            return (
              <li
                key={entry.id}
                ref={(node) => {
                  if (node) {
                    entryRefs.current.set(entry.id, node)
                  } else {
                    entryRefs.current.delete(entry.id)
                  }
                }}
                data-gallery-id={entry.id}
                className={`public-gallery-entry public-gallery-entry-${entry.side}${isActive ? ' is-active' : ''}`}
              >
                <div className="public-gallery-marker" aria-hidden="true">
                  <span />
                </div>
                <article className="public-gallery-card">
                  <div className={`public-gallery-art public-gallery-art-${entry.palette}`} aria-hidden="true">
                    <span className="public-gallery-art-shape public-gallery-art-shape-primary" />
                    <span className="public-gallery-art-shape public-gallery-art-shape-secondary" />
                    <span className="public-gallery-art-caption">{entry.period}</span>
                  </div>
                  <div className="public-gallery-card-body">
                    <span className="public-gallery-period">{entry.period}</span>
                    <h2>{entry.title}</h2>
                    <p className="public-gallery-summary">{entry.summary}</p>
                    <p className="public-gallery-note">{entry.note}</p>
                    <button
                      type="button"
                      className="public-gallery-focus-button"
                      onClick={() => setActiveId(entry.id)}
                      aria-pressed={isActive}
                    >
                      {isActive ? '正在查看' : '聚焦此记录'}
                    </button>
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      </section>
    </main>
  )
}

export default PublicGalleryPage
