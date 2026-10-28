export function createAuthorSessionManager({ client,isEditing,credentials,expectedUserId }) {
  let signingIn = null
  return async function ensureAuthorSession() {
    if (!isEditing()) return null
    if (!client) throw new Error('missing-supabase-config')
    if (signingIn) return signingIn
    signingIn = (async () => {
      const { data } = await client.auth.getSession()
      if (data?.session?.user?.id === expectedUserId) return data.session
      const { email,password } = credentials()
      if (!email || !password) throw new Error('missing-author-credentials')
      let result
      try { result = await client.auth.signInWithPassword({email,password}) }
      catch { throw new Error('author-network-error') }
      if (result.error) {
        if (result.error.code === 'invalid_credentials' || result.error.status === 400) throw new Error('author-login-invalid')
        throw new Error('author-network-error')
      }
      if (result.data?.session?.user?.id !== expectedUserId) throw new Error('author-account-mismatch')
      return result.data.session
    })().finally(() => { signingIn = null })
    return signingIn
  }
}

export function authorConnectionMessage(error) {
  const messages = {
    'missing-supabase-config':'本地尚未配置 Supabase，请检查 .env.local 中的网站地址和公开连接密钥。',
    'missing-author-credentials':'已配置 Supabase，但缺少本地作者登录信息。请检查 .env.local 中的作者邮箱和密码。',
    'author-login-invalid':'Supabase 作者登录失败，请检查 .env.local 中的作者邮箱和密码；不需要上传网站。',
    'author-network-error':'暂时无法连接 Supabase，请检查网络后重试。',
    'author-account-mismatch':'本地登录账号不是这个网站的作者，请检查作者账号配置。',
    'missing-author-session':'Supabase 作者会话尚未建立，请重新进入本地编辑模式后重试。',
  }
  return messages[error?.message] || '云端同步失败，请稍后重试。'
}
