// Capture recovery intent before Supabase consumes the URL fragment.
export function isRecoveryLocation(location) {
  return location?.pathname === '/account/update-password'
    || new URLSearchParams((location?.hash || '').replace(/^#/, '')).get('type') === 'recovery'
}

let active = typeof window !== 'undefined' && isRecoveryLocation(window.location)
const listeners = new Set()
export const getRecoverySnapshot = () => active
export function subscribeRecovery(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export function markPasswordRecovery() {
  active = true
  listeners.forEach(listener => listener())
}

export async function changeAccountPassword(client, password, confirmation) {
  if (password.length < 12) throw new Error('新密码请至少使用 12 个字符。')
  if (password !== confirmation) throw new Error('两次输入的密码不一致。')
  const { data, error } = await client.auth.getUser()
  if (error || !data?.user) throw new Error('重置链接已失效，请重新发送重置邮件并打开最新链接。')
  const result = await client.auth.updateUser({ password })
  if (result.error) throw new Error('未能更新密码：请检查密码要求；若链接过期，请重新发送重置邮件。')
  // Password update and session revocation are separate operations.
  try {
    const signedOut = await client.auth.signOut({ scope: 'global' })
    return { sessionsRevoked: !signedOut.error }
  } catch {
    return { sessionsRevoked: false }
  }
}
