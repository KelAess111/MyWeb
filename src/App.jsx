import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import HiddenSpaceLayout from './components/HiddenSpaceLayout'
import BackgroundLayer from './components/BackgroundLayer'
import SiteHeader from './components/SiteHeader'
import MiniMusicPlayer from './components/MiniMusicPlayer'
import MusicVisualizer from './components/MusicVisualizer'
import PageTransition from './components/PageTransition'
import ClickEffects from './components/ClickEffects'
import MobileNotice from './components/MobileNotice'
import ProtectedRoute from './components/ProtectedRoute'
import CircularRevealTransition from './components/CircularRevealTransition'
import TransitionContext from './contexts/TransitionContext'
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
import './styles/share.css'
import './styles/anki.css'

// 创建支持预加载的lazy wrapper
function lazyWithPreload(importFunc) {
  const LazyComponent = lazy(importFunc)
  LazyComponent.preload = importFunc
  return LazyComponent
}

const HomePage = lazyWithPreload(() => import('./pages/HomePage'))
const ProfilePage = lazyWithPreload(() => import('./pages/ProfilePage'))
const PortfolioPage = lazyWithPreload(() => import('./pages/PortfolioPage'))
const InterestsPage = lazyWithPreload(() => import('./pages/InterestsPage'))
const SharePage = lazyWithPreload(() => import('./pages/SharePage'))
const CategoryPage = lazyWithPreload(() => import('./pages/CategoryPage'))
const HiddenArchivePage = lazyWithPreload(() => import('./pages/HiddenArchivePage'))
const HiddenSpaceGamesPage = lazyWithPreload(() => import('./pages/HiddenSpaceGamesPage'))
const HiddenSpacePaintingPage = lazyWithPreload(() => import('./pages/HiddenSpacePaintingPage'))
const HiddenSpaceWritingPage = lazyWithPreload(() => import('./pages/HiddenSpaceWritingPage'))
const PublicWritingPage = lazyWithPreload(() => import('./pages/PublicWritingPage'))
const PublicJournalPage = lazyWithPreload(() => import('./pages/PublicJournalPage'))
const PublicGalleryPage = lazyWithPreload(() => import('./pages/PublicGalleryPage'))
const PublicGalleryAlbumPage = lazyWithPreload(() => import('./pages/PublicGalleryAlbumPage'))
const AnimePage = lazyWithPreload(() => import('./pages/AnimePage'))
const ArticleDetailPage = lazyWithPreload(() => import('./pages/ArticleDetailPage'))
const BookPage = lazyWithPreload(() => import('./pages/BookPage'))
const GamePage = lazyWithPreload(() => import('./pages/GamePage'))
const MusicPage = lazyWithPreload(() => import('./pages/MusicPage'))
const HiddenSpaceJournalPage = lazyWithPreload(() => import('./pages/HiddenSpaceJournalPage'))
const HiddenSpacePersonalPage = lazyWithPreload(() => import('./pages/HiddenSpacePersonalPage'))
const QAAdminPage = lazyWithPreload(() => import('./pages/QAAdminPage'))
const UtilitiesPage = lazyWithPreload(() => import('./pages/UtilitiesPage'))
const LoginPage = lazyWithPreload(() => import('./pages/LoginPage'))
const AnkiHomePage = lazyWithPreload(() => import('./pages/AnkiHomePage'))
const AnkiPracticePage = lazyWithPreload(() => import('./pages/AnkiPracticePage'))
const AnkiManagePage = lazyWithPreload(() => import('./pages/AnkiManagePage'))
const AnkiWrongCardsPage = lazyWithPreload(() => import('./pages/AnkiWrongCardsPage'))

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
  const [audioElement, setAudioElement] = useState(null)
  const activeTrack = musicTracks[activeTrackIndex] ?? musicTracks[0] ?? null
  const progressValue = duration > 0 ? Math.min(currentTime, duration) : currentTime

  useEffect(() => {
    // 只在第一次挂载时创建audio元素
    if (audioRef.current) {
      console.log('Audio element already exists, skipping creation')
      return
    }

    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio
    setAudioElement(audio)
    console.log('Created new audio element')

    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      setAudioStatus('ready')

      // 不从保存状态恢复播放位置，始终从0开始
      audio.currentTime = 0
      setCurrentTime(0)
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
      // 不要清除 audioRef.current，让它持久存在
    }
  }, []) // 空依赖数组，只运行一次

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
    audio.currentTime = 0
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
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = 0
    }
    setActiveTrackIndex(index)
    setCurrentTime(0)
    setIsPlaying(true)
  }, [])

  const handleTrackChange = useCallback((direction) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = 0
    }
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

      // 保存到本地
      setMessages((current) => [nextMessage, ...current].slice(0, 20))

      // 如果配置了 Formspree，发送到服务器
      const formspreeId = import.meta.env.VITE_FORMSPREE_FORM_ID
      if (formspreeId) {
        try {
          const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: nextMessage.name,
              message: nextMessage.text,
              timestamp: nextMessage.createdAt,
            }),
          })

          if (response.ok) {
            setMessageStatus('sent')
            setMessageText('')
            setMessageName('')
          } else {
            setMessageStatus('saved_only')
          }
        } catch (error) {
          console.error('Failed to send message to Formspree:', error)
          setMessageStatus('saved_only')
        }
      } else {
        // 没有配置 Formspree，仅本地保存
        setMessageText('')
        setMessageName('')
        setMessageStatus('saved_only')
      }
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
      audioElement,
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
      audioElement,
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
        <Route path="/qa-admin" element={<QAAdminPage />} />
        <Route path="/interests" element={<InterestsPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/share" element={<SharePage />} />
        <Route path="/share/:slug" element={<ArticleDetailPage />} />
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
        <Route path="/utilities" element={<UtilitiesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/utilities/anki" element={<ProtectedRoute><AnkiHomePage /></ProtectedRoute>} />
        <Route path="/utilities/anki/practice/:language" element={<ProtectedRoute><AnkiPracticePage /></ProtectedRoute>} />
        <Route path="/utilities/anki/manage" element={<ProtectedRoute><AnkiManagePage /></ProtectedRoute>} />
        <Route path="/utilities/anki/wrong-cards" element={<ProtectedRoute><AnkiWrongCardsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </Suspense>
  )
}

function AppShell() {
  const location = useLocation()

  // 预加载所有路由组件（首次进入时）
  useEffect(() => {
    // 只在首次加载时预加载
    const hasPreloaded = sessionStorage.getItem('routes-preloaded')
    if (hasPreloaded) {
      return
    }

    console.log('开始预加载路由组件...')

    // 使用requestIdleCallback在浏览器空闲时预加载
    const preloadRoutes = async () => {
      // 预加载所有lazy组件
      const components = [
        { name: 'HomePage', component: HomePage },
        { name: 'ProfilePage', component: ProfilePage },
        { name: 'PortfolioPage', component: PortfolioPage },
        { name: 'InterestsPage', component: InterestsPage },
        { name: 'SharePage', component: SharePage },
        { name: 'CategoryPage', component: CategoryPage },
        { name: 'HiddenArchivePage', component: HiddenArchivePage },
        { name: 'HiddenSpaceGamesPage', component: HiddenSpaceGamesPage },
        { name: 'HiddenSpacePaintingPage', component: HiddenSpacePaintingPage },
        { name: 'HiddenSpaceWritingPage', component: HiddenSpaceWritingPage },
        { name: 'PublicWritingPage', component: PublicWritingPage },
        { name: 'PublicJournalPage', component: PublicJournalPage },
        { name: 'PublicGalleryPage', component: PublicGalleryPage },
        { name: 'PublicGalleryAlbumPage', component: PublicGalleryAlbumPage },
        { name: 'AnimePage', component: AnimePage },
        { name: 'ArticleDetailPage', component: ArticleDetailPage },
        { name: 'BookPage', component: BookPage },
        { name: 'GamePage', component: GamePage },
        { name: 'MusicPage', component: MusicPage },
        { name: 'HiddenSpaceJournalPage', component: HiddenSpaceJournalPage },
        { name: 'HiddenSpacePersonalPage', component: HiddenSpacePersonalPage },
        { name: 'QAAdminPage', component: QAAdminPage },
        { name: 'UtilitiesPage', component: UtilitiesPage },
        { name: 'LoginPage', component: LoginPage },
        { name: 'AnkiHomePage', component: AnkiHomePage },
        { name: 'AnkiPracticePage', component: AnkiPracticePage },
        { name: 'AnkiManagePage', component: AnkiManagePage },
        { name: 'AnkiWrongCardsPage', component: AnkiWrongCardsPage }
      ]

      // 逐个预加载，避免一次性加载太多
      for (let i = 0; i < components.length; i++) {
        const { name, component } = components[i]
        try {
          if (component.preload) {
            await component.preload()
            console.log(`✓ 预加载完成: ${name}`)
          }
        } catch (error) {
          console.warn(`✗ 预加载失败: ${name}`, error)
        }
        // 增加间隔到150ms，给浏览器更多喘息时间
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      console.log('✓ 所有路由预加载完成')
      sessionStorage.setItem('routes-preloaded', 'true')
    }

    // 延迟2.5秒后开始预加载，确保首屏完全加载完成
    const timer = setTimeout(() => {
      if (typeof requestIdleCallback !== 'undefined') {
        // 增加timeout到5秒，给浏览器更宽松的调度时间
        requestIdleCallback(() => preloadRoutes(), { timeout: 5000 })
      } else {
        preloadRoutes()
      }
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  // 在应用最顶层检查预览模式和编辑模式
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const urlParams = new URLSearchParams(window.location.search)
    const hasPreviewParam = urlParams.get('preview') === 'true'
    const hasEditParam = urlParams.get('editMode') === 'local'

    // 如果 URL 有 preview=true，设置 sessionStorage 并清除 localStorage
    if (hasPreviewParam) {
      try {
        window.sessionStorage.setItem('previewMode', 'true')
        window.localStorage.removeItem('localEditMode')
      } catch {
        // ignore
      }
    }

    // 如果 URL 有 editMode=local，设置 localStorage 并清除预览模式
    if (hasEditParam) {
      try {
        window.localStorage.setItem('localEditMode', 'true')
        window.sessionStorage.removeItem('previewMode')
      } catch {
        // ignore
      }
    }
  }, [location.search])

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
  const [showGlobalMask, setShowGlobalMask] = useState(false)
  const isHomePage = location.pathname === '/'
  const isHiddenSpace = location.pathname.startsWith('/hidden')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(INTRO_REPLAY_STORAGE_KEY, replayIntroEnabled ? 'true' : 'false')
  }, [replayIntroEnabled])

  return (
    <TransitionContext.Provider value={{ showGlobalMask, setShowGlobalMask }}>
      <div className="site">
        <MobileNotice />
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
        <MusicVisualizer />
        <CircularRevealTransition isActive={false} />
        {showGlobalMask && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#ffffff',
              zIndex: 10000,
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </TransitionContext.Provider>
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
