import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
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

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const location = useLocation()
  const isEditMode = isLocalEditMode()

  useEffect(() => {
    // 本地编辑模式直接跳过认证检查
    if (isEditMode) {
      setLoading(false)
      setUser({ id: 'local-edit-mode' })
      return
    }

    // 检查 Supabase 配置
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured, redirecting to login')
      setLoading(false)
      setUser(null)
      return
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isEditMode])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Check user status failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // 未登录且非编辑模式，跳转到登录页
  if (!user && !isEditMode) {
    console.log('Redirecting to login. user:', user, 'isEditMode:', isEditMode, 'from:', location.pathname)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}

export default ProtectedRoute
