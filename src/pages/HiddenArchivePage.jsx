import { Link } from 'react-router-dom'
import { hiddenSpaceModules } from '../data/hiddenSpaceModules'

function HiddenArchivePage() {
  return (
    <section className="section hidden-archive-page">
      <div className="section-heading hidden-archive-heading">
        <span className="section-kicker">Afterlight</span>
        <h1 className="category-page-title">隐藏空间</h1>
        <p>
          这里没有必要像外面那样端正。你可以把它当作一间更轻松的角落，存放那些还不太成熟、却很真实的创作痕迹。
        </p>
      </div>

      <div className="hidden-space-module-grid">
        {hiddenSpaceModules.map((module) => (
          <Link key={module.id} to={module.path} className={`card card-link accent-${module.accent}`}>
            <h2>{module.title}</h2>
            <p>{module.summary}</p>
            <span className="card-link-hint">进入这个角落 →</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HiddenArchivePage
