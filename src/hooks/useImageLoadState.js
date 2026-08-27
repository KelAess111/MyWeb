import { useCallback, useState } from 'react'

export function useImageLoadState(src) {
  const [state, setState] = useState(() => ({ src, status: src ? 'loading' : 'empty' }))
  const status = state.src === src ? state.status : src ? 'loading' : 'empty'

  const handleLoad = useCallback((event) => {
    setState({ src, status: 'loaded' })
    return event
  }, [src])

  const handleError = useCallback((event) => {
    setState({ src, status: 'error' })
    return event
  }, [src])

  return { status, handleLoad, handleError }
}
