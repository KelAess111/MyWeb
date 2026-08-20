import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeWritingEntry } from '../services/writingService'
import WritingBlockEditor from './WritingBlockEditor'

const MODE_OPTIONS = [
  { value: 'node', label: '编辑当前栏位' },
  { value: 'child', label: '新增子栏位' },
  { value: 'content', label: '编辑内容' },
]

function createStableId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function createEmptyAnnotation() {
  return {
    id: createStableId('annotation'),
    term: '',
    occurrence: 1,
    content: '',
    title: '',
    category: 'meta',
  }
}

function cloneEntry(entry) {
  return JSON.parse(JSON.stringify(entry ?? {}))
}

function supportsChildCreation(entry) {
  if (!entry) {
    return false
  }

  if (entry.type === 'folder') {
    return true
  }

  return false
}

function supportsContentEditing(entry) {
  if (!entry) {
    return false
  }

  if (entry.type === 'entry') {
    return true
  }

  return !Array.isArray(entry.children) || entry.children.length === 0
}

function createFolderDraft(entry, { createNew = false } = {}) {
  const source = cloneEntry(entry)
  return {
    ...source,
    id: createNew ? createStableId('writing-folder') : source.id ?? createStableId('writing-folder'),
    type: 'folder',
    title: source.title ?? '未命名目录',
    intro: source.intro ?? '',
    detail: source.detail ?? source.intro ?? '',
    excerptLabel: source.excerptLabel ?? '目录',
    meta: source.meta && typeof source.meta === 'object' ? source.meta : {},
    children: createNew ? [] : (Array.isArray(source.children) ? source.children : []),
    ocHoverLine: source.ocHoverLine ?? null,
  }
}

function cleanAnnotations(annotations = []) {
  return annotations
    .map((annotation) => ({
      ...annotation,
      term: String(annotation.term ?? '').trim(),
      occurrence: Number(annotation.occurrence) > 0 ? Number(annotation.occurrence) : 1,
      content: String(annotation.content ?? '').trim(),
      title: String(annotation.title ?? '').trim(),
      category: String(annotation.category ?? 'meta').trim() || 'meta',
    }))
    .filter((annotation) => annotation.term && annotation.content)
}

function cleanEntry(entry) {
  const normalized = normalizeWritingEntry(entry)
  return {
    ...normalized,
    title: normalized.title.trim(),
    intro: normalized.intro.trim(),
    detail: String(normalized.detail ?? normalized.intro ?? '').trim(),
    annotations: cleanAnnotations(normalized.annotations),
    blocks: normalized.blocks.map((block) => {
      if (block.type === 'list') {
        return { ...block, items: block.items.map((item) => item.trim()).filter(Boolean) }
      }

      if (block.type === 'dialogue') {
        return {
          ...block,
          lines: block.lines
            .map((line) => ({
              ...line,
              speaker: String(line.speaker ?? '').trim(),
              text: String(line.text ?? '').trim(),
            }))
            .filter((line) => line.speaker || line.text),
        }
      }

      return { ...block, text: String(block.text ?? '').trim() }
    }),
  }
}

function WritingEditorModal({
  entry,
  isOpen,
  onSave,
  onDelete,
  onClose,
  isSaving = false,
  error = '',
  title = '编辑写作条目',
  saveLabel = '保存条目',
  initialMode = 'node',
}) {
  const [draft, setDraft] = useState(() => cloneEntry(entry))
  const [validationError, setValidationError] = useState('')
  const [editorMode, setEditorMode] = useState('node')
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)

  const allowsChildCreation = supportsChildCreation(entry)
  const allowsContentEditing = supportsContentEditing(entry)
  const annotationCount = useMemo(() => draft.annotations?.length ?? 0, [draft.annotations])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    returnFocusRef.current = document.activeElement
    setDraft(initialMode === 'child' ? createFolderDraft(entry, { createNew: true }) : cloneEntry(entry))
    setValidationError('')

    if (initialMode === 'child' && entry?.type === 'folder') {
      setEditorMode('child')
    } else if (initialMode === 'content' && entry?.type === 'entry') {
      setEditorMode('content')
    } else if (initialMode === 'root') {
      setEditorMode('root')
    } else {
      setEditorMode('node')
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector('input, textarea, select, button')?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      if (returnFocusRef.current instanceof HTMLElement) {
        returnFocusRef.current.focus()
      }
    }
  }, [entry, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, onClose])

  if (!isOpen || !entry) {
    return null
  }

  const updateField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const updateAnnotation = (annotationId, patch) => {
    setDraft((current) => ({
      ...current,
      annotations: (current.annotations ?? []).map((annotation) => (
        annotation.id === annotationId ? { ...annotation, ...patch } : annotation
      )),
    }))
  }

  const addAnnotation = () => {
    setDraft((current) => ({
      ...current,
      annotations: [...(current.annotations ?? []), createEmptyAnnotation()],
    }))
  }

  const removeAnnotation = (annotationId) => {
    setDraft((current) => ({
      ...current,
      annotations: (current.annotations ?? []).filter((annotation) => annotation.id !== annotationId),
    }))
  }

  const handleModeChange = (nextMode) => {
    if (nextMode === 'child' && !allowsChildCreation) {
      return
    }

    if (nextMode === 'content' && !allowsContentEditing) {
      return
    }

    setEditorMode(nextMode)
    setValidationError('')
  }

  const startChildCreation = () => {
    if (!allowsChildCreation) {
      return
    }

    setDraft(createFolderDraft(entry, { createNew: true }))
    setEditorMode('child')
    setValidationError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (editorMode === 'child') {
      const nextFolder = createFolderDraft(draft, { createNew: true })
      if (!nextFolder.title?.trim()) {
        setValidationError('请输入标题。')
        return
      }

      setValidationError('')
      onSave(nextFolder, { mode: 'child', parentId: entry.id })
      return
    }

    if (editorMode === 'root') {
      const nextFolder = createFolderDraft(draft)
      if (!nextFolder.title?.trim()) {
        setValidationError('请输入标题。')
        return
      }

      setValidationError('')
      onSave(nextFolder, { mode: 'root' })
      return
    }

    if (editorMode === 'node') {
      if (!String(draft.title ?? '').trim()) {
        setValidationError('请输入标题。')
        return
      }

      const nextNode = draft.type === 'folder' ? createFolderDraft(draft) : cleanEntry({ ...draft, blocks: draft.blocks ?? [], annotations: draft.annotations ?? [] })
      setValidationError('')
      onSave(nextNode, { mode: 'node' })
      return
    }

    const nextEntry = cleanEntry({ ...draft, type: 'entry' })
    if (!nextEntry.title) {
      setValidationError('请输入标题。')
      return
    }

    setValidationError('')
    onSave(nextEntry, { mode: initialMode === 'root' ? 'root' : 'content' })
  }

  return (
    <div
      className="hidden-space-writing-editor-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <form
        ref={dialogRef}
        className="hidden-space-writing-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="writing-editor-title"
        onSubmit={handleSubmit}
      >
        <header className="hidden-space-writing-editor-head">
          <div>
            <h2 id="writing-editor-title">{title}</h2>
            <p className="hidden-space-writing-count">
              {editorMode === 'content'
                ? '编辑正文块与注释。'
                : editorMode === 'child'
                  ? '创建一个新的子栏位。'
                  : editorMode === 'root'
                    ? '创建一个新的根栏位。'
                    : '修改当前栏位的标题、简介和详情。'}
            </p>
          </div>
          <button type="button" className="btn secondary" aria-label="关闭编辑器" onClick={onClose} disabled={isSaving}>
            关闭
          </button>
        </header>

        <div className="hidden-space-writing-editor-fields">
          {editorMode !== 'child' && editorMode !== 'root' ? (
            <fieldset className="hidden-space-writing-editor-mode-switch">
              <legend>编辑模式</legend>
              <div className="hidden-space-writing-editor-mode-grid">
                {MODE_OPTIONS.filter((option) => {
                  if (option.value === 'child') {
                    return allowsChildCreation
                  }

                  if (option.value === 'content') {
                    return allowsContentEditing
                  }

                  return true
                }).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`btn secondary hidden-space-writing-editor-mode-card ${editorMode === option.value ? 'is-active' : ''}`}
                    onClick={() => handleModeChange(option.value)}
                    disabled={isSaving}
                  >
                    <strong>{option.label}</strong>
                    <span className="hidden-space-writing-count">
                      {option.value === 'node'
                        ? '编辑标题、简介和详情'
                        : option.value === 'child'
                          ? '新增子栏位，保持目录结构'
                          : '编辑正文块与注释'}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="hidden-space-writing-editor-inline-actions">
              <button type="button" className="btn secondary" onClick={() => handleModeChange('node')} disabled={isSaving}>
                返回编辑当前项
              </button>
            </div>
          )}

          {(editorMode === 'node' || editorMode === 'root' || editorMode === 'child' || editorMode === 'content') ? (
            <section className="hidden-space-writing-editor-panel">
              <label className="hidden-space-writing-editor-field">
                <span>标题</span>
                <input required value={draft.title ?? ''} onChange={(event) => updateField('title', event.target.value)} />
              </label>
              <label className="hidden-space-writing-editor-field">
                <span>简介</span>
                <textarea rows={3} value={draft.intro ?? ''} onChange={(event) => updateField('intro', event.target.value)} />
              </label>
              <label className="hidden-space-writing-editor-field">
                <span>详情</span>
                <textarea rows={4} value={draft.detail ?? draft.intro ?? ''} onChange={(event) => updateField('detail', event.target.value)} />
              </label>
              {editorMode === 'node' && allowsChildCreation ? (
                <div className="hidden-space-writing-editor-inline-actions">
                  <button type="button" className="btn secondary" onClick={startChildCreation} disabled={isSaving}>
                    新增子栏位
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          {editorMode === 'content' ? (
            <>
              <fieldset className="hidden-space-writing-editor-raw-paste">
                <legend>快速粘贴正文</legend>
                <label className="hidden-space-writing-editor-field">
                  <span>按空行拆段</span>
                  <textarea
                    rows={8}
                    value={(draft.blocks ?? []).map((block) => (block.type === 'paragraph' ? block.text : '')).filter(Boolean).join('\n\n')}
                    onChange={(event) => {
                      const text = event.target.value
                      const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)
                      const nextBlocks = paragraphs.length
                        ? paragraphs.map((paragraph, index) => ({ id: `${draft.id}-paste-${index}`, type: 'paragraph', text: paragraph }))
                        : [{ id: `${draft.id}-paste-0`, type: 'paragraph', text: '' }]
                      setDraft((current) => ({ ...current, blocks: nextBlocks }))
                    }}
                    placeholder="先粘贴正文，系统会按空行拆成段落块。"
                  />
                </label>
              </fieldset>

              <WritingBlockEditor blocks={draft.blocks ?? []} entryId={draft.id ?? 'writing-entry'} onChange={(blocks) => setDraft((current) => ({ ...current, blocks }))} />

              <fieldset className="hidden-space-writing-editor-annotations">
                <legend>正文注释</legend>
                <div className="hidden-space-writing-editor-block-head">
                  <div>
                    <strong>当前共有 {annotationCount} 条注释</strong>
                    <span>和日志区相同的注释结构</span>
                  </div>
                  <button type="button" className="btn secondary" onClick={addAnnotation}>
                    新增注释
                  </button>
                </div>

                {(draft.annotations ?? []).length ? (draft.annotations ?? []).map((annotation, index) => (
                  <article key={annotation.id} className="hidden-space-writing-editor-block-card">
                    <div className="hidden-space-writing-editor-two-columns">
                      <label className="hidden-space-writing-editor-field">
                        <span>词 / 短语</span>
                        <input
                          value={annotation.term ?? ''}
                          onChange={(event) => updateAnnotation(annotation.id, { term: event.target.value })}
                          placeholder="正文里要被替换成注释按钮的词"
                        />
                      </label>
                      <label className="hidden-space-writing-editor-field">
                        <span>第几次出现</span>
                        <input
                          type="number"
                          min="1"
                          value={annotation.occurrence ?? 1}
                          onChange={(event) => updateAnnotation(annotation.id, { occurrence: event.target.value })}
                        />
                      </label>
                    </div>
                    <div className="hidden-space-writing-editor-two-columns">
                      <label className="hidden-space-writing-editor-field">
                        <span>注释标题</span>
                        <input
                          value={annotation.title ?? ''}
                          onChange={(event) => updateAnnotation(annotation.id, { title: event.target.value })}
                          placeholder={`注释 #${index + 1} 的标题`}
                        />
                      </label>
                      <label className="hidden-space-writing-editor-field">
                        <span>分类</span>
                        <select value={annotation.category ?? 'meta'} onChange={(event) => updateAnnotation(annotation.id, { category: event.target.value })}>
                          <option value="meta">meta</option>
                          <option value="lore">lore</option>
                          <option value="process">process</option>
                          <option value="warning">warning</option>
                          <option value="world">world</option>
                        </select>
                      </label>
                    </div>
                    <label className="hidden-space-writing-editor-field">
                      <span>注释内容</span>
                      <textarea
                        rows={3}
                        value={annotation.content ?? ''}
                        onChange={(event) => updateAnnotation(annotation.id, { content: event.target.value })}
                        placeholder={`给注释 #${index + 1} 填写说明内容`}
                      />
                    </label>
                    <div className="hidden-space-writing-editor-inline-actions">
                      <button type="button" className="btn secondary danger" onClick={() => removeAnnotation(annotation.id)}>
                        删除注释
                      </button>
                    </div>
                  </article>
                )) : (
                  <p className="hidden-space-writing-editor-empty">还没有注释，点击上方按钮即可添加。</p>
                )}
              </fieldset>
            </>
          ) : null}

          {(validationError || error) ? <p className="hidden-space-writing-editor-error" role="alert">{validationError || error}</p> : null}

          <footer className="hidden-space-writing-editor-actions">
            {typeof onDelete === 'function' ? (
              <button type="button" className="btn secondary danger" onClick={() => onDelete(entry)} disabled={isSaving}>
                删除当前栏位
              </button>
            ) : <span />}
            <div className="hidden-space-writing-editor-inline-actions">
              <button type="button" className="btn secondary" onClick={onClose} disabled={isSaving}>
                取消
              </button>
              <button type="submit" className="btn secondary" disabled={isSaving}>
                {isSaving ? '保存中…' : saveLabel}
              </button>
            </div>
          </footer>
        </div>
      </form>
    </div>
  )
}

export default WritingEditorModal
