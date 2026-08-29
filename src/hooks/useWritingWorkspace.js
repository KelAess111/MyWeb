import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getWritingWorkspaceStorageKeys,
  loadWritingTree,
  normalizeWritingNode,
  normalizeWritingTree,
  requestWritingAuthorOtp,
  saveWritingTree,
  signOutWritingAuthor,
  verifyWritingAuthorOtp,
} from '../services/writingService'

const EDIT_TOKEN = 'K'
const EDIT_PARAM = 'edit'
const AUTHOR_EMAIL = '2597631359@qq.com'

// 检查是否为本地编辑模式
function isLocalEditMode() {
  if (typeof window === 'undefined') {
    return false
  }

  console.log('[isLocalEditMode] Function called')

  const urlParams = new URLSearchParams(window.location.search)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  console.log('[isLocalEditMode] URL:', window.location.href)
  console.log('[isLocalEditMode] search:', window.location.search)

  // 检查是否是预览模式 - 最高优先级
  // 1. 先检查 URL 参数
  const hasPreviewParam = urlParams.get('preview') === 'true'

  // 2. 如果 URL 有 preview=true，保存到 sessionStorage
  if (hasPreviewParam) {
    try {
      window.sessionStorage.setItem('previewMode', 'true')
      window.localStorage.removeItem('localEditMode')
      console.log('[Preview Mode] Activated - editing disabled for this session')
    } catch (e) {
      console.error('[Preview Mode] Failed to set sessionStorage:', e)
    }
    return false
  }

  // 3. 检查 sessionStorage 中的预览模式标记
  try {
    const isPreviewSession = window.sessionStorage.getItem('previewMode') === 'true'
    console.log('[isLocalEditMode] sessionStorage.previewMode:', window.sessionStorage.getItem('previewMode'))
    if (isPreviewSession) {
      console.log('[Preview Mode] Active from sessionStorage - editing disabled')
      return false
    }
  } catch (e) {
    // ignore
  }

  const hasLocalParam = urlParams.get('editMode') === 'local'
  const hasEditMode = import.meta.env.VITE_EDIT_MODE === 'true'

  console.log('[isLocalEditMode] Debug:')
  console.log('  hasLocalParam:', hasLocalParam)
  console.log('  isLocalhost:', isLocalhost)
  console.log('  hasEditMode:', hasEditMode)
  console.log('  VITE_EDIT_MODE:', import.meta.env.VITE_EDIT_MODE)

  // 如果URL有editMode=local参数，保存到localStorage，并清除预览模式
  if (hasLocalParam && isLocalhost && hasEditMode) {
    try {
      window.localStorage.setItem('localEditMode', 'true')
      window.sessionStorage.removeItem('previewMode')
      console.log('[Local Edit Mode] Activated and saved to localStorage')
    } catch (e) {
      console.error('[Local Edit Mode] Failed to save to localStorage:', e)
    }
    return true
  }

  // 检查localStorage中是否有本地编辑模式标记
  if (isLocalhost && hasEditMode) {
    try {
      const stored = window.localStorage.getItem('localEditMode') === 'true'
      if (stored) {
        console.log('[Local Edit Mode] Active from localStorage')
      } else {
        console.log('[Local Edit Mode] Not active - localStorage is', window.localStorage.getItem('localEditMode'))
      }
      return stored
    } catch {
      return false
    }
  }

  return false
}

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

export function useWritingWorkspace({ workspace, fallbackTree }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const storageKeys = useMemo(() => getWritingWorkspaceStorageKeys(workspace), [workspace])
  const [writingTree, setWritingTree] = useState(null)
  const [isLoadingTree, setIsLoadingTree] = useState(true)
  const [editorEnabled, setEditorEnabled] = useState(() => readStoredFlag(storageKeys.editorMode))
  const [authorOtp, setAuthorOtp] = useState('')
  const [authorDrawerOpen, setAuthorDrawerOpen] = useState(false)
  const [authorNotice, setAuthorNotice] = useState('')
  const [editorError, setEditorError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const isAuthorMode = useMemo(() => searchParams.get(EDIT_PARAM) === EDIT_TOKEN, [searchParams])

  // 检查本地编辑模式 - 使用 useState 让它能够响应变化
  const [isLocalEdit, setIsLocalEdit] = useState(() => isLocalEditMode())

  // 监听 URL 参数变化，重新检查编辑模式
  useEffect(() => {
    const newLocalEditState = isLocalEditMode()
    setIsLocalEdit(newLocalEditState)
  }, [searchParams])

  const hasAuthorAccess = readStoredFlag(storageKeys.authorAccess)
  const canEdit = (isAuthorMode && editorEnabled && hasAuthorAccess) || isLocalEdit

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const loadedTree = await loadWritingTree(null, workspace)
        if (!cancelled) {
          setWritingTree(loadedTree ? normalizeWritingTree(loadedTree) : normalizeWritingTree(fallbackTree))
        }
      } catch {
        if (!cancelled) {
          setWritingTree(normalizeWritingTree(fallbackTree))
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
  }, [fallbackTree, workspace])

  useEffect(() => {
    // 如果是本地编辑模式，自动启用编辑器并授予权限
    if (isLocalEdit) {
      writeStoredFlag(storageKeys.editorMode, true)
      writeStoredFlag(storageKeys.authorAccess, true)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditorEnabled(true)
      setAuthorDrawerOpen(false)
      setAuthorNotice('')
      return
    }

    if (isAuthorMode) {
      writeStoredFlag(storageKeys.editorMode, true)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditorEnabled(true)
      setAuthorDrawerOpen(true)
      setAuthorNotice('已进入作者模式，请先完成邮箱验证码验证。')
      return
    }

    setEditorEnabled(false)
    setAuthorDrawerOpen(false)
    setAuthorNotice('')
    setEditorError('')
    writeStoredFlag(storageKeys.editorMode, false)
    writeStoredFlag(storageKeys.authorAccess, false)
  }, [isAuthorMode, isLocalEdit, storageKeys])

  const refreshWritingTree = async () => {
    const loadedTree = await loadWritingTree(null, workspace)
    setWritingTree(loadedTree ? normalizeWritingTree(loadedTree) : normalizeWritingTree(fallbackTree))
  }

  const persistTree = async (nextTree) => {
    const normalizedTree = normalizeWritingTree(nextTree)

    try {
      setIsSaving(true)
      const didSave = await saveWritingTree(normalizedTree, workspace)
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
    writeStoredFlag(storageKeys.editorMode, false)
    writeStoredFlag(storageKeys.authorAccess, false)

    try {
      await signOutWritingAuthor(workspace)
    } catch {
      // Keep local exit even if remote sign-out is unavailable.
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete(EDIT_PARAM)
    setSearchParams(nextParams, { replace: true })
  }

  const saveNode = async (nextNode, options = {}) => {
    if (!writingTree || !nextNode) {
      return false
    }

    if (options.mode === 'root') {
      if (writingTree.type !== 'folder') {
        return false
      }

      const rootNode = normalizeWritingNode({
        ...nextNode,
        parentId: undefined,
      })

      return await persistTree({
        ...writingTree,
        children: [...(writingTree.children ?? []), rootNode],
      })
    }

    if (options.mode === 'child') {
      const parentId = options.parentId
      if (!parentId) {
        return false
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

      return await persistTree(appendToParent(writingTree))
    }

    const normalizedNode = normalizeWritingNode(nextNode)

    const replaceNode = (node) => {
      if (node.id === normalizedNode.id) {
        return normalizedNode
      }

      if (node.type !== 'folder' || !Array.isArray(node.children)) {
        return node
      }

      return {
        ...node,
        children: node.children.map(replaceNode),
      }
    }

    return await persistTree(replaceNode(writingTree))
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
      await requestWritingAuthorOtp(AUTHOR_EMAIL, workspace)
      setAuthorNotice('验证码已发送，请输入收到的 6 位验证码。')
      setEditorEnabled(true)
      setEditorError('')
    } catch (error) {
      setAuthorNotice(error instanceof Error ? error.message : '验证码发送失败，请稍后重试。')
    }
  }

  const verifyOtp = async () => {
    try {
      await verifyWritingAuthorOtp({ email: AUTHOR_EMAIL, token: authorOtp }, workspace)
      writeStoredFlag(storageKeys.authorAccess, true)
      await refreshWritingTree()
      setEditorEnabled(true)
      setAuthorNotice('邮箱验证码验证通过，可以编辑。')
      setEditorError('')
      setAuthorDrawerOpen(false)
    } catch (error) {
      writeStoredFlag(storageKeys.authorAccess, false)
      setAuthorNotice(error instanceof Error ? error.message : '验证码无效。')
    }
  }

  return {
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
  }
}
