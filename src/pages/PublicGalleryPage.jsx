import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicGalleryData } from '../data/publicGalleryData'

const OBSERVER_OPTIONS = {
  rootMargin: '-22% 0px -28% 0px',
  threshold: [0.15, 0.35, 0.6],
}

const firstValidCover = publicGalleryData.find((entry) => entry.cover)?.year ?? publicGalleryData[0]?.year ?? ''

function PublicGalleryPage() {
  const [activeYear, setActiveYear] = useState(firstValidCover)
  const [loadedCovers, setLoadedCovers] = useState(() => new Set())
  const [failedCovers, setFailedCovers] = useState(() => new Set())
  const entryRefs = useRef(new Map())
  const activeYearRef = useRef(activeYear)
  const activeEntry = publicGalleryData.find((entry) => entry.year === activeYear) ?? publicGalleryData.find((entry) => entry.cover)
  const timelineRange = publicGalleryData.length
    ? `${publicGalleryData[0].year} → ${publicGalleryData[publicGalleryData.length - 1].year}`
    : ''

  useEffect(() => {
    activeYearRef.current = activeYear
  }, [activeYear])

  useEffect(() => {
    const entries = [...entryRefs.current.entries()]
    if (!entries.length) return undefined

    let frameId = null
    const updateActiveYear = () => {
      frameId = null
      const viewportCenter = window.innerHeight / 2
      let nearestYear = activeYearRef.current
      let nearestDistance = Number.POSITIVE_INFINITY
      entries.forEach(([entryYear, node]) => {
        const rect = node.getBoundingClientRect()
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestYear = entryYear
        }
      })
      if (nearestYear && nearestYear !== activeYearRef.current) {
        activeYearRef.current = nearestYear
        setActiveYear(nearestYear)
      }
    }
    const scheduleUpdate = () => {
      if (frameId === null) frameId = window.requestAnimationFrame(updateActiveYear)
    }
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(scheduleUpdate, OBSERVER_OPTIONS)
    entries.forEach(([, node]) => observer?.observe(node))
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    scheduleUpdate()
    return () => {
      observer?.disconnect()
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (frameId !== null) window.cancelAnimationFrame(frameId)
    }
  }, [])

  const validCoverEntries = publicGalleryData.filter((entry) => entry.cover && !failedCovers.has(entry.year))
  const activeCover = activeEntry?.cover && loadedCovers.has(activeEntry.year) ? activeEntry.cover : ''
  const activeCoverIndex = validCoverEntries.findIndex((entry) => entry.year === activeEntry?.year)
  const preloadYears = new Set([
    activeEntry?.year,
    ...validCoverEntries.slice(Math.max(activeCoverIndex - 1, 0), activeCoverIndex + 2).map((entry) => entry.year),
    validCoverEntries[0]?.year,
  ])

  return (
    <main
      className="public-gallery-page"
      style={activeCover ? { '--public-gallery-active-cover': `url("${activeCover}")` } : undefined}
    >
      <section className="public-gallery-shell" aria-labelledby="public-gallery-title">
        <header className="public-gallery-heading">
          <div>
            <span className="section-kicker">Works / 审美积累</span>
            <h1 id="public-gallery-title">审美积累</h1>
            <p>从现在开始向未来延伸，把每一年的图片整理成一条可以逐年打开的图册时间线。</p>
          </div>
          <Link to="/interests" className="public-gallery-back-link"><span aria-hidden="true">←</span> 返回个人兴趣</Link>
        </header>
        <div className="public-gallery-context" aria-live="polite"><span className="public-gallery-context-label">年份图册</span><strong>{timelineRange}</strong><span>点击任意节点进入对应图册</span></div>
        <ol className="public-gallery-timeline" aria-label={`审美积累年份时间线，顶部 ${publicGalleryData[0]?.year ?? ''}，底部 ${publicGalleryData[publicGalleryData.length - 1]?.year ?? ''}`}>
          {publicGalleryData.map((entry) => {
            const hasCover = Boolean(entry.cover)
            const isLoaded = loadedCovers.has(entry.year)
            const isFailed = failedCovers.has(entry.year)
            const isPreloaded = preloadYears.has(entry.year)
            const coverStatus = !hasCover ? 'empty' : isFailed ? 'error' : isLoaded ? 'loaded' : 'loading'
            return (
              <li key={entry.id} ref={(node) => { if (node) entryRefs.current.set(entry.year, node); else entryRefs.current.delete(entry.year) }} data-year={entry.year} className={`public-gallery-entry public-gallery-entry-${entry.side} public-gallery-entry--${entry.status} ${activeYear === entry.year ? 'is-active' : ''}`} data-text={entry.title}>
                <div className="public-gallery-marker" aria-hidden="true"><span /></div>
                <article className="public-gallery-card">
                  <Link to={`/works/painting/${entry.year}`} className="public-gallery-card-link" aria-label={`打开 ${entry.year} 图册`}>
                    <div className={`public-gallery-art public-gallery-art--${coverStatus}`}>
                      {hasCover ? <img src={entry.cover} alt={`${entry.year} 图册封面`} loading={isPreloaded ? 'eager' : 'lazy'} fetchPriority={isPreloaded ? 'high' : 'auto'} decoding="async" onLoad={() => { setLoadedCovers((current) => new Set(current).add(entry.year)); setFailedCovers((current) => { const next = new Set(current); next.delete(entry.year); return next }) }} onError={() => { setFailedCovers((current) => new Set(current).add(entry.year)); setLoadedCovers((current) => { const next = new Set(current); next.delete(entry.year); return next }) }} /> : null}
                      <span className="public-gallery-art-status" aria-live="polite">{!hasCover || isFailed ? '图片暂不可用' : isLoaded ? '' : '图片加载中…'}</span>
                      <span className="public-gallery-art-caption">{entry.year}</span>
                    </div>
                    <div className="public-gallery-card-body"><span className="public-gallery-period">Album / {entry.year}</span><h2>{entry.title}</h2><p className="public-gallery-summary">{entry.summary}</p><p className="public-gallery-note">{entry.note}</p><span className="public-gallery-focus-button">进入图册 <span aria-hidden="true">→</span></span></div>
                  </Link>
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
