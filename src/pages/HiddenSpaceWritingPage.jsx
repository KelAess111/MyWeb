import { Link, useOutletContext } from 'react-router-dom'
import { hiddenSpaceWriting } from '../data/hiddenSpaceWriting'

function HiddenSpaceWritingPage() {
  const { setActiveScene, defaultScene } = useOutletContext()

  return (
    <section className="section hidden-archive-page hidden-space-writing-page">
      <div className="section-heading hidden-archive-heading">
        <span className="section-kicker">Afterlight / 写作</span>
        <h1 className="category-page-title">写作角落</h1>
        <p>
          这里会收集一些文字碎片、片段草稿和未完成的想法。它们也许还没长成完整故事，但已经足够留下痕迹。
        </p>
      </div>

      <div className="category-page-actions">
        <Link to=".." relative="path" className="btn secondary">
          返回隐藏空间首页
        </Link>
      </div>

      <div className="hidden-space-game-list">
        {hiddenSpaceWriting.map((entry) => (
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
              <span>{entry.excerptLabel}</span>
            </div>

            <div className="hidden-space-game-copy">
              <h2>{entry.title}</h2>
              <div className="hidden-space-game-section">
                <h3>文本说明</h3>
                <p>{entry.note}</p>
              </div>
              <div className="hidden-space-game-section">
                <h3>补充 / 注记</h3>
                <p>{entry.supplement}</p>
              </div>
              <div className="hidden-space-game-section">
                <h3>文档链接</h3>
                <a href={entry.documentLink} className="btn secondary">
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

export default HiddenSpaceWritingPage
