import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BookReviewEditor from '../components/BookReviewEditor'
import { gameRecommendations, gameRecommendationsTree } from '../data/gameRecommendations'
import { useImageLoadState } from '../hooks/useImageLoadState'
import { useWritingWorkspace } from '../hooks/useWritingWorkspace'
import { GAME_WRITING_WORKSPACE } from '../services/writingService'
import Annotate from '../components/Annotate'

const PREVIEW_LENGTH = 200 // 预览字符数

function getReview(entry) {
  return String(entry?.detail ?? entry?.intro ?? '').trim()
}

function GameCover({ item }) {
  const { status, handleError, handleLoad } = useImageLoadState(item.src)
  return <div className={`game-cover game-cover--${status}`}>
    {item.src ? <img src={item.src} alt={`${item.title} 图片`} loading="lazy" decoding="async" onLoad={handleLoad} onError={handleError} /> : null}
    {status === 'loading' ? <span>图片加载中…</span> : null}
    {status === 'error' || status === 'empty' ? <span>图片暂不可用</span> : null}
  </div>
}

function GameReviewDisplay({ game, onEdit, canEdit }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const review = game.review
  const needsTruncation = review && review.length > PREVIEW_LENGTH
  const displayText = needsTruncation && !isExpanded
    ? review.substring(0, PREVIEW_LENGTH) + '...'
    : review

  return (
    <div className="game-item-copy">
      <div className={`game-review ${review ? '' : 'is-empty'}`}>
        {displayText || '作者待补充'}
      </div>
      {needsTruncation && (
        <button
          type="button"
          className="game-expand-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '收起' : '展开更多'}
        </button>
      )}
      {canEdit && (
        <button type="button" className="game-edit-button" onClick={onEdit}>
          编辑评价
        </button>
      )}
    </div>
  )
}

function GamePage() {
  const workspace = useWritingWorkspace({ workspace: GAME_WRITING_WORKSPACE, fallbackTree: gameRecommendationsTree })
  const [editingEntry, setEditingEntry] = useState(null)
  const entriesByAssetKey = useMemo(() => new Map((workspace.writingTree?.children ?? []).filter((entry) => entry?.meta?.assetKey).map((entry) => [entry.meta.assetKey, entry])), [workspace.writingTree])
  const games = useMemo(() => {
    const result = gameRecommendations.map((item) => {
      const entry = entriesByAssetKey.get(item.assetKey)
      const finalEntry = entry ?? {
        id: item.entryId,
        slug: item.assetKey,
        type: 'entry',
        title: item.title,
        intro: '',
        detail: '',
        meta: { assetKey: item.assetKey }
      }
      const review = getReview(finalEntry)
      return { ...item, entry: finalEntry, review }
    })
    return result
  }, [entriesByAssetKey])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      if (event.key === 'Escape') {
        setEditingEntry(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSave = async (detail) => {
    const source = editingEntry
    if (!source) return

    const nodeToSave = {
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
    }

    const didSave = await workspace.saveNode(nodeToSave, { mode: 'node' })
    if (didSave) setEditingEntry(null)
  }

  if (!workspace.writingTree && workspace.isLoadingTree) return <main className="game-page-loading" role="status">游戏推荐加载中…</main>

  return <main className="game-page">
    <section className="game-hero" aria-labelledby="game-page-title">
      <div><span className="section-kicker">Works / 游戏推荐</span><h1 id="game-page-title">游戏推荐</h1><p>游戏图片来自本地 game 文件夹，评价由作者在编辑模式中补充。</p></div>
      <div className="game-hero-actions"><Link to="/interests" className="game-back-link">← 返回个人兴趣</Link></div>
    </section>
    {workspace.isAuthorMode ? <aside className={`writing-author-drawer game-author-drawer ${workspace.authorDrawerOpen ? 'is-open' : ''}`} aria-label="作者验证">
      <button type="button" className="writing-author-drawer-toggle" onClick={() => workspace.setAuthorDrawerOpen((value) => !value)} aria-expanded={workspace.authorDrawerOpen}><span>作者验证</span><span>{workspace.authorDrawerOpen ? '收起' : '展开'}</span></button>
      {workspace.authorDrawerOpen ? <div className="writing-author-drawer-panel"><p className="hidden-space-writing-count">当前作者模式入口：?edit=K</p><button type="button" className="btn secondary" onClick={workspace.requestAuthorAccess}>发送验证码</button><label className="writing-author-field"><span>6 位验证码</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={workspace.authorOtp} onChange={(event) => workspace.setAuthorOtp(event.target.value)} /></label><button type="button" className="btn secondary" onClick={workspace.verifyOtp}>验证并启用编辑</button>{workspace.authorNotice ? <p className="writing-author-notice">{workspace.authorNotice}</p> : null}{workspace.editorError ? <p className="writing-author-error">{workspace.editorError}</p> : null}</div> : null}
    </aside> : null}
    <section className="game-list" aria-label="游戏推荐列表">
      {games.length ? games.map((game) => {
        return <article className="game-item" key={game.assetKey}>
          <div className="game-item-header">
            <GameCover item={game} />
            <span className="game-item-title">{game.title}</span>
          </div>
          <GameReviewDisplay
            game={game}
            canEdit={workspace.canEdit}
            onEdit={() => setEditingEntry(game.entry)}
          />
        </article>
      }) : <div className="game-empty-state"><strong>还没有本地游戏图片</strong><p>将图片放入 src/assets/game 后，这里会自动生成游戏推荐。</p></div>}
    </section>
    <BookReviewEditor entry={editingEntry} isOpen={Boolean(editingEntry)} onSave={handleSave} onClose={() => setEditingEntry(null)} isSaving={workspace.isSaving} error={workspace.editorError} subject="这款游戏" kicker="Game note / 游戏评价" title="编辑游戏评价" />
  </main>
}

export default GamePage
