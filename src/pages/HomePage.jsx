import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
import { secretRoom } from '../data/secretRoom'
import { workCategories } from '../data/workCategories'

const SECRET_REVEAL_MAX = 108
const SECRET_REVEAL_THRESHOLD = 72

function HomePage({ initialReplayIntroEnabled, musicUiState, onOcAreaChange }) {
  const shouldSkipIntroOnEntry = !initialReplayIntroEnabled

  const navigate = useNavigate()
  const dragStartRef = useRef(0)
  const dragModeRef = useRef('open')
  const modalInputRef = useRef(null)
  const [introStage, setIntroStage] = useState(() => (shouldSkipIntroOnEntry ? 'done' : 'loading'))
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isSecretRevealed, setIsSecretRevealed] = useState(false)
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false)
  const [enteredKey, setEnteredKey] = useState('')
  const [keyError, setKeyError] = useState('')

  const coverStyle = useMemo(
    () => ({
      transform: `translateX(${dragOffset}px)`,
    }),
    [dragOffset],
  )

  useEffect(() => {
    if (introStage === 'done') {
      return undefined
    }

    if (introStage === 'loading') {
      const loadingTimer = window.setTimeout(() => setIntroStage('greeting'), 900)
      return () => window.clearTimeout(loadingTimer)
    }

    if (introStage === 'greeting') {
      const promptTimer = window.setTimeout(() => setIntroStage('prompt'), 2000)
      return () => window.clearTimeout(promptTimer)
    }

    if (introStage === 'fadingOut') {
      const doneTimer = window.setTimeout(() => {
        setIntroStage('done')
      }, 820)

      return () => {
        window.clearTimeout(doneTimer)
      }
    }

    return undefined
  }, [introStage])

  useEffect(() => {
    if (!isSecretModalOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSecretModalOpen(false)
        setKeyError('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSecretModalOpen])

  useEffect(() => {
    if (isSecretModalOpen) {
      modalInputRef.current?.focus()
    }
  }, [isSecretModalOpen])

  const handleDismissIntro = () => {
    if (introStage === 'fadingOut' || introStage === 'done') {
      return
    }

    setIntroStage('fadingOut')
  }

  const handleRevealStart = (event) => {
    dragModeRef.current = isSecretRevealed ? 'close' : 'open'
    dragStartRef.current = event.clientX - dragOffset
    event.currentTarget.setPointerCapture(event.pointerId)

    if (isSecretRevealed) {
      setIsSecretRevealed(false)
    }

    setIsDragging(true)
  }

  const handleRevealMove = (event) => {
    if (!isDragging) {
      return
    }

    const nextOffset = Math.max(0, Math.min(event.clientX - dragStartRef.current, SECRET_REVEAL_MAX))
    setDragOffset(nextOffset)
  }

  const finishReveal = (mode, shouldReveal) => {
    setIsDragging(false)

    if (mode === 'close') {
      setDragOffset(0)
      setIsSecretRevealed(false)
      return
    }

    if (shouldReveal) {
      setDragOffset(SECRET_REVEAL_MAX)
      setIsSecretRevealed(true)
      navigator.vibrate?.(20)
      return
    }

    setDragOffset(0)
  }

  const handleRevealEnd = (event) => {
    if (!isDragging) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    finishReveal(dragModeRef.current, dragOffset >= SECRET_REVEAL_THRESHOLD)
  }

  const handleOpenSecretModal = () => {
    if (!isSecretRevealed) {
      return
    }

    setEnteredKey('')
    setKeyError('')
    setIsSecretModalOpen(true)
  }

  const handleCloseSecretModal = () => {
    setIsSecretModalOpen(false)
    setKeyError('')
  }

  const handleSecretSubmit = (event) => {
    event.preventDefault()

    if (enteredKey.trim() !== secretRoom.accessKey) {
      setKeyError('密钥不正确。请先联系作者获取有效密钥。')
      return
    }

    window.localStorage.setItem(secretRoom.unlockStorageKey, 'true')
    setIsSecretModalOpen(false)
    setKeyError('')
    navigate(secretRoom.route)
  }

  return (
    <main className="home-main">
      {introStage !== 'done' ? (
        <button type="button" className={`intro-overlay intro-overlay--${introStage}`} onClick={handleDismissIntro}>
          <div className="intro-overlay-noise" aria-hidden="true" />
          <div className="intro-overlay-glow" aria-hidden="true" />
          <div className="intro-overlay-content">
            <div className="intro-loader" aria-hidden={introStage !== 'loading'}>
              <span className="intro-loader-dot" />
              <span className="intro-loader-dot" />
              <span className="intro-loader-dot" />
            </div>
            <div className="intro-title-wrap">
              <span className="intro-title-kicker">WELCOME</span>
              <h1 className="intro-title">你好，创作者</h1>
            </div>
            <p className="intro-prompt">点击屏幕任意处</p>
          </div>
        </button>
      ) : null}

      <div className={`home-hero-stage is-visible`}>
        <HeroSection isVisible={true} musicUiState={musicUiState} onOcAreaChange={onOcAreaChange} />
      </div>

      <div className={`home-sections-stage is-visible`}>
        <section className="section about" id="about">
          <h2>关于我</h2>
          <p>
            我是一个 18 岁的创作者，关注多种媒介的表达方式，
            包括游戏设计、美术绘画、音乐制作、3D 建模与写作。
            我希望把不同形式的创作汇聚在同一个空间里。
          </p>
        </section>

        <section className="section works" id="works">
          <div className="section-heading">
            <span className="section-kicker">Works Directory</span>
            <h2>作品领域</h2>
            <p>
              这里是总览入口。你可以先快速浏览，再进入各自的独立页面继续查看更具体的内容。
            </p>
          </div>

          <div className="card-grid">
            {workCategories.map((category) => (
              <Link key={category.id} to={category.path} className={`card card-link accent-${category.accent}`}>
                <h3>{category.title}</h3>
                <p>{category.summary}</p>
                <span className="card-link-hint">进入此分区页面 →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section featured" id="featured">
          <h2>精选展示</h2>
          <div className="featured-box">
            <p>这里以后可以放你最想让别人第一眼看到的作品。</p>
            <p>比如：一个游戏封面、一张代表作、一段音乐介绍。</p>
          </div>
        </section>

        <section className="section contact" id="contact">
          <div className="contact-layout">
            <div className={`contact-panel ${isSecretRevealed ? 'is-secret-revealed' : ''}`}>
              <h2>联系我</h2>
              <p>邮箱：2597631359@qq.com</p>
              <p>qq群：1067287400</p>

              <div className="secret-concealed-zone" aria-hidden={isSecretRevealed ? 'false' : 'true'}>
                <button
                  type="button"
                  className={`secret-access-chip ${isSecretRevealed ? 'is-visible' : ''}`}
                  onClick={handleOpenSecretModal}
                >
                  ？？？
                </button>

                <div
                  className={`secret-micro-cover ${isDragging ? 'is-dragging' : ''} ${isSecretRevealed ? 'is-revealed' : ''}`}
                  style={coverStyle}
                >
                  <div
                    className="secret-trigger-dot"
                    role="button"
                    aria-label="隐藏入口触发点"
                    tabIndex={0}
                    onPointerDown={handleRevealStart}
                    onPointerMove={handleRevealMove}
                    onPointerUp={handleRevealEnd}
                    onPointerCancel={handleRevealEnd}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        if (isSecretRevealed) {
                          setIsSecretRevealed(false)
                          setDragOffset(0)
                          return
                        }

                        finishReveal('open', true)
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isSecretModalOpen ? (
        <div className="secret-modal-backdrop" onClick={handleCloseSecretModal}>
          <div className="secret-modal card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="secret-modal-header">
              <h3>{secretRoom.modalTitle}</h3>
              <button type="button" className="annotation-close" aria-label="关闭密钥窗口" onClick={handleCloseSecretModal}>
                ×
              </button>
            </div>
            <p>{secretRoom.modalDescription}</p>
            <p>若你还没有密钥，请先通过联系模块与作者沟通。</p>

            <form className="secret-modal-form" onSubmit={handleSecretSubmit}>
              <input
                ref={modalInputRef}
                type="password"
                className="secret-key-input"
                value={enteredKey}
                onChange={(event) => setEnteredKey(event.target.value)}
                placeholder="请输入密钥"
              />
              {keyError ? <p className="secret-key-error">{keyError}</p> : null}
              <div className="secret-modal-actions">
                <button type="submit" className="btn primary">
                  进入档案页
                </button>
                <button type="button" className="btn secondary" onClick={handleCloseSecretModal}>
                  暂时离开
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default HomePage
