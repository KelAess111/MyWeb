import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import AfterlightAttachmentGrid from '../components/AfterlightAttachmentGrid'
import AfterlightEditor from '../components/AfterlightEditor'
import { createEmptyJournalDraft } from '../utils/journalDrafts'
import AnnotatedText from '../components/AnnotatedText'
import {
  createJournalEntry,
  deleteJournalEntry,
  listEditableJournalEntries,
  updateJournalEntry,
} from '../services/afterlightEntries'
import { isSupabaseConfigured } from '../lib/supabase'

const EDIT_TOKEN = 'KelAess'
const JOURNAL_ADMIN_AUTH_STORAGE_KEY = 'writing_admin_auth'

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

function readJournalAdminAuth() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(JOURNAL_ADMIN_AUTH_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function getEntryDraft(entry) {
  return {
    title: entry.title,
    entryDate: entry.entryDate,
    body: entry.body,
    published: entry.published,
    annotations: entry.annotations,
    attachments: entry.attachments ?? [],
  }
}

function JournalEntryCard({ entry, onEdit, onDelete, isDeleting = false }) {
  return (
    <article className={`hidden-space-game-card afterlight-entry-card ${entry.published ? '' : 'is-draft'}`.trim()}>
      <div className="afterlight-entry-meta">
        <span className="afterlight-entry-date">{formatEntryDate(entry.entryDate)}</span>
        <span className={`afterlight-entry-badge ${entry.published ? 'is-published' : 'is-draft'}`}>
          {entry.published ? '已公开' : '未公开'}
        </span>
      </div>

      <div className="hidden-space-game-copy afterlight-entry-copy">
        <h2>{entry.title || '未命名日志'}</h2>
        <AnnotatedText body={entry.body} annotations={entry.annotations} idPrefix={`afterlight-entry-${entry.id}`} />
        <AfterlightAttachmentGrid attachments={entry.attachments} />
      </div>

      {onEdit || onDelete ? (
        <div className="afterlight-entry-actions">
          {onEdit ? (
            <button type="button" className="btn secondary" onClick={onEdit}>
              编辑这篇日志
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" className="btn secondary danger" onClick={onDelete} disabled={isDeleting}>
              {isDeleting ? '删除中…' : '删除'}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function HiddenSpaceJournalPage() {
  const { setActiveScene, defaultScene } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const editToken = searchParams.get('edit')
  const storedAuthorAuth = readJournalAdminAuth()

  // 检查本地编辑模式
  const isLocalEditMode = typeof window !== 'undefined' &&
    window.sessionStorage.getItem('previewMode') !== 'true' &&
    window.localStorage.getItem('localEditMode') === 'true'

  // 只允许本地编辑模式，禁用 ?edit=KelAess 远程认证
  const isAuthor = isLocalEditMode
  const modeKey = isAuthor ? 'author' : 'public'

  const [entries, setEntries] = useState([])
  const [resolvedModeKey, setResolvedModeKey] = useState(() => (isSupabaseConfigured ? null : modeKey))
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeDraft, setActiveDraft] = useState(createEmptyJournalDraft())
  const [editingEntryId, setEditingEntryId] = useState(null)
  const previousModeKeyRef = useRef(modeKey)

  const isLoading = isSupabaseConfigured && resolvedModeKey !== modeKey

  useEffect(() => {
    setActiveScene(defaultScene)
  }, [defaultScene, setActiveScene])

  useEffect(() => {
    const previousModeKey = previousModeKeyRef.current

    if (previousModeKey !== modeKey && previousModeKey === 'author' && modeKey === 'public') {
      setEditingEntryId(null)
      setActiveDraft(createEmptyJournalDraft())
      setStatusMessage('')
      setErrorMessage('')
    }

    previousModeKeyRef.current = modeKey
  }, [modeKey])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let isCancelled = false

    const bootstrap = async () => {
      try {
        const nextEntries = await listEditableJournalEntries()

        if (!isCancelled) {
          setEntries(nextEntries)
          setResolvedModeKey(modeKey)
          setErrorMessage('')
        }
      } catch {
        if (!isCancelled) {
          setResolvedModeKey(modeKey)
          setErrorMessage(
            isAuthor
              ? '日志内容暂时没有加载成功。请稍后再试，或检查 Supabase 配置、数据表与读写权限是否完整。'
              : '日志内容暂时没有加载成功。请稍后再试，或检查 Supabase 配置是否完整。',
          )
        }
      }
    }

    bootstrap()

    return () => {
      isCancelled = true
    }
  }, [isAuthor, modeKey])

  const visibleEntries = entries

  const refreshEntries = async () => {
    const nextEntries = await listEditableJournalEntries()
    setEntries(nextEntries)
    setResolvedModeKey(modeKey)
  }

  const exitAuthorMode = () => {
    setEditingEntryId(null)
    setActiveDraft(createEmptyJournalDraft())
    setStatusMessage('')
    setErrorMessage('')

    try {
      window.localStorage.removeItem(JOURNAL_ADMIN_AUTH_STORAGE_KEY)
    } catch {
      // Ignore storage failures while closing author mode.
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('edit')
    setSearchParams(nextParams, { replace: true })
  }

  const handleStartCreate = () => {
    setEditingEntryId(null)
    setActiveDraft(createEmptyJournalDraft())
    setStatusMessage('')
    setErrorMessage('')
  }

  const handleStartEdit = (entry) => {
    setEditingEntryId(entry.id)
    setActiveDraft(getEntryDraft(entry))
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
        setActiveDraft(getEntryDraft(updatedEntry))
        setStatusMessage(draft.published ? '日志与附件已更新，并保持为公开状态。' : '日志与附件已更新，当前仅在隐藏空间可见。')
      } else {
        const createdEntry = await createJournalEntry(draft)
        setStatusMessage(draft.published ? '新日志已发布。现在可以继续为它上传图片或视频。' : '新日志草稿已保存。现在可以继续上传图片或视频。')
        setEditingEntryId(createdEntry.id)
        setActiveDraft(getEntryDraft(createdEntry))
      }

      await refreshEntries()
    } catch (error) {
      if (error?.message === 'missing-supabase-config') {
        setErrorMessage('还没有配置 Supabase，暂时不能保存日志。请先补上环境变量。')
      } else if (error?.message === 'missing-author-session') {
        setErrorMessage('当前页面作者模式只负责显示编辑入口；要真正写入 Supabase，仍需要可用的后端写权限。请检查 RLS / Auth 配置。')
      } else {
        setErrorMessage('保存失败了。请检查 Supabase 表结构、存储桶和写入权限。')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEntry = async () => {
    if (!editingEntryId) {
      return
    }

    if (typeof window !== 'undefined' && !window.confirm('确定要删除这篇日志吗？此操作不可逆。')) {
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
    } catch (error) {
      if (error?.message === 'missing-author-session') {
        setErrorMessage('当前页面作者模式只负责显示编辑入口；要真正删除 Supabase 里的日志，仍需要可用的后端写权限。')
      } else {
        setErrorMessage('删除失败了。请检查 Supabase 写入权限是否正常。')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEntryById = async (entryId) => {
    if (!entryId) {
      return
    }

    if (typeof window !== 'undefined' && !window.confirm('确定要删除这篇日志吗？此操作不可逆。')) {
      return
    }

    setIsSaving(true)
    setStatusMessage('')
    setErrorMessage('')

    try {
      await deleteJournalEntry(entryId)
      await refreshEntries()

      if (editingEntryId === entryId) {
        setEditingEntryId(null)
        setActiveDraft(createEmptyJournalDraft())
      }

      setStatusMessage('日志已删除。')
    } catch (error) {
      if (error?.message === 'missing-author-session') {
        setErrorMessage('当前页面作者模式只负责显示编辑入口；要真正删除 Supabase 里的日志，仍需要可用的后端写权限。')
      } else {
        setErrorMessage('删除失败了。请检查 Supabase 写入权限是否正常。')
      }
    } finally {
      setIsSaving(false)
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

      {isAuthor ? (
        <div className="afterlight-author-banner">
          <button type="button" className="afterlight-author-banner-button" onClick={exitAuthorMode}>
            作者模式中（点击退出）
          </button>
        </div>
      ) : null}

      <div className="category-page-actions afterlight-top-actions">
        <Link to=".." relative="path" className="btn secondary">
          返回隐藏空间首页
        </Link>
        {isAuthor ? (
          <button type="button" className="btn secondary" onClick={handleStartCreate}>
            发布新日志
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
            同时需要在 Supabase 里创建 <code>afterlight_entries</code> 表，并设置访客读取与作者写入所需的权限策略。
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
              onDelete={isAuthor ? () => handleDeleteEntryById(entry.id) : null}
              isDeleting={isSaving}
            />
          ))
        ) : (
          <article className="hidden-space-game-card afterlight-entry-card">
            <p>{isAuthor ? '还没有日志。可以先写第一条。' : '这里暂时还没有公开日志。'}</p>
          </article>
        )}
      </section>

      {isSupabaseConfigured && isAuthor ? (
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
                <span className="afterlight-author-email">当前已进入作者模式</span>
                <button type="button" className="btn secondary" onClick={exitAuthorMode}>
                  退出作者模式
                </button>
              </div>
            </div>
            <p className="afterlight-entry-hint">
              当前作者模式由本地口令解锁；如果要真正写入 Supabase，仍需确保后端写权限已正确配置。
            </p>
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
      ) : null}
    </section>
  )
}

export default HiddenSpaceJournalPage
