import WritingContainer from '../components/WritingContainer'
import { publicWritingData } from '../data/publicWritingData'
import { PUBLIC_WRITING_WORKSPACE } from '../services/writingService'
import { useWritingWorkspace } from '../hooks/useWritingWorkspace'

function PublicWritingPage() {
  const {
    authorDrawerOpen,
    authorNotice,
    authorOtp,
    canEdit,
    deleteNode,
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
    workspace: PUBLIC_WRITING_WORKSPACE,
    fallbackTree: publicWritingData,
  })

  if (!writingTree && isLoadingTree) {
    return <div className="hidden-space-writing-shell-loading">写作模块加载中…</div>
  }

  return (
    <>
      <WritingContainer
        data={writingTree}
        titlePrefix="Works / 写作"
        routeLabel={isLoadingTree ? '写作角落（加载中）' : '写作角落'}
        backTo="/"
        rootLabel="首页"
        editorMode={canEdit}
        onEditNode={canEdit ? saveNode : undefined}
        onDeleteNode={canEdit ? deleteNode : undefined}
        onToggleEditorMode={isAuthorMode ? exitEditorMode : undefined}
        onRequestEditorAccess={isAuthorMode ? () => setAuthorDrawerOpen((current) => !current) : undefined}
        isSaving={isSaving}
        layoutVariant="public"
      />

      {isAuthorMode ? (
        <aside className={`writing-author-drawer ${authorDrawerOpen ? 'is-open' : ''}`} aria-label="作者验证">
          <button type="button" className="writing-author-drawer-toggle" onClick={() => setAuthorDrawerOpen((current) => !current)} aria-expanded={authorDrawerOpen}>
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
                <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={authorOtp} onChange={(event) => setAuthorOtp(event.target.value)} placeholder="请输入 6 位验证码" />
              </label>
              <button type="button" className="btn secondary" onClick={verifyOtp}>
                验证并启用编辑
              </button>
            </div>
          ) : null}
        </aside>
      ) : null}

      {authorNotice ? <p className="writing-author-notice">{authorNotice}</p> : null}
      {editorError ? <p className="writing-author-error" role="alert">{editorError}</p> : null}
    </>
  )
}

export default PublicWritingPage
