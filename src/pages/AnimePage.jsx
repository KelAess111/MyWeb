import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BookReviewEditor from '../components/BookReviewEditor'
import { animeRecommendations, animeRecommendationsTree } from '../data/animeRecommendations'
import { useImageLoadState } from '../hooks/useImageLoadState'
import { useWritingWorkspace } from '../hooks/useWritingWorkspace'
import { ANIME_WRITING_WORKSPACE } from '../services/writingService'

function getReview(entry) {
  return [entry?.intro, entry?.detail]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join('\n\n')
}

function AnimeCover({ item, eager = false }) {
  const { status, handleError, handleLoad } = useImageLoadState(item.src)

  return (
    <div className={`anime-card-media anime-card-media--${status}`}>
      {item.src ? (
        <img
          src={item.src}
          alt={`${item.title} 封面`}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          draggable="false"
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : null}
      {status === 'loading' ? <span className="anime-card-media-status" aria-live="polite">图片加载中…</span> : null}
      {status === 'error' || status === 'empty' ? <span className="anime-card-media-status">图片暂不可用</span> : null}
    </div>
  )
}

function AnimePage() {
  const {
    authorDrawerOpen,
    authorNotice,
    authorOtp,
    canEdit,
    editorError,
    exitEditorMode,
    isAuthorMode,
    isLoadingTree,
    isSaving,
    requestAuthorAccess,
    saveNode,
    setAuthorDrawerOpen,
    setAuthorOtp,
    verifyOtp,
    writingTree,
  } = useWritingWorkspace({
    workspace: ANIME_WRITING_WORKSPACE,
    fallbackTree: animeRecommendationsTree,
  })
  const [lockedEntryId, setLockedEntryId] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)

  const entriesByAssetKey = useMemo(() => {
    const entries = writingTree?.children ?? []
    return new Map(
      entries
        .filter((entry) => entry?.type === 'entry' && entry.meta?.assetKey)
        .map((entry) => [entry.meta.assetKey, entry]),
    )
  }, [writingTree])

  const cards = useMemo(() => animeRecommendations.map((item) => {
    const entry = entriesByAssetKey.get(item.assetKey) ?? {
      id: item.entryId,
      slug: item.assetKey,
      type: 'entry',
      title: item.title,
      intro: '',
      detail: '',
      status: 'incomplete',
      excerptLabel: '观感',
      meta: { assetKey: item.assetKey },
      blocks: [],
      annotations: [],
    }

    return {
      ...item,
      entry,
      review: getReview(entry),
    }
  }), [entriesByAssetKey])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      if (event.key === 'Escape') {
        setLockedEntryId(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCardClick = (entryId) => {
    setLockedEntryId((current) => (current === entryId ? null : entryId))
  }

  const handleSaveEntry = async (detail) => {
    const sourceEntry = editingEntry
    if (!sourceEntry) return

    const didSave = await saveNode({
      id: sourceEntry.id,
      slug: sourceEntry.slug,
      type: 'entry',
      title: sourceEntry.title,
      intro: '',
      detail,
      date: sourceEntry.date,
      status: sourceEntry.status,
      template: sourceEntry.template,
      excerptLabel: sourceEntry.excerptLabel,
      meta: { ...(sourceEntry.meta ?? {}) },
      blocks: sourceEntry.blocks ?? [],
      annotations: sourceEntry.annotations ?? [],
      ocHoverLine: sourceEntry.ocHoverLine,
    }, { mode: 'node' })

    if (didSave) setEditingEntry(null)
  }

  if (!writingTree && isLoadingTree) {
    return <main className="anime-page-loading" role="status">动漫推荐加载中…</main>
  }

  return (
    <main className="anime-page">
      <section className="anime-hero" aria-labelledby="anime-page-title">
        <div>
          <span className="section-kicker">Works / 动漫推荐</span>
          <h1 id="anime-page-title">动漫推荐</h1>
          <p>这里只读取本地 animation 文件夹里的图片。作品名来自文件名，评价由作者在沙箱里补充。</p>
        </div>
        <div className="anime-hero-actions">
          <Link to="/interests" className="anime-back-link">
            <span aria-hidden="true">←</span> 返回个人兴趣
          </Link>
          {canEdit ? (
            <button type="button" className="anime-edit-exit" onClick={exitEditorMode}>
              退出编辑模式
            </button>
          ) : null}
        </div>
      </section>

      {isAuthorMode ? (
        <aside className={`writing-author-drawer anime-author-drawer ${authorDrawerOpen ? 'is-open' : ''}`} aria-label="作者验证">
          <button
            type="button"
            className="writing-author-drawer-toggle"
            onClick={() => setAuthorDrawerOpen((current) => !current)}
            aria-expanded={authorDrawerOpen}
          >
            <span>作者验证</span>
            <span aria-hidden="true">{authorDrawerOpen ? '收起' : '展开'}</span>
          </button>
          {authorDrawerOpen ? (
            <div className="writing-author-drawer-panel">
              <p className="hidden-space-writing-count">当前作者模式入口：?edit=K</p>
              <button type="button" className="btn secondary" onClick={requestAuthorAccess}>
                发送验证码
              </button>
              <label className="writing-author-field">
                <span>6 位验证码</span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={authorOtp}
                  onChange={(event) => setAuthorOtp(event.target.value)}
                  placeholder="请输入 6 位验证码"
                />
              </label>
              <button type="button" className="btn secondary" onClick={verifyOtp}>
                验证并启用编辑
              </button>
              {authorNotice ? <p className="writing-author-notice">{authorNotice}</p> : null}
              {editorError ? <p className="writing-author-error">{editorError}</p> : null}
            </div>
          ) : null}
        </aside>
      ) : null}

      <section className="anime-grid" aria-label="动漫推荐列表">
        {cards.length ? cards.map((card, index) => {
          const isLocked = lockedEntryId === card.entry.id
          const hasReview = Boolean(card.review)
          const titleId = `anime-title-${card.assetKey}`
          const reviewId = `anime-review-${card.assetKey}`

          return (
            <article key={card.assetKey} className={`anime-card ${isLocked ? 'is-locked' : ''}`}>
              <button
                type="button"
                className="anime-card-button"
                onClick={() => handleCardClick(card.entry.id)}
                aria-expanded={isLocked}
                aria-controls={reviewId}
                aria-labelledby={titleId}
              >
                <AnimeCover item={card} eager={index === 0} />
                <span id={titleId} className="anime-card-title">{card.title}</span>
              </button>
              <div id={reviewId} className={`anime-card-review ${hasReview ? '' : 'is-empty'}`} hidden={!isLocked}>
                {hasReview ? card.review : '作者待补充'}
              </div>
              {canEdit ? (
                <button type="button" className="anime-card-edit" onClick={() => setEditingEntry(card.entry)}>
                  编辑评价
                </button>
              ) : null}
            </article>
          )
        }) : (
          <div className="anime-empty-state">
            <strong>还没有本地动漫图片</strong>
            <p>将图片放入 src/assets/animation 后，这里会自动生成卡片。</p>
          </div>
        )}
      </section>

      <BookReviewEditor
        entry={editingEntry}
        isOpen={Boolean(editingEntry)}
        onSave={handleSaveEntry}
        onClose={() => setEditingEntry(null)}
        isSaving={isSaving}
        error={editorError}
        subject="这部动漫"
        kicker="Anime note / 动漫评价"
        title="编辑动漫评价"
      />
    </main>
  )
}

export default AnimePage
