import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import AfterlightAttachmentGrid from '../components/AfterlightAttachmentGrid'
import AfterlightEditor, { createEmptyJournalDraft } from '../components/AfterlightEditor'
import AnnotatedText from '../components/AnnotatedText'
import {
  createJournalEntry,
  deleteJournalEntry,
  getCurrentAuthorSession,
  listEditableJournalEntries,
  listPublishedJournalEntries,
  signInAuthor,
  signOutAuthor,
  subscribeToAuthorSession,
  updateJournalEntry,
} from '../services/afterlightEntries'
import { isSupabaseConfigured } from '../lib/supabase'

const AUTHOR_EMAIL_STORAGE_KEY = 'afterlight-author-email'

function formatEntryDate(entryDate) {
  if (!entryDate) {
    return '未填写日期'
  }

  return new Date(`${entryDate}T00:00:00`).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function JournalEntryCard({ entry, onEdit }) {
  return (
    <article className={`hidden-space-game-card afterlight-entry-card ${entry.published ? '' : 'is-draft'}`.trim()}>
      <div className="afterlight-entry-meta">
        <span className="afterlight-entry-date">{formatEntryDate(entry.entryDate)}</span>
        <span className={`afterlight-entry-badge ${entry.published ? 'is-published' : 'is-draft'}`}>
          {entry.published ? '已公开' : '草稿'}
        </span>
      </div>

      <div className="hidden-space-game-copy afterlight-entry-copy">
        <h2>{entry.title || '未命名日志'}</h2>
        <AnnotatedText body={entry.body} annotations={entry.annotations} idPrefix={`afterlight-entry-${entry.id}`} />
        <AfterlightAttachmentGrid attachments={entry.attachments} />
      </div>

      {onEdit ? (
        <div className="afterlight-entry-actions">
          <button type="button" className="btn secondary" onClick={onEdit}>
            编辑这篇日志
          </button>
        </div>
      ) : null}
    </article>
  )
}

function HiddenSpaceJournalPage() {
  const { setActiveScene, defaultScene } = useOutletContext()
  const [entries, setEntries] = useState([])
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [authorEmail, setAuthorEmail] = useState(() => window.localStorage.getItem(AUTHOR_EMAIL_STORAGE_KEY) ?? '')
  const [activeDraft, setActiveDraft] = useState(createEmptyJournalDraft())
  const [editingEntryId, setEditingEntryId] = useState(null)

  const isAuthor = Boolean(session?.user)

  useEffect(() => {
    setActiveScene(defaultScene)
  }, [defaultScene, setActiveScene])

  useEffect(() => {
    window.localStorage.setItem(AUTHOR_EMAIL_STORAGE_KEY, authorEmail)
  }, [authorEmail])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false)
      setEntries([])
      return undefined
    }

    let isCancelled = false

    const bootstrap = async () => {
      try {
        const currentSession = await getCurrentAuthorSession()
        if (isCancelled) {
          return
        }

        setSession(currentSession)

        const nextEntries = currentSession ? await listEditableJournalEntries() : await listPublishedJournalEntries()

        if (!isCancelled) {
          setEntries(nextEntries)
          setErrorMessage('')
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage('日志内容暂时没有加载成功。请稍后再试，或检查 Supabase 配置是否完整。')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    bootstrap()

    const unsubscribe = subscribeToAuthorSession(async (nextSession) => {
      setSession(nextSession)
      setEditingEntryId(null)
      setActiveDraft(createEmptyJournalDraft())
      setStatusMessage(nextSession ? '作者模式已开启。现在可以直接在网页里新增、编辑并上传媒体。' : '已退出作者模式。')

      try {
        const nextEntries = nextSession ? await listEditableJournalEntries() : await listPublishedJournalEntries()
        setEntries(nextEntries)
        setErrorMessage('')
      } catch {
        setErrorMessage('作者状态已切换，但日志列表刷新失败。')
      }
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [])

  const visibleEntries = useMemo(() => {
    if (isAuthor) {
      return entries
    }

    return entries.filter((entry) => entry.published)
  }, [entries, isAuthor])

  const handleStartCreate = () => {
    setEditingEntryId(null)
    setActiveDraft(createEmptyJournalDraft())
    setStatusMessage('')
    setErrorMessage('')
  }

  const handleStartEdit = (entry) => {
    setEditingEntryId(entry.id)
    setActiveDraft({
      title: entry.title,
      entryDate: entry.entryDate,
      body: entry.body,
      published: entry.published,
      annotations: entry.annotations,
      attachments: entry.attachments ?? [],
    })
    setStatusMessage('')
    setErrorMessage('')
  }

  const handleCancelEdit = () => {
    setEditingEntryId(null)
    setActiveDraft(createEmptyJournalDraft())
    setStatusMessage('')
    setErrorMessage('')
  }

  const handleDraftChange = (nextDraftOrUpdater) => {
    setActiveDraft((currentDraft) =>
      typeof nextDraftOrUpdater === 'function'
        ? nextDraftOrUpdater(currentDraft)
        : nextDraftOrUpdater,
    )
  }

  const handleSubmitDraft = async (draft) => {
    setIsSaving(true)
    setStatusMessage('')
    setErrorMessage('')

    try {
      if (editingEntryId) {
        const updatedEntry = await updateJournalEntry(editingEntryId, draft)
        setActiveDraft({
          title: updatedEntry.title,
          entryDate: updatedEntry.entryDate,
          body: updatedEntry.body,
          published: updatedEntry.published,
          annotations: updatedEntry.annotations,
          attachments: updatedEntry.attachments ?? [],
        })
        setStatusMessage(draft.published ? '日志与附件已更新，并保持为公开状态。' : '日志草稿与附件已更新。')
      } else {
        const createdEntry = await createJournalEntry(draft)
        setStatusMessage(draft.published ? '新日志已发布。现在可以继续为它上传图片或视频。' : '新日志草稿已保存。现在可以继续上传图片或视频。')
        setEditingEntryId(createdEntry.id)
        setActiveDraft({
          title: createdEntry.title,
          entryDate: createdEntry.entryDate,
          body: createdEntry.body,
          published: createdEntry.published,
          annotations: createdEntry.annotations,
          attachments: createdEntry.attachments ?? [],
        })
      }

      await refreshEntries()
    } catch (error) {
      if (error?.message === 'missing-supabase-config') {
        setErrorMessage('还没有配置 Supabase，暂时不能保存日志。请先补上环境变量。')
      } else if (error?.message === 'missing-author-session') {
        setErrorMessage('当前作者登录态已失效，请重新登录后再保存。')
      } else {
        setErrorMessage('保存失败了。请检查登录状态、表结构和 RLS 权限。')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEntry = async () => {
    if (!editingEntryId) {
      return
    }

    setIsSaving(true)
    setStatusMessage('')
    setErrorMessage('')

    try {
      await deleteJournalEntry(editingEntryId)
      await refreshEntries()
      setEditingEntryId(null)
      setActiveDraft(createEmptyJournalDraft())
      setStatusMessage('日志已删除。')
    } catch {
      setErrorMessage('删除失败了。请检查作者权限是否正常。')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAuthorLogin = async (event) => {
    event.preventDefault()
    setStatusMessage('')
    setErrorMessage('')

    if (!authorEmail.trim()) {
      setErrorMessage('请先填写作者邮箱，再发送登录链接。')
      return
    }

    try {
      await signInAuthor(authorEmail.trim())
      setStatusMessage('登录链接已发送到你的邮箱。打开邮件里的链接后，回来刷新这个页面即可进入作者模式。')
    } catch (error) {
      if (error?.message === 'missing-supabase-config') {
        setErrorMessage('还没有配置 Supabase，暂时不能发送登录链接。')
      } else {
        setErrorMessage('登录链接发送失败。请检查 Supabase Auth 的邮箱登录配置。')
      }
    }
  }

  const handleAuthorLogout = async () => {
    setStatusMessage('')
    setErrorMessage('')

    try {
      await signOutAuthor()
    } catch {
      setErrorMessage('退出作者模式失败了，请稍后再试。')
    }
  }

  return (
    <section className="section hidden-archive-page hidden-space-journal-page accent-amber">
      <div className="section-heading hidden-archive-heading">
        <span className="section-kicker">Afterlight / 日志</span>
        <h1 className="category-page-title">日志角落</h1>
        <p>
          这里会按日期收纳那些我不想轻易丢掉的事。正文里可以直接挂上注释，把当时没忍住的吐槽一起留下来，也可以继续补图片和视频。
        </p>
      </div>

      <div className="category-page-actions afterlight-top-actions">
        <Link to=".." relative="path" className="btn secondary">
          返回隐藏空间首页
        </Link>
        {isAuthor ? (
          <button type="button" className="btn secondary" onClick={handleStartCreate}>
            写一条新日志
          </button>
        ) : null}
      </div>

      {!isSupabaseConfigured ? (
        <article className="work-category-panel afterlight-config-panel accent-amber">
          <h2>还差一步：把日志接上真实存储</h2>
          <p>
            页面结构和作者编辑入口已经准备好了，但要真正实现“访客只读、作者网页内编辑”，你还需要配置
            <code>VITE_SUPABASE_URL</code> 和 <code>VITE_SUPABASE_ANON_KEY</code>。
          </p>
          <p>
            同时需要在 Supabase 里创建 <code>afterlight_entries</code> 表、开启邮件登录，并设置 RLS 让匿名访客只读、作者账号可写。
          </p>
        </article>
      ) : null}

      <section className="hidden-space-game-list afterlight-entry-list">
        {isLoading ? (
          <article className="hidden-space-game-card afterlight-entry-card">
            <p>日志正在加载……</p>
          </article>
        ) : visibleEntries.length ? (
          visibleEntries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onEdit={isAuthor ? () => handleStartEdit(entry) : null}
            />
          ))
        ) : (
          <article className="hidden-space-game-card afterlight-entry-card">
            <p>{isAuthor ? '还没有日志。可以先写第一条。' : '这里暂时还没有公开日志。'}</p>
          </article>
        )}
      </section>

      {isSupabaseConfigured ? (
        <>
          {isAuthor ? (
            <section className="work-category-panel afterlight-author-panel accent-amber is-author-mode">
              <div className="afterlight-author-copy">
                <div className="afterlight-author-actions">
                  <div>
                    <h2>{editingEntryId ? '编辑日志' : '新建日志'}</h2>
                    <p>
                      {editingEntryId
                        ? '正在编辑这条日志。保存后会把正文、注释与附件一起同步回列表。'
                        : '先写下日志内容，保存一次后就可以继续上传图片或视频。'}
                    </p>
                  </div>
                  <div className="afterlight-author-actions">
                    <span className="afterlight-author-email">{session?.user?.email ?? '当前已进入作者模式'}</span>
                    <button type="button" className="btn secondary" onClick={handleAuthorLogout}>
                      退出作者模式
                    </button>
                  </div>
                </div>
              </div>
              <AfterlightEditor
                key={editingEntryId ?? 'new-entry'}
                entry={activeDraft}
                entryId={editingEntryId}
                onChange={handleDraftChange}
                onSubmit={handleSubmitDraft}
                onDelete={handleDeleteEntry}
                onCancel={handleCancelEdit}
                submitLabel={editingEntryId ? '更新日志' : '保存新日志'}
                isSaving={isSaving}
                canDelete={Boolean(editingEntryId)}
              />
              {statusMessage ? <p className="afterlight-status-message is-success">{statusMessage}</p> : null}
              {errorMessage ? <p className="afterlight-status-message is-error">{errorMessage}</p> : null}
            </section>
          ) : (
            <section className="work-category-panel afterlight-author-panel accent-amber is-visitor-mode afterlight-author-panel--footer">
              <div className="afterlight-author-copy">
                <h2>作者入口</h2>
                <p>访客默认只看公开日志；如果需要维护内容，可以在页面底部展开这里发送邮箱登录链接。</p>
              </div>
              <details className="afterlight-login-disclosure">
                <summary className="afterlight-login-summary">展开作者登录</summary>
                <form className="afterlight-login-form" onSubmit={handleAuthorLogin}>
                  <label className="afterlight-field">
                    <span>作者邮箱</span>
                    <input
                      type="email"
                      value={authorEmail}
                      onChange={(event) => setAuthorEmail(event.target.value)}
                      placeholder="输入你自己的邮箱，用于接收 magic link"
                    />
                  </label>
                  <button type="submit" className="btn secondary">
                    发送登录链接
                  </button>
                </form>
              </details>
              {statusMessage ? <p className="afterlight-status-message is-success">{statusMessage}</p> : null}
              {errorMessage ? <p className="afterlight-status-message is-error">{errorMessage}</p> : null}
            </section>
          )}
        </>
      ) : null}
    </section>
  )
}

export default HiddenSpaceJournalPage
