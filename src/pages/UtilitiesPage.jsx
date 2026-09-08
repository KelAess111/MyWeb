import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function UtilitiesPage() {
  const [user, setUser] = useState(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    if (!supabase) {
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleAnkiClick = (e) => {
    if (!user) {
      e.preventDefault()
      setShowLoginPrompt(true)
    }
  }

  const handleLogin = async () => {
    if (!supabase) {
      alert('Supabase未配置')
      return
    }

    const email = prompt('请输入邮箱地址：')
    if (!email) return

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/utilities/anki`,
        },
      })

      if (error) throw error

      alert('验证链接已发送到您的邮箱，请查收并点击链接登录')
      setShowLoginPrompt(false)
    } catch (error) {
      alert('登录失败：' + error.message)
    }
  }

  return (
    <main className="utilities-page">
      <div className="utilities-container">
        <header className="utilities-header">
          <h1 className="utilities-title">功能区</h1>
          <p className="utilities-subtitle">探索更多实用工具</p>
        </header>

        <div className="utilities-grid">
          <Link
            to="/utilities/anki"
            className="utility-card"
            onClick={handleAnkiClick}
          >
            <div className="utility-card-icon">📚</div>
            <h2 className="utility-card-title">Anki 学习</h2>
            <p className="utility-card-description">
              日语与英语词库练习，支持错题本和连击特效
            </p>
            {!user && <span className="utility-card-badge">需要登录</span>}
          </Link>

          <div className="utility-card utility-card--disabled">
            <div className="utility-card-icon">🔧</div>
            <h2 className="utility-card-title">更多功能</h2>
            <p className="utility-card-description">敬请期待...</p>
          </div>
        </div>

        {showLoginPrompt && (
          <div className="login-modal-overlay" onClick={() => setShowLoginPrompt(false)}>
            <div className="login-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="login-modal-title">需要登录</h2>
              <p className="login-modal-text">
                使用 Anki 学习功能需要登录账号。我们将通过邮箱验证码的方式为您创建账号。
              </p>
              <div className="login-modal-actions">
                <button
                  type="button"
                  className="login-modal-btn login-modal-btn--primary"
                  onClick={handleLogin}
                >
                  登录 / 注册
                </button>
                <button
                  type="button"
                  className="login-modal-btn login-modal-btn--secondary"
                  onClick={() => setShowLoginPrompt(false)}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default UtilitiesPage
