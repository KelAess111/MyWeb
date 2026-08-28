import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { musicAlbums, musicMakers, musicRecommendationsTree } from '../data/musicRecommendations'
import { useImageLoadState } from '../hooks/useImageLoadState'
import { useWritingWorkspace } from '../hooks/useWritingWorkspace'
import { MUSIC_WRITING_WORKSPACE } from '../services/writingService'

const EMPTY_COPY = '作者待补充'
const MAKER_ROTATION_INTERVAL = 5200
const MAKER_MANUAL_RESUME_DELAY = 6500
const MAKER_TRANSITION_DURATION = 1250
const MAKER_SWIPE_THRESHOLD = 40

function MusicImage({ item, className = '' }) {
  const { status, handleLoad, handleError } = useImageLoadState(item.src)
  return <div className={`music-image music-image--${status} ${className}`}>
    {item.src ? <img src={item.src} alt={item.name} loading="lazy" decoding="async" onLoad={handleLoad} onError={handleError} /> : null}
    {status === 'loading' ? <span>图片加载中…</span> : null}
    {status === 'error' || status === 'empty' ? <span>图片暂不可用</span> : null}
  </div>
}

function getMusicEntryText(entry) {
  return [entry?.intro, entry?.detail].map((part) => String(part ?? '').trim()).filter(Boolean).join('\n\n')
}

function renderMusicText(entry) {
  const text = getMusicEntryText(entry)
  if (!text) return <p>{EMPTY_COPY}</p>
  return text.split(/\n{2,}/).map((paragraph, index) => <p key={`${entry?.id ?? 'music-copy'}-${index}`}>{paragraph}</p>)
}

function MusicReviewEditor({ entry, isOpen, onSave, onClose, isSaving = false, error = '' }) {
  const [draftText, setDraftText] = useState('')
  const [validationError, setValidationError] = useState('')
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)
  const isMaker = entry?.meta?.kind === 'maker'

  useEffect(() => {
    if (!isOpen || !entry) return undefined
    returnFocusRef.current = document.activeElement
    const initTimer = window.setTimeout(() => {
      setDraftText(getMusicEntryText(entry))
      setValidationError('')
      dialogRef.current?.querySelector('textarea, button')?.focus()
    }, 0)
    return () => {
      window.clearTimeout(initTimer)
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
    const nextText = draftText.trim()
    if (!nextText) {
      setValidationError(isMaker ? '请先写下这位制作人的评价。' : '请先写下这张专辑的乐评。')
      return
    }
    setValidationError('')
    await onSave({ ...entry, intro: '', detail: nextText, blocks: [], annotations: [] })
  }

  return <div className="music-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose() }}>
    <form ref={dialogRef} className="music-editor-modal" role="dialog" aria-modal="true" aria-labelledby="music-editor-title" onSubmit={handleSubmit}>
      <div className="music-editor-heading">
        <span className="section-kicker">{isMaker ? 'Maker note' : 'Album review'}</span>
        <h2 id="music-editor-title">{isMaker ? '编辑制作人评价' : '编辑乐评'}</h2>
        <p>{entry.title}</p>
      </div>
      <label className="music-editor-field">
        <span>{isMaker ? '评价' : '乐评'}</span>
        <textarea value={draftText} onChange={(event) => setDraftText(event.target.value)} rows={8} placeholder={isMaker ? '写下对这位制作人的评价…' : '写下这张专辑的乐评…'} />
      </label>
      {validationError || error ? <p className="music-editor-error" role="alert">{validationError || error}</p> : null}
      <div className="music-editor-actions">
        <button type="button" className="btn secondary" onClick={onClose} disabled={isSaving}>取消</button>
        <button type="submit" className="btn" disabled={isSaving}>{isSaving ? '保存中…' : (isMaker ? '保存评价' : '保存乐评')}</button>
      </div>
    </form>
  </div>
}

function MusicPage() {
  const workspace = useWritingWorkspace({ workspace: MUSIC_WRITING_WORKSPACE, fallbackTree: musicRecommendationsTree })
  const [makerIndex, setMakerIndex] = useState(0)
  const [makerTransition, setMakerTransition] = useState(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [lockedAlbum, setLockedAlbum] = useState(null)
  const [albumsExpanded, setAlbumsExpanded] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const dragRef = useRef(null)
  const activeMakerRef = useRef(0)
  const autoplayTimerRef = useRef(null)
  const manualResumeTimerRef = useRef(null)
  const transitionTimerRef = useRef(null)
  const hoveredRef = useRef(false)
  const hiddenRef = useRef(false)
  const navigateRef = useRef(null)

  const makerEntries = useMemo(() => new Map((workspace.writingTree?.children ?? []).filter((entry) => entry.meta?.kind === 'maker').map((entry) => [entry.meta.assetKey, entry])), [workspace.writingTree])
  const fallbackMakerEntries = useMemo(() => new Map(musicRecommendationsTree.children.filter((entry) => entry.meta?.kind === 'maker').map((entry) => [entry.meta.assetKey, entry])), [])
  const albumEntries = useMemo(() => new Map((workspace.writingTree?.children ?? []).filter((entry) => entry.meta?.kind === 'album').map((entry) => [entry.meta.assetKey, entry])), [workspace.writingTree])
  const activeMaker = musicMakers[makerIndex] ?? null

  const clearAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) window.clearTimeout(autoplayTimerRef.current)
    autoplayTimerRef.current = null
  }, [])

  const clearManualResume = useCallback(() => {
    if (manualResumeTimerRef.current) window.clearTimeout(manualResumeTimerRef.current)
    manualResumeTimerRef.current = null
  }, [])

  const clearTransition = useCallback(() => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current)
    transitionTimerRef.current = null
    setMakerTransition(null)
  }, [])

  const startAutoplay = useCallback((delay = MAKER_ROTATION_INTERVAL) => {
    clearAutoplay()
    if (reducedMotion || musicMakers.length < 2 || hoveredRef.current || hiddenRef.current) return
    autoplayTimerRef.current = window.setTimeout(() => {
      autoplayTimerRef.current = null
      if (!hoveredRef.current && !hiddenRef.current && !reducedMotion) {
        navigateRef.current?.(1)
      }
    }, delay)
  }, [clearAutoplay, reducedMotion])

  const resumeAfterManualInput = useCallback(() => {
    clearManualResume()
    clearAutoplay()
    if (reducedMotion || musicMakers.length < 2 || hoveredRef.current || hiddenRef.current) return
    manualResumeTimerRef.current = window.setTimeout(() => {
      manualResumeTimerRef.current = null
      startAutoplay()
    }, MAKER_MANUAL_RESUME_DELAY)
  }, [clearAutoplay, clearManualResume, reducedMotion, startAutoplay])

  const navigate = useCallback((direction, { resetAutoplay = false } = {}) => {
    if (musicMakers.length < 2) return
    const fromIndex = activeMakerRef.current
    const toIndex = (fromIndex + direction + musicMakers.length) % musicMakers.length
    activeMakerRef.current = toIndex
    clearTransition()
    if (!reducedMotion) {
      setMakerTransition({ fromIndex, toIndex, direction: direction > 0 ? 'next' : 'previous' })
      transitionTimerRef.current = window.setTimeout(() => {
        transitionTimerRef.current = null
        setMakerTransition(null)
      }, MAKER_TRANSITION_DURATION)
    }
    setMakerIndex(toIndex)
    if (resetAutoplay) resumeAfterManualInput()
    else startAutoplay()
  }, [clearTransition, reducedMotion, resumeAfterManualInput, startAutoplay])

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    activeMakerRef.current = Math.min(makerIndex, Math.max(0, musicMakers.length - 1))
  }, [makerIndex])

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const updateMotion = () => {
      const nextReduced = Boolean(mediaQuery?.matches)
      setReducedMotion(nextReduced)
      if (nextReduced) clearTransition()
      else startAutoplay()
    }
    updateMotion()
    mediaQuery?.addEventListener?.('change', updateMotion)
    return () => mediaQuery?.removeEventListener?.('change', updateMotion)
  }, [clearTransition, startAutoplay])

  useEffect(() => {
    startAutoplay()
    const handleVisibility = () => {
      hiddenRef.current = document.hidden
      if (document.hidden) {
        clearAutoplay()
        clearManualResume()
      } else {
        startAutoplay()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearAutoplay()
      clearManualResume()
      clearTransition()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [clearAutoplay, clearManualResume, clearTransition, startAutoplay])

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target
      const isTextEntry = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if (isTextEntry) return
      if (event.key === 'Escape') setLockedAlbum(null)
      if (event.key === 'ArrowRight') navigateRef.current?.(1, { resetAutoplay: true })
      if (event.key === 'ArrowLeft') navigateRef.current?.(-1, { resetAutoplay: true })
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const selectMaker = (index) => {
    if (!musicMakers.length || index === makerIndex) return
    const direction = (index - makerIndex + musicMakers.length) % musicMakers.length <= musicMakers.length / 2 ? 1 : -1
    const target = (index + musicMakers.length) % musicMakers.length
    navigateRef.current?.(direction, { resetAutoplay: true })
    if (target !== (makerIndex + direction + musicMakers.length) % musicMakers.length) {
      activeMakerRef.current = target
      clearTransition()
      setMakerIndex(target)
    }
  }

  const handlePointerDown = (event) => {
    const target = event.target instanceof Element ? event.target : null
    if (musicMakers.length < 2 || (event.pointerType === 'mouse' && event.button !== 0) || target?.closest('button, a, input, textarea, select, [data-no-reel-drag]')) return
    dragRef.current = { id: event.pointerId, x: event.clientX }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerUp = (event) => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag || drag.id !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    const delta = event.clientX - drag.x
    if (Math.abs(delta) > MAKER_SWIPE_THRESHOLD) navigateRef.current?.(delta < 0 ? 1 : -1, { resetAutoplay: true })
  }

  const handleSave = async (nextEntry) => {
    if (!editingEntry) return
    await workspace.saveNode({ ...nextEntry, id: editingEntry.id, slug: editingEntry.slug, type: 'entry', title: editingEntry.title, meta: editingEntry.meta }, { mode: 'node' })
    setEditingEntry(null)
  }

  const getMakerSlot = (index) => {
    if (index === makerIndex) return 'feature'
    if (makerTransition?.fromIndex === index) {
      return `exiting-${makerTransition.direction}`
    }
    if (makerTransition?.toIndex === index) {
      return 'entering'
    }
    return 'queue'
  }

  const getMakerQueuePosition = (index) => {
    if (index === makerIndex || !musicMakers.length) return 0
    return (index - makerIndex + musicMakers.length) % musicMakers.length - 1
  }

  const getMakerItemStyle = (index) => ({
    '--maker-queue-index': getMakerQueuePosition(index),
    '--maker-queue-center': Math.max(0, musicMakers.length - 2) / 2,
  })

  if (!workspace.writingTree && workspace.isLoadingTree) return <main className="music-page-loading" role="status">音乐喜好加载中…</main>

  return <main className="music-page">
    <section className="music-hero" aria-labelledby="music-page-title">
      <div><span className="section-kicker">Works / 音乐喜好</span><h1 id="music-page-title">音乐喜好</h1><p>本页只读取本地 music_share 图片。制作人介绍和专辑乐评由作者在编辑模式中补充。</p></div>
      <div className="music-actions"><Link to="/interests" className="music-back-link">← 返回个人兴趣</Link>{workspace.canEdit ? <button type="button" onClick={workspace.exitEditorMode}>退出编辑模式</button> : null}</div>
    </section>

    {workspace.isAuthorMode ? <aside className={`writing-author-drawer music-author-drawer ${workspace.authorDrawerOpen ? 'is-open' : ''}`} aria-label="作者验证">
      <button type="button" className="writing-author-drawer-toggle" onClick={() => workspace.setAuthorDrawerOpen((value) => !value)} aria-expanded={workspace.authorDrawerOpen}><span>作者验证</span><span>{workspace.authorDrawerOpen ? '收起' : '展开'}</span></button>
      {workspace.authorDrawerOpen ? <div className="writing-author-drawer-panel"><p className="hidden-space-writing-count">当前作者模式入口：?edit=K</p><button type="button" className="btn secondary" onClick={workspace.requestAuthorAccess}>发送验证码</button><label className="writing-author-field"><span>6 位验证码</span><input inputMode="numeric" maxLength={6} value={workspace.authorOtp} onChange={(event) => workspace.setAuthorOtp(event.target.value)} /></label><button type="button" className="btn secondary" onClick={workspace.verifyOtp}>验证并启用编辑</button>{workspace.authorNotice ? <p className="writing-author-notice">{workspace.authorNotice}</p> : null}</div> : null}
    </aside> : null}

    <section className="music-maker-section" aria-labelledby="music-makers-title">
      <div className="music-section-heading"><span className="section-kicker">Makers / 制作人</span><h2 id="music-makers-title">正在听谁</h2></div>
      {musicMakers.length && activeMaker ? <div className={`music-reel ${reducedMotion ? 'is-reduced-motion' : ''}`} aria-live="polite" aria-roledescription="carousel" aria-label={`制作人 ${makerIndex + 1} / ${musicMakers.length}`}>
        <div className="music-maker-stage" onMouseEnter={() => { hoveredRef.current = true; clearAutoplay() }} onMouseLeave={() => { hoveredRef.current = false; startAutoplay() }} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => { dragRef.current = null }}>
          <div className="music-maker-queue-wrap music-maker-queue-wrap--left"><span className="music-maker-queue-label">QUEUE / 制作人队列</span></div>
          <div className="music-maker-items" aria-label="制作人选择">
            {musicMakers.map((maker, index) => {
              const slot = getMakerSlot(index)
              const makerEntry = makerEntries.get(maker.assetKey) ?? fallbackMakerEntries.get(maker.assetKey) ?? null
              const isCurrent = index === makerIndex
              return <div className={`music-maker-item music-maker-item--${slot}`} style={getMakerItemStyle(index, slot)} key={maker.assetKey}>
                <button type="button" className={`music-maker-avatar ${isCurrent ? 'is-selected' : ''}`} onClick={() => selectMaker(index)} aria-label={`选择制作人 ${maker.name}`} aria-current={isCurrent ? 'true' : undefined}>
                  <MusicImage item={maker} className="music-maker-avatar-image" />
                </button>
                {isCurrent ? <div className="music-maker-info">
                  <span className="section-kicker">当前制作人 / NOW PLAYING</span>
                  <h3>{maker.name}</h3>
                  <div className="music-maker-review">{renderMusicText(makerEntry)}</div>
                  {(workspace.canEdit || workspace.isAuthorMode) && makerEntry ? <button type="button" data-no-reel-drag onPointerDown={(event) => event.stopPropagation()} onClick={() => { if (workspace.canEdit) setEditingEntry(makerEntry); else workspace.setAuthorDrawerOpen(true) }}>{workspace.canEdit ? '编辑制作人评价' : '验证后编辑制作人评价'}</button> : null}
                </div> : null}
              </div>
            })}
          </div>
          <div className="music-maker-queue-wrap music-maker-queue-wrap--right" aria-hidden="true"><span className="music-maker-queue-label">NEXT / 稍后播放</span></div>
        </div>
        <div className="music-reel-controls">
          <button type="button" className="music-reel-control" onClick={() => navigateRef.current?.(-1, { resetAutoplay: true })} aria-label="上一位制作人" disabled={musicMakers.length < 2}>‹</button>
          <span className="music-maker-counter">{String(makerIndex + 1).padStart(2, '0')} / {String(musicMakers.length).padStart(2, '0')}</span>
          <button type="button" className="music-reel-control" onClick={() => navigateRef.current?.(1, { resetAutoplay: true })} aria-label="下一位制作人" disabled={musicMakers.length < 2}>›</button>
        </div>
      </div> : <div className="music-empty-state"><strong>还没有制作人图片</strong><p>将图片放入 src/assets/music_share/maker 后，这里会自动生成胶卷展示。</p></div>}
    </section>

    <section className="music-albums" aria-labelledby="music-albums-title">
      <div className="music-section-heading">
        <span className="section-kicker">Records / 专辑</span>
        <h2 id="music-albums-title">唱片盒</h2>
        {musicAlbums.length > 1 ? (
          <button
            type="button"
            className="music-albums-toggle"
            onClick={() => setAlbumsExpanded((current) => !current)}
          >
            {albumsExpanded ? '收起唱片' : '展开唱片'}
          </button>
        ) : null}
      </div>
      <div className={`music-albums-grid ${albumsExpanded ? 'is-expanded' : ''}`}>
        {musicAlbums.length ? musicAlbums.map((album, index) => {
          const entry = albumEntries.get(album.assetKey)
          const open = lockedAlbum === album.assetKey
          return <article className={`music-record-box ${open ? 'is-open' : ''}`} key={album.assetKey} style={{ '--album-index': index }}>
            <button type="button" className="music-record-toggle" onClick={() => setLockedAlbum((current) => current === album.assetKey ? null : album.assetKey)} aria-expanded={open}>
              <MusicImage item={album} />
              <span className="music-record-disc-stack" aria-hidden="true"><span className="music-record-disc" /></span>
              <span className="music-record-meta"><span className="music-record-title">{album.track}</span><span className="music-record-label"><small>{open ? '收起乐评' : '查看乐评'}</small></span></span>
            </button>
            {open ? <div className="music-record-review"><div className="music-record-review-content">{renderMusicText(entry)}{workspace.canEdit && entry ? <button type="button" onClick={() => setEditingEntry(entry)}>编辑乐评</button> : null}</div></div> : null}
          </article>
        }) : <div className="music-empty-state"><strong>还没有专辑图片</strong><p>将图片放入 src/assets/music_share/music 后，这里会自动生成唱片盒。</p></div>}
      </div>
    </section>

    <MusicReviewEditor entry={editingEntry} isOpen={Boolean(editingEntry)} onSave={handleSave} onClose={() => setEditingEntry(null)} isSaving={workspace.isSaving} error={workspace.editorError} />
  </main>
}

export default MusicPage
