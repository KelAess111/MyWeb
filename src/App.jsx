import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import HiddenArchivePage from './pages/HiddenArchivePage'
import HiddenSpaceGamesPage from './pages/HiddenSpaceGamesPage'
import HiddenSpacePaintingPage from './pages/HiddenSpacePaintingPage'
import HiddenSpaceWritingPage from './pages/HiddenSpaceWritingPage'
import HiddenSpaceJournalPage from './pages/HiddenSpaceJournalPage'
import HiddenSpacePersonalPage from './pages/HiddenSpacePersonalPage'
import HiddenSpaceLayout from './components/HiddenSpaceLayout'
import BackgroundLayer from './components/BackgroundLayer'
import SiteHeader from './components/SiteHeader'
import MiniMusicPlayer from './components/MiniMusicPlayer'
import { musicTracks } from './data/musicTracks'
import './App.css'

const PLAYBACK_STORAGE_KEY = 'kel-music-player-playback'
const MESSAGE_STORAGE_KEY = 'kel-music-player-messages'
const INTRO_REPLAY_STORAGE_KEY = 'kel-home-replay-intro-enabled'

const MusicPlayerContext = createContext(null)

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function normaliseTrackSource(src) {
  if (!src) {
    return ''
  }

  return src.startsWith('public/') ? `/${src.slice('public/'.length)}` : src
}

function readStoredPlaybackState() {
  if (typeof window === 'undefined') {
    return {
      activeTrackIndex: 0,
      isPlaying: false,
      currentTime: 0,
      activeTab: 'player',
    }
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(PLAYBACK_STORAGE_KEY) ?? '{}')
    const safeIndex = Number.isInteger(parsed.activeTrackIndex) && parsed.activeTrackIndex >= 0
      ? Math.min(parsed.activeTrackIndex, Math.max(musicTracks.length - 1, 0))
      : 0

    return {
      activeTrackIndex: safeIndex,
      isPlaying: Boolean(parsed.isPlaying),
      currentTime: Number.isFinite(parsed.currentTime) ? Math.max(parsed.currentTime, 0) : 0,
      activeTab: parsed.activeTab === 'messages' ? 'messages' : 'player',
    }
  } catch {
    return {
      activeTrackIndex: 0,
      isPlaying: false,
      currentTime: 0,
      activeTab: 'player',
    }
  }
}

function readStoredMessages() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(MESSAGE_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((message) => message && typeof message.text === 'string').slice(0, 20)
  } catch {
    return []
  }
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext)

  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider')
  }

  return context
}

function MusicPlayerProvider({ children }) {
  const playbackState = useMemo(() => readStoredPlaybackState(), [])
  const [activeTrackIndex, setActiveTrackIndex] = useState(playbackState.activeTrackIndex)
  const [isPlaying, setIsPlaying] = useState(playbackState.isPlaying)
  const [activeTab, setActiveTab] = useState(playbackState.activeTab)
  const [currentTime, setCurrentTime] = useState(playbackState.currentTime)
  const [duration, setDuration] = useState(0)
  const [audioStatus, setAudioStatus] = useState('idle')
  const [messages, setMessages] = useState(() => readStoredMessages())
  const [messageName, setMessageName] = useState('')
  const [messageText, setMessageText] = useState('')
  const [messageStatus, setMessageStatus] = useState('idle')
  const audioRef = useRef(null)
  const activeTrack = musicTracks[activeTrackIndex] ?? musicTracks[0] ?? null
  const progressValue = duration > 0 ? Math.min(currentTime, duration) : currentTime

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      setAudioStatus('ready')

      if (playbackState.currentTime > 0) {
        audio.currentTime = playbackState.currentTime
        setCurrentTime(playbackState.currentTime)
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = () => {
      setAudioStatus('error')
      setIsPlaying(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audioRef.current = null
    }
  }, [playbackState.currentTime])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (!activeTrack?.src) {
      audio.removeAttribute('src')
      audio.load()
      setDuration(0)
      setCurrentTime(0)
      setAudioStatus('missing')
      setIsPlaying(false)
      return
    }

    audio.src = normaliseTrackSource(activeTrack.src)
    audio.load()
    setDuration(0)
    setCurrentTime(0)
    setAudioStatus('loading')
  }, [activeTrack?.id, activeTrack?.src])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !activeTrack?.src) {
      return
    }

    if (!isPlaying) {
      audio.pause()
      return
    }

    const playPromise = audio.play()
    if (playPromise?.catch) {
      playPromise.catch(() => {
        setIsPlaying(false)
        setAudioStatus('error')
      })
    }
  }, [activeTrack?.src, isPlaying])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      PLAYBACK_STORAGE_KEY,
      JSON.stringify({
        activeTrackIndex,
        isPlaying,
        currentTime,
        activeTab,
      }),
    )
  }, [activeTab, activeTrackIndex, currentTime, isPlaying])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  const handleTogglePlay = useCallback(() => {
    if (!activeTrack?.src) {
      setAudioStatus('missing')
      return
    }

    setIsPlaying((current) => !current)
  }, [activeTrack?.src])

  const handleSelectTrack = useCallback((index) => {
    setActiveTrackIndex(index)
    setCurrentTime(0)
    setIsPlaying(true)
  }, [])

  const handleTrackChange = useCallback((direction) => {
    setActiveTrackIndex((current) => {
      if (!musicTracks.length) {
        return 0
      }

      const nextIndex = (current + direction + musicTracks.length) % musicTracks.length
      return nextIndex
    })
    setCurrentTime(0)
    setIsPlaying(true)
  }, [])

  const handleProgressChange = useCallback((event) => {
    const nextTime = Number(event.target.value)
    const audio = audioRef.current

    if (audio && Number.isFinite(nextTime)) {
      audio.currentTime = nextTime
      setCurrentTime(nextTime)
    }
  }, [])

  const handleMessageSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      const nextText = messageText.trim()
      if (!nextText) {
        setMessageStatus('empty')
        return
      }

      setMessageStatus('sending')

      const nextMessage = {
        id: `message-${Date.now()}`,
        name: messageName.trim() || '匿名听众',
        text: nextText,
        createdAt: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }

      setMessages((current) => [nextMessage, ...current].slice(0, 20))
      setMessageText('')
      setMessageName('')
      setMessageStatus('saved_only')
    },
    [messageName, messageText],
  )

  const contextValue = useMemo(
    () => ({
      activeTab,
      activeTrack,
      activeTrackIndex,
      audioStatus,
      currentTime,
      duration,
      formatTime,
      handleMessageSubmit,
      handleProgressChange,
      handleSelectTrack,
      handleTogglePlay,
      handleTrackChange,
      isPlaying,
      messageName,
      messageStatus,
      messageText,
      messages,
      musicTracks,
      progressValue,
      setActiveTab,
      setMessageName,
      setMessageStatus,
      setMessageText,
    }),
    [
      activeTab,
      activeTrack,
      activeTrackIndex,
      audioStatus,
      currentTime,
      duration,
      handleMessageSubmit,
      handleProgressChange,
      handleSelectTrack,
      handleTogglePlay,
      handleTrackChange,
      isPlaying,
      messageName,
      messageStatus,
      messageText,
      messages,
      progressValue,
    ],
  )

  return <MusicPlayerContext.Provider value={contextValue}>{children}</MusicPlayerContext.Provider>
}

function AppRoutes({ musicUiState, onOcAreaChange, replayIntroEnabled }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            initialReplayIntroEnabled={replayIntroEnabled}
            musicUiState={musicUiState}
            onOcAreaChange={onOcAreaChange}
          />
        }
      />
      <Route path="/works/:categoryId" element={<CategoryPage />} />
      <Route path="/hidden" element={<HiddenSpaceLayout />}>
        <Route index element={<HiddenArchivePage />} />
        <Route path="games" element={<HiddenSpaceGamesPage />} />
        <Route path="painting" element={<HiddenSpacePaintingPage />} />
        <Route path="writing" element={<HiddenSpaceWritingPage />} />
        <Route path="journal" element={<HiddenSpaceJournalPage />} />
        <Route path="personal" element={<HiddenSpacePersonalPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppShell() {
  const location = useLocation()
  const [replayIntroEnabled, setReplayIntroEnabled] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(INTRO_REPLAY_STORAGE_KEY) === 'true'
  })
  const [ocArea, setOcArea] = useState(null)
  const [musicUiState, setMusicUiState] = useState({
    isExpanded: false,
    isPlaying: false,
    activeTrackId: null,
    activeTrackTitle: '',
    lastInteractedAt: 0,
  })
  const isHomePage = location.pathname === '/'

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(INTRO_REPLAY_STORAGE_KEY, replayIntroEnabled ? 'true' : 'false')
  }, [replayIntroEnabled])

  return (
    <div className="site">
      <BackgroundLayer mode="glass" />
      <SiteHeader replayIntroEnabled={replayIntroEnabled} setReplayIntroEnabled={setReplayIntroEnabled} />
      <AppRoutes
        replayIntroEnabled={replayIntroEnabled}
        musicUiState={{ ...musicUiState, isMusicSceneActive: !isHomePage }}
        onOcAreaChange={setOcArea}
      />
      <MiniMusicPlayer isHomePage={isHomePage} ocArea={ocArea} onUiStateChange={setMusicUiState} />
    </div>
  )
}

function App() {
  return (
    <MusicPlayerProvider>
      <AppShell />
    </MusicPlayerProvider>
  )
}

export default App
