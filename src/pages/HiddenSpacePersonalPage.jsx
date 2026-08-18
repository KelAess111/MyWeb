import { Link, useOutletContext } from 'react-router-dom'
import { hiddenSpacePersonal } from '../data/hiddenSpacePersonal'

function HiddenSpacePersonalPage() {
  const { setActiveScene, defaultScene } = useOutletContext()

  return (
    <section className="section hidden-archive-page hidden-space-personal-page">
      <div className="section-heading hidden-archive-heading">
        <span className="section-kicker">Afterlight / 个人</span>
        <h1 className="category-page-title">个人角落</h1>
        <p>
          这里会更轻一点，不是作品本身，而是那些会慢慢塑造作品的偏好、兴趣和个人碎片。
        </p>
      </div>

      <div className="category-page-actions">
        <Link to=".." relative="path" className="btn secondary">
          返回隐藏空间首页
        </Link>
      </div>

      <div className="hidden-space-game-list">
        {hiddenSpacePersonal.map((entry) => (
          <article key={entry.id} className="work-category-panel hidden-space-game-card">
            <div
              className="hidden-space-game-shot"
              tabIndex={0}
              onMouseEnter={() =>
                setActiveScene((current) => ({
                  ...current,
                  ...entry.ocHoverLine,
                }))
              }
              onMouseLeave={() => setActiveScene(defaultScene)}
              onFocus={() =>
                setActiveScene((current) => ({
                  ...current,
                  ...entry.ocHoverLine,
                }))
              }
              onBlur={() => setActiveScene(defaultScene)}
            >
              <span>{entry.cardLabel}</span>
            </div>

            <div className="hidden-space-game-copy">
              <h2>{entry.title}</h2>
              <div className="hidden-space-game-section">
                <h3>兴趣 / 偏好</h3>
                <p>{entry.note}</p>
              </div>
              <div className="hidden-space-game-section">
                <h3>个人补充</h3>
                <p>{entry.detail}</p>
              </div>
              <div className="hidden-space-game-section">
                <h3>相关链接</h3>
                <a href={entry.referenceLink} className="btn secondary">
                  以后会放在这里
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default HiddenSpacePersonalPage
