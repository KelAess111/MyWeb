import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { workCategories } from '../data/workCategories'

const CLICK_DELAY = 250

function InterestsPage() {
  const navigate = useNavigate()
  const [pinnedCategoryId, setPinnedCategoryId] = useState(null)
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null)
  const clickTimerRef = useRef(null)

  useEffect(() => () => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)
  }, [])

  const handleClick = (categoryId) => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)
    clickTimerRef.current = window.setTimeout(() => {
      setPinnedCategoryId((current) => (current === categoryId ? null : categoryId))
      clickTimerRef.current = null
    }, CLICK_DELAY)
  }

  const handleDoubleClick = (path) => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)
    clickTimerRef.current = null
    navigate(path)
  }

  const handleFocus = (categoryId) => {
    setHoveredCategoryId(categoryId)
  }

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setHoveredCategoryId(null)
    }
  }

  return (
    <main className="interests-page">
      <section className="section interests-section" id="interests">
        <div className="section-heading">
          <span className="section-kicker">Interests Directory</span>
          <h1>个人兴趣</h1>
          <p>从兴趣与创作片段出发，打开一个分区后即可进入对应的独立页面。</p>
        </div>

        <div className="interests-accordion">
          {workCategories.map((category) => {
            const isPinned = pinnedCategoryId === category.id
            const isHovered = hoveredCategoryId === category.id
            const isActive = isPinned || (!pinnedCategoryId && isHovered)
            const panelId = `interest-panel-${category.id}`
            const buttonId = `interest-trigger-${category.id}`

            return (
              <article
                key={category.id}
                className={`interest-accordion-item accent-${category.accent}${isActive ? ' is-active' : ''}${isPinned ? ' is-open' : ''}`}
                onMouseEnter={() => setHoveredCategoryId(category.id)}
                onMouseLeave={() => setHoveredCategoryId(null)}
                onFocus={() => handleFocus(category.id)}
                onBlur={handleBlur}
              >
                <h2 className="interest-accordion-heading">
                  <button
                    id={buttonId}
                    type="button"
                    className="interest-accordion-trigger"
                    aria-expanded={isActive}
                    aria-controls={panelId}
                    onClick={() => handleClick(category.id)}
                    onDoubleClick={() => handleDoubleClick(category.path)}
                  >
                    <span className="interest-accordion-trigger-copy">
                      <span className="interest-accordion-eyebrow">{category.id}</span>
                      <span className="interest-accordion-title">{category.title}</span>
                    </span>
                    <span className="interest-accordion-icon" aria-hidden="true">{isPinned ? '−' : '+'}</span>
                  </button>
                </h2>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="interest-accordion-panel"
                  aria-hidden={!isActive}
                >
                  <p>{category.summary}</p>
                  <p>{category.intro}</p>
                  <Link to={category.path} className="btn secondary">进入{category.title} →</Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default InterestsPage
