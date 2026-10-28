export function resolveEditMode({ dev, enabled, hostname, search, preview, edit }) {
  if (!dev || !enabled || !['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) return false
  const params = new URLSearchParams(search)
  if (params.get('preview') === 'true') return false
  if (params.get('editMode') === 'local') return true
  return preview !== 'true' && edit === 'true'
}

export function isLocalEditMode() {
  if (typeof window === 'undefined') return false
  try {
    const params = new URLSearchParams(window.location.search)
    const canEdit = resolveEditMode({ dev: import.meta.env.DEV, enabled: import.meta.env.VITE_EDIT_MODE === 'true', hostname: window.location.hostname, search: window.location.search, preview: sessionStorage.getItem('previewMode'), edit: localStorage.getItem('localEditMode') })
    if (params.get('preview') === 'true' || !import.meta.env.DEV) {
      sessionStorage.setItem('previewMode', 'true')
      localStorage.removeItem('localEditMode')
    } else if (canEdit && params.get('editMode') === 'local') {
      sessionStorage.removeItem('previewMode')
      localStorage.setItem('localEditMode', 'true')
    }
    return canEdit
  } catch { return false }
}

export function requireLocalEditMode() {
  if (!isLocalEditMode()) throw new Error('请在本地编辑模式中修改内容')
}

export async function saveLocalContent(endpoint, data) {
  requireLocalEditMode()
  const response = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Kel-Edit-Mode': 'local' }, body: JSON.stringify(data) })
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || '本地保存失败')
}
