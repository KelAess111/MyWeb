import { useEffect, useId, useRef } from 'react'
import '../styles/annotation-term.css'

function AnnotationTerm({ id, label, content, category = 'meta', title, isOpen, onOpen, onClose, onToggle }) {
  const popupId = useId()
  const wrapperRef = useRef(null)

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

  return (
    <span className="annotation-wrapper" ref={wrapperRef}>
      <button
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

      {isOpen ? (
        <span className="annotation-popup" id={popupId} role="dialog" aria-label={title ?? `${label} 的注释`}>
          <span className="annotation-popup-header">
            <span className="annotation-popup-title">{title ?? label}</span>
            <button type="button" className="annotation-close" aria-label="关闭注释" onClick={onClose}>
              ×
            </button>
          </span>
          <span className="annotation-popup-content">{content}</span>
        </span>
      ) : null}
    </span>
  )
}

export default AnnotationTerm
