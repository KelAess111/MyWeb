import { useEffect, useRef, useState } from 'react'

function BookReviewEditor({ entry, isOpen, onSave, onClose, isSaving = false, error = '', subject = '这本书', kicker = 'Book note / 书评', title = '编辑书评' }) {
  const [draft, setDraft] = useState('')
  const [validationError, setValidationError] = useState('')
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !entry) return undefined
    returnFocusRef.current = document.activeElement
    const timer = window.setTimeout(() => {
      setDraft(String(entry.detail ?? entry.intro ?? '').trim())
      setValidationError('')
      dialogRef.current?.querySelector('textarea, button')?.focus()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      if (returnFocusRef.current instanceof HTMLElement) returnFocusRef.current.focus()
    }
  }, [entry, isOpen])

  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, onClose])

  if (!isOpen || !entry) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    const detail = draft.trim()
    if (!detail) {
      setValidationError(`请先写下${subject}的评价。`)
      return
    }
    setValidationError('')
    await onSave(detail)
  }

  return <div className="book-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose() }}>
    <form ref={dialogRef} className="book-editor-modal" role="dialog" aria-modal="true" aria-labelledby="book-editor-title" onSubmit={handleSubmit}>
      <span className="section-kicker">{kicker}</span>
      <h2 id="book-editor-title">{title}</h2>
      <p className="book-editor-entry-title">{entry.title}</p>
      <label className="book-editor-field"><span>评价</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={8} placeholder={`写下对${subject}的评价…`} /></label>
      {validationError || error ? <p className="book-editor-error" role="alert">{validationError || error}</p> : null}
      <div className="book-editor-actions"><button type="button" className="btn secondary" onClick={onClose} disabled={isSaving}>取消</button><button type="submit" className="btn" disabled={isSaving}>{isSaving ? '保存中…' : '保存评价'}</button></div>
    </form>
  </div>
}

export default BookReviewEditor
