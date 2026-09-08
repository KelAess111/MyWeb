import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Annotate from './Annotate'

function SiteHeader({ replayIntroEnabled, setReplayIntroEnabled }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/')
  }

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
            {user ? (
              <button
                type="button"
                className="nav-auth-btn nav-logout-btn"
                onClick={handleLogout}
                title="登出"
              >
                登出
              </button>
            ) : (
              <NavLink to="/login" className="nav-auth-btn nav-login-btn">
                登录
              </NavLink>
            )}
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
