import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicGalleryData } from '../data/publicGalleryData'

function PublicGalleryPage() {
  const [activeYear, setActiveYear] = useState(publicGalleryData[0]?.year ?? '')
  const entryRefs = useRef(new Map())
  const activeEntry = publicGalleryData.find((entry) => entry.year === activeYear) ?? publicGalleryData[0]

  useEffect(() => {
    const entries = [...entryRefs.current.entries()]
    if (!entries.length || typeof IntersectionObserver === 'undefined') {
      return undefined
    }

    const observer = new IntersectionObserver(
      (observations) => {
        const visible = observations
          .filter((observation) => observation.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const nextEntry = visible[0]
        if (nextEntry) {
          setActiveYear(nextEntry.target.dataset.year)
        }
      },
      { rootMargin: '-25% 0px -35% 0px', threshold: [0.15, 0.35, 0.6] },
    )

    entries.forEach(([, node]) => observer.observe(node))
    return () => observer.disconnect()
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
          <strong>2030 → 2026</strong>
          <span>点击任意节点进入对应图册</span>
        </div>

        <ol className="public-gallery-timeline" aria-label="美图分享年份时间线，顶部 2030，底部 2026">
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
              className={`public-gallery-entry public-gallery-entry-${entry.side} ${activeYear === entry.year ? 'is-active' : ''}`}
              data-text={entry.title}            >
              <div className="public-gallery-marker" aria-hidden="true">
                <span />
              </div>
              <article className="public-gallery-card">
                <Link to={`/works/painting/${entry.year}`} className="public-gallery-card-link" aria-label={`打开 ${entry.year} 图册`}>
                  <div className="public-gallery-art">
                    <img src={entry.cover} alt={`${entry.year} 图册封面`} loading="lazy" decoding="async" />
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
