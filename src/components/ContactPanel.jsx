import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { secretRoom } from '../data/secretRoom'

const SECRET_REVEAL_MAX = 108
const SECRET_REVEAL_THRESHOLD = 72

function ContactPanel() {
  const navigate = useNavigate()
  const dragStartRef = useRef(0)
  const dragModeRef = useRef('open')
  const modalInputRef = useRef(null)
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
    </section>
  )
}

export default ContactPanel
