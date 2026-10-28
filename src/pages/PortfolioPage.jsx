import { portfolioProjects } from '../data/portfolioProjects'
import '../styles/portfolio.css'

function PortfolioPage() {
  return (
    <main className="portfolio-page">
      <section className="section portfolio-projects-section" id="portfolio">
        <div className="section-heading">
          <span className="section-kicker">Portfolio / Selected Games</span>
          <h1>个人作品集</h1>
          <p>从光影中的探索，到异国旅途里的故事。这里记录我参与开发的游戏，以及由我独立推进的作品。</p>
        </div>

        <nav className="portfolio-index" aria-label="游戏作品目录">
          {portfolioProjects.map(project => (
            <a key={project.id} href={`#${project.id}`}>
              <span aria-hidden="true">{project.number}</span>{project.title}
            </a>
          ))}
        </nav>

        <div className="portfolio-project-list">
          {portfolioProjects.map(project => (
            <article key={project.id} id={project.id} className={`portfolio-project portfolio-project--${project.id}`} aria-labelledby={`${project.id}-title`}>
              <div className="portfolio-project-visual">
                <img src={project.cover} alt={project.coverAlt} loading={project.number === '01' ? 'eager' : 'lazy'} decoding="async" />
                <div className="portfolio-project-visual-shade" aria-hidden="true" />
                <span className="portfolio-project-number" aria-hidden="true">{project.number}</span>
                <p>{project.subtitle}</p>
              </div>
              <div className="portfolio-project-content">
                <div className="portfolio-project-meta">
                  <span>{project.category}</span><span>{project.status}</span>
                </div>
                <h2 id={`${project.id}-title`}>{project.title}</h2>
                <p className="portfolio-project-description">{project.description}</p>
                <dl className="portfolio-project-facts">
                  <div><dt>我的角色</dt><dd>{project.role}</dd></div>
                  <div><dt>制作工具</dt><dd>{project.engine}</dd></div>
                  <div><dt>试玩平台</dt><dd>{project.platform}</dd></div>
                </dl>
                <div className="portfolio-project-role">
                  <h3>我负责的部分</h3>
                  <p>{project.responsibility}</p>
                  {project.contributions?.length > 0 && <details>
                    <summary>展开制作细节</summary>
                    <ul>{project.contributions.map(item => (
                      <li key={typeof item === 'string' ? item : item.title}>
                        {typeof item === 'string' ? item : <><strong className="portfolio-contribution-title">{item.title}</strong><span>{item.text}</span></>}
                      </li>
                    ))}</ul>
                    {project.collaborationNote && <p className="portfolio-collaboration-note">{project.collaborationNote}</p>}
                  </details>}
                </div>
                {project.disclosure && <p className="portfolio-project-disclosure">{project.disclosure}</p>}
                <div className="portfolio-project-download">
                  <div className="portfolio-download-actions">
                    {project.baiduUrl && <a href={project.baiduUrl} className="btn primary" target="_blank" rel="noopener noreferrer" aria-label={`通过百度网盘下载《${project.title}》（新窗口打开）`}>百度网盘下载 <span aria-hidden="true">↗</span></a>}
                    {project.downloadUrl && <a href={project.downloadUrl} className={`btn ${project.baiduUrl ? 'portfolio-download-backup' : 'primary'}`} target="_blank" rel="noopener noreferrer" aria-label={`通过 GitHub 下载《${project.title}》Windows 试玩版（新窗口打开）`}>{project.baiduUrl ? 'GitHub 备用下载' : '下载 Windows 试玩版'} <span aria-hidden="true">↗</span></a>}
                    {!project.baiduUrl && !project.downloadUrl && <span className="portfolio-download-pending">试玩包待上传</span>}
                  </div>
                  {project.baiduCode && <p className="portfolio-baidu-info">提取码：<strong>{project.baiduCode}</strong><span>链接已包含提取码</span></p>}
                  {project.baiduFileName && <p className="portfolio-download-filename">网盘文件：{project.baiduFileName}</p>}
                  <p>{project.downloadNote}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default PortfolioPage
