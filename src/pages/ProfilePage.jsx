import { useState } from 'react'
import { Link } from 'react-router-dom'
import ContactPanel from '../components/ContactPanel'
import QASection from '../components/QASection'
import avatarImage from '../assets/about/头像.jpg'

function ProfilePage() {
  const [isInterestsOpen, setIsInterestsOpen] = useState(false)

  const interestLinks = [
    {
      to: '/works/painting',
      label: '审美积累',
      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    },
    {
      to: '/writing',
      label: '小作文',
      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
    },
    {
      to: '/works/modeling',
      label: '推荐书目',
      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    },
    {
      to: '/works/games',
      label: '游戏',
      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>
    },
    {
      to: '/works/anime',
      label: '动漫',
      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    },
    {
      to: '/works/music',
      label: '音乐',
      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
    },
  ]

  return (
    <main className="profile-page">
      <section className="section profile-intro" id="intro">
        <div className="profile-card-container">
          <div className="profile-card">
            {/* 头像区域 */}
            <div className="profile-card-avatar-wrapper">
              <div className="profile-card-avatar">
                <img src={avatarImage} alt="KelAess Avatar" className="profile-avatar-image" />
              </div>

              {/* 兴趣导航圆盘 */}
              <div className="interests-orbit">
                <button
                  className={`interests-toggle ${isInterestsOpen ? 'active' : ''}`}
                  onClick={() => setIsInterestsOpen(!isInterestsOpen)}
                  aria-label="展开兴趣导航"
                >
                  <span></span>
                </button>
                <div className={`interests-links ${isInterestsOpen ? 'open' : ''}`}>
                  {interestLinks.map((link, index) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="interest-link"
                      style={{ '--delay': `${index * 0.1}s` }}
                      aria-label={link.label}
                      title={link.label}
                    >
                      <span className="interest-icon">{link.svg}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 主要信息 */}
            <div className="profile-card-body">
              <div className="profile-card-title-group">
                <h1 className="profile-card-name">
                  KelAess <span className="profile-card-divider">/</span> 柯埃斯
                </h1>
                <span className="profile-card-badge">创作者</span>
              </div>

              <p className="profile-card-bio">
                18 岁的多媒介创作者，正在把游戏设计、美术绘画、音乐制作、3D 建模与写作慢慢整理进同一个空间。
              </p>

              {/* 标签云 */}
              <div className="profile-tags-section">
                <div className="profile-tags">
                  <span className="profile-tag accent-violet">#游戏设计</span>
                  <span className="profile-tag accent-rose">#美术绘画</span>
                  <span className="profile-tag accent-cyan">#音乐制作</span>
                  <span className="profile-tag accent-amber">#3D建模</span>
                  <span className="profile-tag accent-emerald">#写作</span>
                  <span className="profile-tag accent-sky">#世界观构建</span>
                </div>
              </div>

              {/* 快速信息 */}
              <div className="profile-card-meta">
                <div className="profile-meta-item">
                  <span className="profile-meta-label">创作理念</span>
                  <span className="profile-meta-value">用不同媒介讲述同一个世界</span>
                </div>
                <div className="profile-meta-item">
                  <span className="profile-meta-label">当前状态</span>
                  <span className="profile-meta-value">持续探索中</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QASection />

      <ContactPanel />
    </main>
  )
}

export default ProfilePage
