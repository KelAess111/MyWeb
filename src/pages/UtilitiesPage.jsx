import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// 检查是否为本地编辑模式
function isLocalEditMode() {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem('localEditMode') === 'true'
  } catch {
    return false
  }
}

function UtilitiesPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const isEditMode = isLocalEditMode()

  useEffect(() => {
    // 编辑模式下跳过登录检查
    if (isEditMode) {
      setUser({ id: 'local-edit-mode' })
      return
    }

    checkUser()
  }, [isEditMode])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Check user failed:', error)
    }
  }

  const handleAnkiClick = (e) => {
    // 编辑模式下直接允许访问
    if (isEditMode) {
      return
    }

    // 未登录则跳转到登录页
    if (!user) {
      e.preventDefault()
      navigate('/login', { state: { from: '/utilities/anki' } })
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
              日语与英语词库练习。
            </p>
            {!user && <span className="utility-card-badge">需要登录</span>}
          </Link>

          <div className="utility-card utility-card--disabled">
            <div className="utility-card-icon">🔧</div>
            <h2 className="utility-card-title">更多功能</h2>
            <p className="utility-card-description">敬请期待...</p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default UtilitiesPage
