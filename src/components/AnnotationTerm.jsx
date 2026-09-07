import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../styles/annotation-term.css'

function AnnotationTerm({ id, label, content, category = 'meta', title, isOpen, onOpen, onClose, onToggle }) {
  const popupId = useId()
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })

  // 计算弹窗位置
  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      return
    }

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const popupWidth = 320 // 弹窗宽度
      const popupHeight = 200 // 预估弹窗高度
      const gap = 8 // 与按钮的间距

      let top = rect.bottom + gap
      let left = rect.left

      // 如果右侧空间不够，向左对齐
      if (left + popupWidth > viewportWidth - 20) {
        left = viewportWidth - popupWidth - 20
      }

      // 如果左侧超出，贴左边
      if (left < 20) {
        left = 20
      }

      // 如果下方空间不够，显示在上方
      if (top + popupHeight > viewportHeight - 20) {
        top = rect.top - popupHeight - gap
      }

      // 如果上方也不够，显示在视口中间
      if (top < 20) {
        top = Math.max(20, (viewportHeight - popupHeight) / 2)
      }

      setPopupPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, { passive: true })

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen, onClose])

  const popup = isOpen ? (
    <span
      className="annotation-popup"
      id={popupId}
      role="dialog"
      aria-label={title ?? `${label} 的注释`}
      style={{
        position: 'fixed',
        top: `${popupPosition.top}px`,
        left: `${popupPosition.left}px`,
        zIndex: 10000,
      }}
    >
      <span className="annotation-popup-header">
        <span className="annotation-popup-title">{title ?? label}</span>
        <button type="button" className="annotation-close" aria-label="关闭注释" onClick={onClose}>
          ×
        </button>
      </span>
      <span className="annotation-popup-content">{content}</span>
    </span>
  ) : null

  return (
    <span className="annotation-wrapper" ref={wrapperRef}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        className="annotation-term"
        data-category={category}
        aria-expanded={isOpen}
        aria-controls={popupId}
        onClick={onToggle ?? onOpen}
      >
        {label}
      </button>

      {popup && createPortal(popup, document.body)}
    </span>
  )
}

export default AnnotationTerm
