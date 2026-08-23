import { createContext, useContext } from 'react'

export const MusicPlayerContext = createContext(null)

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext)

  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider')
  }

  return context
}
