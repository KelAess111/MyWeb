import { useEffect, useState, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'
import { changeAccountPassword, getRecoverySnapshot, subscribeRecovery } from '../utils/passwordRecovery'
import '../styles/password-recovery.css'

export default function PasswordRecoveryGate({ children }) {
  const active = useSyncExternalStore(subscribeRecovery, getRecoverySnapshot)
  return active ? <PasswordRecoveryForm /> : children
}

function PasswordRecoveryForm() {
  const [status, setStatus] = useState('checking')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [sessionsRevoked, setSessionsRevoked] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        if (!supabase) throw new Error('当前网站尚未配置账号服务。')
        const { data, error: authError } = await supabase.auth.getUser()
        if (authError || !data?.user) throw new Error('重置链接已失效，请重新发送重置邮件并打开最新链接。')
        if (!cancelled) {
          // Only clear the callback URL after the SDK has processed its tokens.
          window.history.replaceState(null, '', '/account/update-password')
          setStatus('ready')
        }
      } catch (failure) {
        if (!cancelled) { setError(failure.message); setStatus('unavailable') }
      }
    }
    check()
    return () => { cancelled = true }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (status !== 'ready') return
    setError('')
    setStatus('saving')
    try {
      const result = await changeAccountPassword(supabase, password, confirmation)
      setPassword('')
      setConfirmation('')
      setSessionsRevoked(result.sessionsRevoked)
      setStatus('done')
    } catch (failure) {
      setError(failure.message)
      setStatus('ready')
    }
  }

  return (
    <main className="password-recovery">
      <section className="password-recovery-card" aria-labelledby="password-recovery-title">
        <img src="/rui-icon.png" width="72" height="72" alt="" />
        <h1 id="password-recovery-title">{status === 'done' ? '密码已更新' : '设置新密码'}</h1>
        {status === 'checking' && <p role="status">正在验证重置链接…</p>}
        {error && <p role="alert">{error}</p>}
        {['ready', 'saving'].includes(status) && <>
          <p>为当前账号设置一个独立的新密码。</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="new-password">新密码</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)} disabled={status === 'saving'} />
            <label htmlFor="confirm-password">再次输入新密码</label>
            <input id="confirm-password" type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={status === 'saving'} />
            <small>至少 12 个字符，避免与隐藏入口口令相同。</small>
            <button type="submit" disabled={status === 'saving'}>{status === 'saving' ? '正在保存…' : '保存新密码'}</button>
          </form>
        </>}
        {status === 'done' && <div role="status">
          <p>新密码已保存，下次登录请使用新密码。</p>
          <p>{sessionsRevoked ? '已请求退出所有设备；已经签发的访问凭证会在到期后失效。' : '退出旧会话未完成，请在账号管理中检查旧会话。'}</p>
          <p>如果这是作者账号，请同步更新本地项目 .env.local 中的 VITE_AUTHOR_PASSWORD，再重启桌面 App。</p>
        </div>}
        <a href="/">返回首页</a>
      </section>
    </main>
  )
}
