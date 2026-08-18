import { Link, useOutletContext } from 'react-router-dom'
import { hiddenSpacePainting } from '../data/hiddenSpacePainting'

function HiddenSpacePaintingPage() {
  const { setActiveScene, defaultScene } = useOutletContext()

  return (
    <section className="section hidden-archive-page hidden-space-painting-page">
      <div className="section-heading hidden-archive-heading">
        <span className="section-kicker">Afterlight / 绘画</span>
        <h1 className="category-page-title">绘画角落</h1>
        <p>
          这里会收纳那些还不够正式、但足够真实的画面。它们也许还在变化，可它们已经留下痕迹了。
        </p>
      </div>

      <div className="category-page-actions">
        <Link to=".." relative="path" className="btn secondary">
          返回隐藏空间首页
        </Link>
      </div>

      <div className="hidden-space-game-list">
        {hiddenSpacePainting.map((piece) => (
          <article key={piece.id} className="work-category-panel hidden-space-game-card">
            <div
              className="hidden-space-game-shot"
              tabIndex={0}
              onMouseEnter={() =>
                setActiveScene((current) => ({
                  ...current,
                  ...piece.ocHoverLine,
                }))
              }
              onMouseLeave={() => setActiveScene(defaultScene)}
              onFocus={() =>
                setActiveScene((current) => ({
                  ...current,
                  ...piece.ocHoverLine,
                }))
              }
              onBlur={() => setActiveScene(defaultScene)}
            >
              <span>{piece.imageLabel}</span>
            </div>

            <div className="hidden-space-game-copy">
              <h2>{piece.title}</h2>
              <div className="hidden-space-game-section">
                <h3>作品说明</h3>
                <p>{piece.note}</p>
              </div>
              <div className="hidden-space-game-section">
                <h3>过程 / 感想</h3>
                <p>{piece.process}</p>
              </div>
              <div className="hidden-space-game-section">
                <h3>参考 / 外链</h3>
                <a href={piece.referenceLink} className="btn secondary">
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

export default HiddenSpacePaintingPage
