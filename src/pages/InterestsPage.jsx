import { useState } from 'react'
import { Link } from 'react-router-dom'
import { workCategories } from '../data/workCategories'

function InterestsPage() {
  const [openCategoryId, setOpenCategoryId] = useState(null)

  const toggleCategory = (categoryId) => {
    setOpenCategoryId((current) => (current === categoryId ? null : categoryId))
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
            const isOpen = openCategoryId === category.id
            const panelId = `interest-panel-${category.id}`
            const buttonId = `interest-trigger-${category.id}`

            return (
              <article key={category.id} className={`interest-accordion-item accent-${category.accent}${isOpen ? ' is-open' : ''}`}>
                <h2 className="interest-accordion-heading">
                  <button
                    id={buttonId}
                    type="button"
                    className="interest-accordion-trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <span>
                      <span className="interest-accordion-eyebrow">{category.id}</span>
                      <span className="interest-accordion-title">{category.title}</span>
                    </span>
                    <span className="interest-accordion-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                  </button>
                </h2>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="interest-accordion-panel"
                  hidden={!isOpen}
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
