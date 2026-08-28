import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import HiddenSpaceLayout from './components/HiddenSpaceLayout'
import BackgroundLayer from './components/BackgroundLayer'
import SiteHeader from './components/SiteHeader'
import MiniMusicPlayer from './components/MiniMusicPlayer'
import PageTransition from './components/PageTransition'
import ClickEffects from './components/ClickEffects'
import { MusicPlayerContext } from './contexts/MusicPlayerContext'
import { musicTracks } from './data/musicTracks'
import './App.css'
import './launcher-edge-overrides.css'
import './home-utility-overrides.css'
import './styles/public-journal.css'
import './styles/public-gallery.css'
import './styles/anime.css'
import './styles/book.css'
import './styles/game.css'
import './styles/music.css'

const HomePage = lazy(() => import('./pages/HomePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'))
const InterestsPage = lazy(() => import('./pages/InterestsPage'))
const SharePage = lazy(() => import('./pages/SharePage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const HiddenArchivePage = lazy(() => import('./pages/HiddenArchivePage'))
const HiddenSpaceGamesPage = lazy(() => import('./pages/HiddenSpaceGamesPage'))
const HiddenSpacePaintingPage = lazy(() => import('./pages/HiddenSpacePaintingPage'))
const HiddenSpaceWritingPage = lazy(() => import('./pages/HiddenSpaceWritingPage'))
const PublicWritingPage = lazy(() => import('./pages/PublicWritingPage'))
const PublicJournalPage = lazy(() => import('./pages/PublicJournalPage'))
const PublicGalleryPage = lazy(() => import('./pages/PublicGalleryPage'))
const PublicGalleryAlbumPage = lazy(() => import('./pages/PublicGalleryAlbumPage'))
const AnimePage = lazy(() => import('./pages/AnimePage'))
const BookPage = lazy(() => import('./pages/BookPage'))
const GamePage = lazy(() => import('./pages/GamePage'))
const MusicPage = lazy(() => import('./pages/MusicPage'))
const HiddenSpaceJournalPage = lazy(() => import('./pages/HiddenSpaceJournalPage'))
const HiddenSpacePersonalPage = lazy(() => import('./pages/HiddenSpacePersonalPage'))

const PLAYBACK_STORAGE_KEY = 'kel-music-player-playback'
const MESSAGE_STORAGE_KEY = 'kel-music-player-messages'
const INTRO_REPLAY_STORAGE_KEY = 'kel-home-replay-intro-enabled'

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
      autoplayNext: false,
      playbackMode: 'sequential',
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
      autoplayNext: Boolean(parsed.autoplayNext),
      playbackMode: ['sequential', 'loop', 'shuffle'].includes(parsed.playbackMode) ? parsed.playbackMode : 'sequential',
    }
  } catch {
    return {
      activeTrackIndex: 0,
      isPlaying: false,
      currentTime: 0,
      activeTab: 'player',
      autoplayNext: false,
      playbackMode: 'sequential',
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

function getRandomTrackIndex(currentIndex, totalTracks) {
  if (totalTracks <= 1) {
    return currentIndex
  }

  let nextIndex = currentIndex
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * totalTracks)
  }

  return nextIndex
}

function resolveNextTrackIndex(currentIndex, totalTracks, playbackMode) {
  if (totalTracks <= 0) {
    return null
  }

  if (playbackMode === 'shuffle') {
    return getRandomTrackIndex(currentIndex, totalTracks)
  }

  const nextIndex = currentIndex + 1
  if (nextIndex < totalTracks) {
    return nextIndex
  }

  if (playbackMode === 'loop') {
    return 0
  }

  return null
}

function MusicPlayerProvider({ children }) {
  const playbackState = useMemo(() => readStoredPlaybackState(), [])
  const [activeTrackIndex, setActiveTrackIndex] = useState(playbackState.activeTrackIndex)
  const [isPlaying, setIsPlaying] = useState(playbackState.isPlaying)
  const [activeTab, setActiveTab] = useState(playbackState.activeTab)
  const [autoplayNext, setAutoplayNext] = useState(playbackState.autoplayNext)
  const [playbackMode, setPlaybackMode] = useState(playbackState.playbackMode)
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
      const nextIndex = autoplayNext ? resolveNextTrackIndex(activeTrackIndex, musicTracks.length, playbackMode) : null

      if (nextIndex === null) {
        setIsPlaying(false)
        setCurrentTime(0)
        return
      }

      setActiveTrackIndex(nextIndex)
      setCurrentTime(0)
      setIsPlaying(true)
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
  }, [playbackState.currentTime, activeTrackIndex, autoplayNext, playbackMode])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (!activeTrack?.src) {
      audio.removeAttribute('src')
      audio.load()
      const timer = window.setTimeout(() => {
        setDuration(0)
        setCurrentTime(0)
        setAudioStatus('missing')
        setIsPlaying(false)
      }, 0)
      return () => window.clearTimeout(timer)
    }

    audio.src = normaliseTrackSource(activeTrack.src)
    audio.load()
    const timer = window.setTimeout(() => {
      setDuration(0)
      setCurrentTime(0)
      setAudioStatus('loading')
    }, 0)

    return () => window.clearTimeout(timer)
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
        autoplayNext,
        playbackMode,
      }),
    )
  }, [activeTab, activeTrackIndex, autoplayNext, currentTime, isPlaying, playbackMode])

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

      if (playbackMode === 'shuffle' && direction > 0) {
        return getRandomTrackIndex(current, musicTracks.length)
      }

      const nextIndex = (current + direction + musicTracks.length) % musicTracks.length
      return nextIndex
    })
    setCurrentTime(0)
    setIsPlaying(true)
  }, [playbackMode])

  const handleProgressChange = useCallback((event) => {
    const nextTime = Number(event.target.value)
    const audio = audioRef.current

    if (audio && Number.isFinite(nextTime)) {
      audio.currentTime = nextTime
      setCurrentTime(nextTime)
    }
  }, [])

  const handleToggleAutoplayNext = useCallback(() => {
    setAutoplayNext((current) => !current)
  }, [])

  const handleSetPlaybackMode = useCallback((nextMode) => {
    setPlaybackMode((current) => (current === nextMode ? current : nextMode))
  }, [])

  const handleCyclePlaybackMode = useCallback(() => {
    setPlaybackMode((current) => {
      if (current === 'sequential') {
        return 'loop'
      }

      if (current === 'loop') {
        return 'shuffle'
      }

      return 'sequential'
    })
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
      autoplayNext,
      currentTime,
      duration,
      formatTime,
      handleCyclePlaybackMode,
      handleMessageSubmit,
      handleProgressChange,
      handleSelectTrack,
      handleSetPlaybackMode,
      handleToggleAutoplayNext,
      handleTogglePlay,
      handleTrackChange,
      isPlaying,
      messageName,
      messageStatus,
      messageText,
      messages,
      musicTracks,
      playbackMode,
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
      autoplayNext,
      currentTime,
      duration,
      handleCyclePlaybackMode,
      handleMessageSubmit,
      handleProgressChange,
      handleSelectTrack,
      handleSetPlaybackMode,
      handleToggleAutoplayNext,
      handleTogglePlay,
      handleTrackChange,
      isPlaying,
      messageName,
      messageStatus,
      messageText,
      messages,
      playbackMode,
      progressValue,
    ],
  )

  return <MusicPlayerContext.Provider value={contextValue}>{children}</MusicPlayerContext.Provider>
}

function AppRoutes({ musicUiState, onOcAreaChange, replayIntroEnabled, locationKey }) {
  return (
    <Suspense fallback={<div className="route-loading-shell" role="status">页面加载中…</div>}>
      <PageTransition transitionKey={locationKey} className="site-route-shell">
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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/interests" element={<InterestsPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/share" element={<SharePage />} />
        <Route path="/works/writing" element={<PublicWritingPage />} />
        <Route path="/works/writing/*" element={<PublicWritingPage />} />
        <Route path="/writing" element={<PublicWritingPage />} />
        <Route path="/journal" element={<PublicJournalPage />} />
        <Route path="/works/painting" element={<PublicGalleryPage />} />
        <Route path="/works/painting/:year" element={<PublicGalleryAlbumPage />} />
        <Route path="/works/anime" element={<AnimePage />} />
        <Route path="/works/modeling" element={<BookPage />} />
        <Route path="/works/games" element={<GamePage />} />
        <Route path="/works/game" element={<GamePage />} />
        <Route path="/works/music" element={<MusicPage />} />
        <Route
          path="/works/:categoryId"
          element={
            <CategoryPage />
          }
        />
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
      </PageTransition>
    </Suspense>
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
  const isHiddenSpace = location.pathname.startsWith('/hidden')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(INTRO_REPLAY_STORAGE_KEY, replayIntroEnabled ? 'true' : 'false')
  }, [replayIntroEnabled])

  return (
    <div className="site">
      {!isHiddenSpace && <BackgroundLayer mode="base" />}
      <ClickEffects />
      <SiteHeader replayIntroEnabled={replayIntroEnabled} setReplayIntroEnabled={setReplayIntroEnabled} />
      <AppRoutes
        replayIntroEnabled={replayIntroEnabled}
        locationKey={location.pathname + location.hash}
        musicUiState={{
          ...musicUiState,
          isMusicSceneActive: isHomePage && musicUiState.isExpanded,
        }}
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
