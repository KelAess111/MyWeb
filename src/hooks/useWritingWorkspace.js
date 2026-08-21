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
  const hasAuthorAccess = readStoredFlag(storageKeys.authorAccess)
  const canEdit = isAuthorMode && editorEnabled && hasAuthorAccess

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
  }, [isAuthorMode, storageKeys])

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
