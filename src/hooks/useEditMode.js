import { useLocation } from 'react-router-dom'

export default function useEditMode() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  if (params.get('preview') === 'true') return false
  if (params.get('editMode') === 'local') return import.meta.env.DEV
  try {
    if (sessionStorage.getItem('previewMode') === 'true') return false
    return import.meta.env.DEV && (import.meta.env.VITE_EDIT_MODE === 'true' || localStorage.getItem('localEditMode') === 'true')
  } catch {
    return false
  }
}
