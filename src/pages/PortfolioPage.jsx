function PortfolioPage() {
  return (
    <main className="portfolio-page">
      <section className="section portfolio-placeholder-section" id="portfolio">
        <div className="section-heading">
          <span className="section-kicker">Portfolio / Coming Soon</span>
          <h1>个人作品集</h1>
          <p>这里将用于展示未来整理完成的个人项目与作品。目前先保留这个入口，内容会在之后逐步加入。</p>
        </div>

        <div className="portfolio-placeholder-card" role="status">
          <span className="portfolio-placeholder-mark" aria-hidden="true">✦</span>
          <div>
            <h2>内容准备中</h2>
            <p>游戏、绘画、音乐等兴趣分区已经移到“个人兴趣”，未来的独立作品会在这里集中呈现。</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default PortfolioPage
