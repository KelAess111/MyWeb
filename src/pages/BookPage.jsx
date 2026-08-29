import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BookReviewEditor from '../components/BookReviewEditor'
import { bookRecommendations, bookRecommendationsTree } from '../data/bookRecommendations'
import { useImageLoadState } from '../hooks/useImageLoadState'
import { useWritingWorkspace } from '../hooks/useWritingWorkspace'
import { BOOK_WRITING_WORKSPACE } from '../services/writingService'

function getReview(entry) {
  return String(entry?.detail ?? entry?.intro ?? '').trim()
}

function BookCover({ item }) {
  const { status, handleError, handleLoad } = useImageLoadState(item.src)
  return <div className={`book-cover book-cover--${status}`}>
    {item.src ? <img src={item.src} alt={`${item.title} 封面`} loading="lazy" decoding="async" onLoad={handleLoad} onError={handleError} /> : null}
    {status === 'loading' ? <span>图片加载中…</span> : null}
    {status === 'error' || status === 'empty' ? <span>图片暂不可用</span> : null}
  </div>
}

function BookPage() {
  const workspace = useWritingWorkspace({ workspace: BOOK_WRITING_WORKSPACE, fallbackTree: bookRecommendationsTree })
  const [lockedEntryId, setLockedEntryId] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const entriesByAssetKey = useMemo(() => new Map((workspace.writingTree?.children ?? []).filter((entry) => entry.meta?.assetKey).map((entry) => [entry.meta.assetKey, entry])), [workspace.writingTree])
  const books = useMemo(() => bookRecommendations.map((item) => {
    const entry = entriesByAssetKey.get(item.assetKey) ?? bookRecommendationsTree.children.find((candidate) => candidate.meta.assetKey === item.assetKey)
    return { ...item, entry, review: getReview(entry) }
  }), [entriesByAssetKey])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      if (event.key === 'Escape') setLockedEntryId(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSave = async (detail) => {
    const source = editingEntry
    if (!source) return
    const didSave = await workspace.saveNode({
      id: source.id,
      slug: source.slug,
      type: 'entry',
      title: source.title,
      intro: '',
      detail,
      date: source.date,
      status: source.status,
      template: source.template,
      excerptLabel: source.excerptLabel,
      meta: { ...(source.meta ?? {}), assetKey: source.meta?.assetKey },
      blocks: source.blocks ?? [],
      annotations: source.annotations ?? [],
      ocHoverLine: source.ocHoverLine,
    }, { mode: 'node' })
    if (didSave) setEditingEntry(null)
  }

  if (!workspace.writingTree && workspace.isLoadingTree) return <main className="book-page-loading" role="status">推荐书目加载中…</main>

  return <main className="book-page">
    <section className="book-hero" aria-labelledby="book-page-title">
      <div><span className="section-kicker">Works / 推荐书目</span><h1 id="book-page-title">推荐书目</h1><p>书封来自本地 book 文件夹，书评由作者在编辑模式中补充。</p></div>
      <div className="book-hero-actions"><Link to="/interests" className="book-back-link">← 返回个人兴趣</Link></div>
    </section>
    {workspace.isAuthorMode ? <aside className={`writing-author-drawer book-author-drawer ${workspace.authorDrawerOpen ? 'is-open' : ''}`} aria-label="作者验证">
      <button type="button" className="writing-author-drawer-toggle" onClick={() => workspace.setAuthorDrawerOpen((value) => !value)} aria-expanded={workspace.authorDrawerOpen}><span>作者验证</span><span>{workspace.authorDrawerOpen ? '收起' : '展开'}</span></button>
      {workspace.authorDrawerOpen ? <div className="writing-author-drawer-panel"><p className="hidden-space-writing-count">当前作者模式入口：?edit=K</p><button type="button" className="btn secondary" onClick={workspace.requestAuthorAccess}>发送验证码</button><label className="writing-author-field"><span>6 位验证码</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={workspace.authorOtp} onChange={(event) => workspace.setAuthorOtp(event.target.value)} /></label><button type="button" className="btn secondary" onClick={workspace.verifyOtp}>验证并启用编辑</button>{workspace.authorNotice ? <p className="writing-author-notice">{workspace.authorNotice}</p> : null}{workspace.editorError ? <p className="writing-author-error">{workspace.editorError}</p> : null}</div> : null}
    </aside> : null}
    <section className="book-list" aria-label="推荐书目列表">
      {books.length ? books.map((book) => {
        const open = lockedEntryId === book.entry.id
        const reviewId = `book-review-${book.assetKey}`
        return <article className={`book-item ${open ? 'is-locked' : ''}`} key={book.assetKey}>
          <button type="button" className="book-item-toggle" onClick={() => setLockedEntryId((current) => current === book.entry.id ? null : book.entry.id)} aria-expanded={open} aria-controls={reviewId} aria-label={`${open ? '收起' : '展开'}《${book.title}》书评`}><BookCover item={book} /><span className="book-item-title">{book.title}</span></button>
          <div id={reviewId} className={`book-review ${book.review ? '' : 'is-empty'}`} hidden={!open}>{book.review || '作者待补充'}</div>
          {workspace.canEdit ? <button type="button" className="book-edit-button" onClick={() => setEditingEntry(book.entry)}>编辑评价</button> : null}
        </article>
      }) : <div className="book-empty-state"><strong>还没有本地书籍图片</strong><p>将图片放入 src/assets/book 后，这里会自动生成推荐书目。</p></div>}
    </section>
    <BookReviewEditor entry={editingEntry} isOpen={Boolean(editingEntry)} onSave={handleSave} onClose={() => setEditingEntry(null)} isSaving={workspace.isSaving} error={workspace.editorError} subject="这本书" kicker="Book note / 书评" title="编辑书评" />
  </main>
}

export default BookPage
