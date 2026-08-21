import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ReadingPane from './ReadingPane'
import WritingEditorModal from './WritingEditorModal'
import {
  createWritingIndex,
  getNodeBreadcrumbs,
  getNodePreview,
  resolveFolderNode,
  resolveNode,
  resolveSelectedNode,
} from '../utils/writingNavigation'
import { createOCSceneFromNode } from '../utils/writingOCScenes'

function getTreeRoot(data) {
  if (!data) {
    return null
  }

  if (data.type === 'folder' || data.type === 'entry') {
    return data
  }

  return data.root ?? null
}

function isFolder(node) {
  return node?.type === 'folder'
}

function isEntry(node) {
  return node?.type === 'entry'
}

function getVisibleChildren(node) {
  if (!node || !Array.isArray(node.children)) {
    return []
  }

  return node.children
}

function getSelectableNodeId(node) {
  return node?.id ?? null
}

function createRootNodeDraft() {
  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `writing-root-node-${crypto.randomUUID()}`
    : `writing-root-node-${Date.now()}`

  return {
    id,
    type: 'folder',
    title: '未命名根栏位',
    intro: '',
    detail: '',
    excerptLabel: '目录',
    children: [],
  }
}

function WritingCard({ node, selected, onSelect, onOpen, editorMode }) {
  const preview = getNodePreview(node)
  return (
    <button
      type="button"
      className={`hidden-space-writing-card ${selected ? 'is-active' : ''}`}
      onClick={onSelect}
      onDoubleClick={onOpen}
    >
      <div className="hidden-space-writing-card-head">
        <strong>{node.title}</strong>
      </div>
      <p className="hidden-space-writing-card-intro">{node.intro || '暂无简介'}</p>
      <div className="hidden-space-writing-card-meta">
        <span>{node.type === 'folder' ? `${getVisibleChildren(node).length} 项` : `${Array.isArray(node.blocks) ? node.blocks.length : 0} 段`}</span>
        {node.date ? <span>{node.date}</span> : null}
        {node.type === 'entry' ? <span>{node.status === 'completed' ? '已完成' : '未完成'}</span> : null}
        {editorMode ? <span>可编辑</span> : <span>只读</span>}
      </div>
    </button>
  )
}

function WritingContainer({
  data,
  titlePrefix,
  routeLabel,
  backTo,
  rootLabel,
  onSceneChange,
  defaultScene,
  editorMode = false,
  onEditNode,
  onDeleteNode,
  onToggleEditorMode,
  onRequestEditorAccess,
  isSaving = false,
  layoutVariant = 'default',
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [editingNode, setEditingNode] = useState(null)
  const [editingMode, setEditingMode] = useState('node')

  const index = useMemo(() => createWritingIndex(data), [data])
  const root = getTreeRoot(index.root)
  const queryState = useMemo(() => ({
    folder: searchParams.get('folder'),
    selected: searchParams.get('selected'),
    entry: searchParams.get('entry'),
  }), [searchParams])

  const activeFolder = useMemo(() => {
    const explicitFolder = resolveFolderNode(index, queryState.folder)
    if (explicitFolder) {
      return explicitFolder
    }

    return root
  }, [index, queryState.folder, root])

  const selectedNode = useMemo(() => {
    if (queryState.selected) {
      return resolveNode(index, queryState.selected)
    }

    return activeFolder
  }, [activeFolder, index, queryState.selected])

  const selectedFolder = useMemo(() => {
    if (isFolder(selectedNode)) {
      return selectedNode
    }

    return resolveFolderNode(index, selectedNode?.parentId) ?? activeFolder
  }, [activeFolder, index, selectedNode])

  const openEntry = useMemo(() => {
    if (!queryState.entry) {
      return null
    }

    const resolved = resolveSelectedNode(index, { entry: queryState.entry })
    return isEntry(resolved) ? resolved : null
  }, [index, queryState.entry])

  const activePanelNode = openEntry ?? selectedNode ?? activeFolder
  const detailNode = activePanelNode
  const visibleChildren = useMemo(() => {
    if (openEntry) {
      return []
    }

    return getVisibleChildren(activeFolder)
  }, [activeFolder, openEntry])
  const breadcrumbs = useMemo(() => getNodeBreadcrumbs(index, detailNode ?? activeFolder), [activeFolder, detailNode, index])
  const siblingEntries = useMemo(() => {
    if (!openEntry) {
      return []
    }

    const parent = resolveFolderNode(index, openEntry.parentId)
    return (parent?.children ?? []).filter((child) => child.type === 'entry')
  }, [index, openEntry])
  const canCreateAtCurrentLevel = activeFolder?.id === root?.id
  const selectedIsEntry = isEntry(selectedNode)
  const isReading = Boolean(openEntry)

  useEffect(() => {
    if (typeof onSceneChange === 'function') {
      onSceneChange(defaultScene)
    }
  }, [defaultScene, onSceneChange])

  useEffect(() => {
    if (typeof onSceneChange === 'function' && selectedNode) {
      const ocScene = createOCSceneFromNode(selectedNode)
      if (ocScene) {
        onSceneChange(ocScene)
      }
    }
  }, [selectedNode, onSceneChange])

  const writeSearch = (patch) => {
    const nextParams = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    })
    setSearchParams(nextParams, { replace: true })
  }

  const selectNode = (node) => {
    if (!node) {
      return
    }

    writeSearch({
      folder: activeFolder?.id ?? root?.id,
      selected: getSelectableNodeId(node),
      entry: null,
    })
  }

  const openNode = (node) => {
    if (!node) {
      return
    }

    if (isFolder(node)) {
      writeSearch({
        folder: node.id,
        selected: node.id,
        entry: null,
      })
      return
    }

    writeSearch({
      folder: node.parentId ?? activeFolder?.id ?? root?.id,
      selected: node.id,
      entry: node.id,
    })
  }

  const navigateToFolder = (folder) => {
    if (!folder) {
      return
    }

    writeSearch({
      folder: folder.id,
      selected: folder.id,
      entry: null,
    })
  }

  const handleCreateRootNode = () => {
    setEditingMode('root')
    setEditingNode(createRootNodeDraft())
  }

  const handleEditSelected = () => {
    if (!selectedNode || typeof onEditNode !== 'function') {
      return
    }

    setEditingMode('node')
    setEditingNode(selectedNode)
  }

  const handleDeleteSelected = () => {
    if (!selectedNode || typeof onDeleteNode !== 'function') {
      return
    }

    onDeleteNode(selectedNode)
  }

  if (!root) {
    return null
  }

  const showCreateButtons = editorMode && canCreateAtCurrentLevel && !isReading
  const showEditButton = editorMode && Boolean(selectedNode) && !isReading
  const showDeleteButton = editorMode && Boolean(selectedNode) && !isReading && typeof onDeleteNode === 'function'
  const parentOfActiveFolder = activeFolder?.parentId ? resolveFolderNode(index, activeFolder.parentId) : null
  const parentTitle = parentOfActiveFolder?.title || rootLabel

  return (
    <section className={`hidden-space-writing-page ${layoutVariant === 'compact' ? 'hidden-space-writing-page--compact' : ''}`}>
      <header className="hidden-space-writing-page-header">
        <div>
          <p className="hidden-space-writing-count">{titlePrefix}</p>
          <h1>{routeLabel}</h1>
        </div>
        <div className="hidden-space-writing-page-header-actions">
          <Link to={backTo} relative={backTo === '..' ? 'path' : undefined} className="btn secondary">
            返回首页
          </Link>
          {editorMode && typeof onToggleEditorMode === 'function' ? (
            <button type="button" className="btn secondary" onClick={onToggleEditorMode}>
              退出作者模式
            </button>
          ) : null}
          {!editorMode && typeof onRequestEditorAccess === 'function' ? (
            <button type="button" className="btn secondary" onClick={onRequestEditorAccess}>
              打开作者验证
            </button>
          ) : null}
        </div>
      </header>

      <div className="hidden-space-writing-toolbar">
        <div className="hidden-space-writing-toolbar-breadcrumbs">
          {breadcrumbs.map((crumb, crumbIndex) => (
            <button key={crumb.id} type="button" className="hidden-space-writing-breadcrumb" onClick={() => navigateToFolder(isFolder(crumb) ? crumb : resolveFolderNode(index, crumb.parentId) ?? root)}>
              {crumb.title}
              {crumbIndex < breadcrumbs.length - 1 ? <span> / </span> : null}
            </button>
          ))}
        </div>
        <div className="hidden-space-writing-toolbar-actions">
          {showCreateButtons ? (
            <button type="button" className="btn secondary" onClick={handleCreateRootNode}>
              新增根栏位
            </button>
          ) : null}
          {showEditButton ? (
            <button type="button" className="btn secondary" onClick={handleEditSelected}>
              编辑当前项
            </button>
          ) : null}
          {showDeleteButton ? (
            <button type="button" className="btn secondary danger" onClick={handleDeleteSelected}>
              删除当前项
            </button>
          ) : null}
        </div>
      </div>

      <div className={`hidden-space-writing-layout ${isReading ? 'is-reading' : ''}`}>
        {!isReading ? (
          <aside className="hidden-space-writing-explorer">
            <div className="hidden-space-writing-explorer-head">
              <div>
                <p className="hidden-space-writing-count">{parentTitle}</p>
                <h2>{activeFolder?.title || root.title}</h2>
              </div>
              {activeFolder?.id !== root.id ? (
                <button type="button" className="btn secondary" onClick={() => navigateToFolder(resolveFolderNode(index, activeFolder.parentId) ?? root)}>
                  返回上级目录
                </button>
              ) : null}
            </div>

            <div className="hidden-space-writing-card-list">
              {visibleChildren.length ? visibleChildren.map((node) => (
                <WritingCard
                  key={node.id}
                  node={node}
                  selected={selectedNode?.id === node.id}
                  onSelect={() => selectNode(node)}
                  onOpen={() => openNode(node)}
                  editorMode={editorMode}
                />
              )) : (
                <div className="hidden-space-writing-empty">这个目录里还没有条目。</div>
              )}
            </div>
          </aside>
        ) : null}

        <main className={`hidden-space-writing-detail ${isReading ? 'is-reading' : ''}`}>
          {isReading && openEntry ? (
            <ReadingPane
              entry={openEntry}
              siblingEntries={siblingEntries}
              activeEntryId={openEntry.id}
              onJumpToEntry={openNode}
              onBackToDirectory={() => writeSearch({ entry: null, selected: activeFolder?.id ?? root.id })}
              editorMode={editorMode}
              onEditNode={(node) => {
                setEditingMode('content')
                setEditingNode(node)
              }}
              currentFolder={activeFolder}
            />
          ) : (
            <section className="hidden-space-writing-detail-panel">
              <p className="hidden-space-writing-count">详情栏</p>
              <h2>{detailNode?.title || root.title}</h2>
              <p className="hidden-space-writing-detail-intro">{detailNode?.detail || detailNode?.intro || '请选择一个栏位来查看详情。'}</p>
              {detailNode?.date ? <p className="hidden-space-writing-count">日期：{detailNode.date}</p> : null}
              {detailNode?.type === 'entry' ? (
                <p className="hidden-space-writing-count">
                  状态：{detailNode.status === 'completed' ? '已完成' : '未完成'}
                </p>
              ) : null}
            </section>
          )}
        </main>
      </div>

      {editorMode && editingNode ? (
        <WritingEditorModal
          entry={editingNode}
          isOpen={Boolean(editingNode)}
          onSave={(nextNode, options) => {
            setEditingNode(null)
            setEditingMode('node')
            if (typeof onEditNode === 'function') {
              onEditNode(nextNode, options)
            }
          }}
          onDelete={onDeleteNode}
          onClose={() => setEditingNode(null)}
          isSaving={isSaving}
          error=""
          initialMode={editingMode}
          saveLabel="保存更改"
        />
      ) : null}
    </section>
  )
}

export default WritingContainer
