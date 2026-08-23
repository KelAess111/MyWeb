import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

function SiteHeader({ replayIntroEnabled, setReplayIntroEnabled }) {
  const location = useLocation()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsSettingsOpen(false), 0)
    return () => window.clearTimeout(timer)
  }, [location.pathname, location.hash])

  useEffect(() => {
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 18)
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })

    return () => window.removeEventListener('scroll', updateScrollState)
  }, [])

  return (
    <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`.trim()}>
      <div className="navbar">
        <NavLink className="logo" to="/profile">
          KelAess / 柯埃斯
        </NavLink>

        <div className="nav-shell nav-shell--simple">
          <nav className="nav-primary" aria-label="主导航">
            <NavLink to="/" end>
              首页
            </NavLink>
          </nav>

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
