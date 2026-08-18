import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { workCategories } from '../data/workCategories'

function SiteHeader({ replayIntroEnabled, setReplayIntroEnabled }) {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isWorksMenuOpen, setIsWorksMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsNavOpen(false)
    setIsWorksMenuOpen(false)
    setIsSettingsOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 18)
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })

    return () => window.removeEventListener('scroll', updateScrollState)
  }, [])

  const isOnHomePage = location.pathname === '/'

  return (
    <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`.trim()}>
      <div className="navbar">
        <NavLink className="logo" to="/">
          KelAess / 柯埃斯
        </NavLink>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={isNavOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsNavOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-shell ${isNavOpen ? 'is-open' : ''}`} id="primary-navigation">
          <nav className="nav-primary" aria-label="主导航">
            <a href={isOnHomePage ? '#home' : '/#home'}>首页</a>
            <a href={isOnHomePage ? '#about' : '/#about'}>关于我</a>
            <a href={isOnHomePage ? '#works' : '/#works'}>作品总览</a>
            <a href={isOnHomePage ? '#featured' : '/#featured'}>精选展示</a>
            <a href={isOnHomePage ? '#contact' : '/#contact'}>联系</a>
          </nav>

          <div className={`works-menu ${isWorksMenuOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="works-menu-toggle"
              aria-expanded={isWorksMenuOpen}
              aria-controls="works-submenu"
              onClick={() => setIsWorksMenuOpen((current) => !current)}
            >
              <span>作品分类</span>
              <span className="works-menu-caret" aria-hidden="true">
                ▾
              </span>
            </button>

            <div className="works-submenu" id="works-submenu">
              {workCategories.map((category) => (
                <NavLink key={category.id} to={category.path} className={`submenu-link accent-${category.accent}`}>
                  {category.navLabel}
                </NavLink>
              ))}
            </div>
          </div>

          <div className={`settings-menu ${isSettingsOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="settings-menu-toggle"
              aria-expanded={isSettingsOpen}
              aria-controls="settings-submenu"
              onClick={() => setIsSettingsOpen((current) => !current)}
            >
              <span>设置</span>
              <span className="works-menu-caret" aria-hidden="true">
                ▾
              </span>
            </button>

            <div className="settings-submenu" id="settings-submenu">
              <label className="settings-checkbox-row">
                <input
                  type="checkbox"
                  checked={replayIntroEnabled}
                  onChange={(event) => setReplayIntroEnabled(event.target.checked)}
                />
                <span>显示入场动画</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
