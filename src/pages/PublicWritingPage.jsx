import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import WritingContainer from '../components/WritingContainer'
import { publicWritingData } from '../data/publicWritingData'
import {
  loadWritingTree,
  normalizeWritingTree,
  requestWritingAuthorOtp,
  normalizeWritingNode,
  saveWritingTree,
  signOutWritingAuthor,
  verifyWritingAuthorOtp,
} from '../services/writingService'

const EDIT_TOKEN = 'K'
const EDIT_PARAM = 'edit'
const ADMIN_AUTH_STORAGE_KEY = 'writing_admin_auth'
const AUTHOR_ACCESS_KEY = 'writing_author_access'
const AUTHOR_EMAIL = '2597631359@qq.com'

function readStoredFlag(key) {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

function writeStoredFlag(key, value) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (value) {
      window.localStorage.setItem(key, 'true')
    } else {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Ignore storage failures.
  }
}

function PublicWritingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [writingTree, setWritingTree] = useState(null)
  const [isLoadingTree, setIsLoadingTree] = useState(true)
  const [editorEnabled, setEditorEnabled] = useState(() => readStoredFlag(ADMIN_AUTH_STORAGE_KEY))
  const [authorOtp, setAuthorOtp] = useState('')
  const [authorDrawerOpen, setAuthorDrawerOpen] = useState(false)
  const [authorNotice, setAuthorNotice] = useState('')
  const [editorError, setEditorError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const isAuthorMode = useMemo(() => searchParams.get(EDIT_PARAM) === EDIT_TOKEN, [searchParams])
  const hasAuthorAccess = readStoredFlag(AUTHOR_ACCESS_KEY)
  const canEdit = isAuthorMode && editorEnabled && hasAuthorAccess

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const loadedTree = await loadWritingTree(null)
        if (!cancelled) {
          setWritingTree(loadedTree ? normalizeWritingTree(loadedTree) : normalizeWritingTree(publicWritingData))
        }
      } catch {
        if (!cancelled) {
          setWritingTree(normalizeWritingTree(publicWritingData))
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTree(false)
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isAuthorMode) {
      writeStoredFlag(ADMIN_AUTH_STORAGE_KEY, true)
      setEditorEnabled(true)
      setAuthorDrawerOpen(true)
      setAuthorNotice('已进入作者模式，请先完成邮箱验证码验证。')
      return
    }

    setEditorEnabled(false)
    setAuthorDrawerOpen(false)
    setAuthorNotice('')
    setEditorError('')
    writeStoredFlag(ADMIN_AUTH_STORAGE_KEY, false)
    writeStoredFlag(AUTHOR_ACCESS_KEY, false)
  }, [isAuthorMode])

  const persistTree = async (nextTree) => {
    const normalizedTree = normalizeWritingTree(nextTree)

    try {
      setIsSaving(true)
      const didSave = await saveWritingTree(normalizedTree)
      if (!didSave) {
        setEditorError('无法写入本地存储，请检查浏览器存储权限。')
        return false
      }

      setWritingTree(normalizedTree)
      setEditorError('')
      return true
    } catch (error) {
      const message = error instanceof Error && error.message === 'missing-author-session'
        ? '当前未连接 Supabase 作者会话：本地改动已保留，但还未同步到远端。'
        : '保存失败，请稍后重试。'
      setWritingTree(normalizedTree)
      setEditorError(message)
      return true
    } finally {
      setIsSaving(false)
    }
  }

  const exitEditorMode = async () => {
    setEditorEnabled(false)
    setAuthorDrawerOpen(false)
    setAuthorNotice('')
    setEditorError('')
    setAuthorOtp('')
    writeStoredFlag(ADMIN_AUTH_STORAGE_KEY, false)
    writeStoredFlag(AUTHOR_ACCESS_KEY, false)

    try {
      await signOutWritingAuthor()
    } catch {
      // Keep local exit even if remote sign-out is unavailable.
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete(EDIT_PARAM)
    setSearchParams(nextParams, { replace: true })
  }

  const saveNode = async (nextNode, options = {}) => {
    if (!writingTree || !nextNode) {
      return
    }

    if (options.mode === 'root') {
      if (writingTree.type !== 'folder') {
        return
      }

      const rootNode = normalizeWritingNode({
        ...nextNode,
        parentId: undefined,
      })

      await persistTree({
        ...writingTree,
        children: [...(writingTree.children ?? []), rootNode],
      })
      return
    }

    if (options.mode === 'child') {
      const parentId = options.parentId
      if (!parentId) {
        return
      }

      const childNode = normalizeWritingNode({
        ...nextNode,
        parentId: undefined,
      })

      const appendToParent = (node) => {
        if (node.id === parentId && node.type === 'folder') {
          return {
            ...node,
            children: [...(node.children ?? []), childNode],
          }
        }

        if (node.type !== 'folder' || !Array.isArray(node.children)) {
          return node
        }

        return {
          ...node,
          children: node.children.map(appendToParent),
        }
      }

      await persistTree(appendToParent(writingTree))
      return
    }

    const replaceNode = (node) => {
      if (node.id === nextNode.id) {
        return nextNode
      }

      if (node.type !== 'folder' || !Array.isArray(node.children)) {
        return node
      }

      return {
        ...node,
        children: node.children.map(replaceNode),
      }
    }

    await persistTree(replaceNode(writingTree))
  }

  const deleteNode = async (node) => {
    if (!node || !writingTree || node.id === writingTree.id) {
      return
    }

    if (typeof window !== 'undefined' && !window.confirm('确定要删除该栏位吗？此操作不可逆。')) {
      return
    }

    const removeNode = (folder) => ({
      ...folder,
      children: (folder.children ?? [])
        .filter((child) => child.id !== node.id)
        .map((child) => child.type === 'folder' ? removeNode(child) : child),
    })

    await persistTree(removeNode(writingTree))
  }

  const requestAuthorAccess = async () => {
    try {
      setAuthorNotice('正在发送 6 位验证码，请稍候…')
      await requestWritingAuthorOtp(AUTHOR_EMAIL)
      setAuthorNotice('验证码已发送，请输入收到的 6 位验证码。')
      setEditorEnabled(true)
      setEditorError('')
    } catch (error) {
      setAuthorNotice(error instanceof Error ? error.message : '验证码发送失败，请稍后重试。')
    }
  }

  const verifyOtp = async () => {
    try {
      await verifyWritingAuthorOtp({ email: AUTHOR_EMAIL, token: authorOtp })
      writeStoredFlag(AUTHOR_ACCESS_KEY, true)
      setEditorEnabled(true)
      setAuthorNotice('邮箱验证码验证通过，可以编辑。')
      setEditorError('')
      setAuthorDrawerOpen(false)
    } catch (error) {
      writeStoredFlag(AUTHOR_ACCESS_KEY, false)
      setAuthorNotice(error instanceof Error ? error.message : '验证码无效。')
    }
  }

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
