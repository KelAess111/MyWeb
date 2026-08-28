import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { articles } from '../data/articleData'

function SharePage() {
  const navigate = useNavigate()
  const [hoveredId, setHoveredId] = useState(null)
  const clickTimerRef = useRef(null)
  const rippleRefs = useRef(new Map())

  useEffect(() => () => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)
  }, [])

  const handleCardClick = () => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null
    }, 300)
  }

  const handleCardDoubleClick = (article, event) => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)
    clickTimerRef.current = null

    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const ripple = document.createElement('span')
    ripple.className = 'article-card-ripple'
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    card.appendChild(ripple)

    rippleRefs.current.set(article.id, ripple)

    window.setTimeout(() => {
      navigate(`/share/${article.slug}`)
    }, 400)
  }

  return (
    <main className="share-page">
      <section className="section share-section">
        <div className="section-heading">
          <span className="section-kicker">Article Library / 文章分享</span>
          <h1>资料分享</h1>
          <p>双击卡片即可阅读完整文章。这里收录值得分享的文字、资料与思考片段。</p>
        </div>

        {articles.length ? (
          <div className="article-grid">
            {articles.map((article, index) => {
              const isHovered = hoveredId === article.id

              return (
                <article
                  key={article.id}
                  className={`article-card${isHovered ? ' is-hovered' : ''}`}
                  style={{ '--article-index': index }}
                  onClick={handleCardClick}
                  onDoubleClick={(event) => handleCardDoubleClick(article, event)}
                  onMouseEnter={() => setHoveredId(article.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      navigate(`/share/${article.slug}`)
                    }
                  }}
                >
                  <div className="article-card-content">
                    <h2 className="article-card-title">{article.title}</h2>
                    {article.excerpt ? (
                      <p className="article-card-excerpt">{article.excerpt}</p>
                    ) : null}
                    <span className="article-card-hint" aria-hidden="true">双击阅读 →</span>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="article-empty-state">
            <strong>暂无文章</strong>
            <p>文章资料将在这里展示。</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default SharePage
