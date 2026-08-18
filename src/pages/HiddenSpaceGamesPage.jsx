import { Link, useOutletContext } from 'react-router-dom'
import { hiddenSpaceGames } from '../data/hiddenSpaceGames'

function HiddenSpaceGamesPage() {
  const { setActiveScene, defaultScene } = useOutletContext()

  return (
    <section className="section hidden-archive-page hidden-space-games-page">
      <div className="section-heading hidden-archive-heading">
        <span className="section-kicker">Afterlight / 游戏</span>
        <h1 className="category-page-title">游戏角落</h1>
        <p>
          这里会放一些更私人、更不那么“完成品”的游戏记录。它们可能粗糙，但通常也更诚实。
        </p>
      </div>

      <div className="category-page-actions">
        <Link to=".." relative="path" className="btn secondary">
          返回隐藏空间首页
        </Link>
      </div>

      <div className="hidden-space-game-list">
        {hiddenSpaceGames.map((game) => (
          <article key={game.id} className="work-category-panel hidden-space-game-card">
            <div
              className="hidden-space-game-shot"
              tabIndex={0}
              onMouseEnter={() =>
                setActiveScene((current) => ({
                  ...current,
                  ...game.ocHoverLine,
                }))
              }
              onMouseLeave={() => setActiveScene(defaultScene)}
              onFocus={() =>
                setActiveScene((current) => ({
                  ...current,
                  ...game.ocHoverLine,
                }))
              }
              onBlur={() => setActiveScene(defaultScene)}
            >
              <span>{game.screenshotLabel}</span>
            </div>

            <div className="hidden-space-game-copy">
              <h2>{game.title}</h2>
              <div className="hidden-space-game-section">
                <h3>制作历程</h3>
                <p>{game.journey}</p>
              </div>
              <div className="hidden-space-game-section">
                <h3>故事</h3>
                <p>{game.story}</p>
              </div>
              <div className="hidden-space-game-section">
                <h3>下载 / 体验链接</h3>
                <a href={game.experienceLink} className="btn secondary">
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

export default HiddenSpaceGamesPage
