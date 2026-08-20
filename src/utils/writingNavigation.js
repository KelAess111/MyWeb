import { normalizeWritingTree } from '../services/writingService'

function walkTree(node, parent = null, map = new Map(), order = []) {
  if (!node || typeof node !== 'object') {
    return { map, order }
  }

  map.set(node.id, { node, parent })
  order.push(node)

  if (Array.isArray(node.children)) {
    node.children.forEach((child) => walkTree(child, node, map, order))
  }

  return { map, order }
}

export function createWritingIndex(tree) {
  const root = normalizeWritingTree(tree)
  const { map, order } = walkTree(root)

  return {
    root,
    map,
    order,
  }
}

export function resolveNode(index, nodeOrId) {
  if (!index) {
    return null
  }

  if (!nodeOrId) {
    return null
  }

  if (typeof nodeOrId === 'object') {
    return index.map.get(nodeOrId.id)?.node ?? nodeOrId
  }

  return index.map.get(nodeOrId)?.node ?? null
}

export function resolveParent(index, nodeOrId) {
  const node = resolveNode(index, nodeOrId)
  if (!node) {
    return null
  }

  return index.map.get(node.id)?.parent ?? null
}

export function getFolderChildren(index, folderOrId) {
  const folder = resolveNode(index, folderOrId)
  if (!folder || folder.type !== 'folder') {
    return []
  }

  return Array.isArray(folder.children) ? folder.children : []
}

export function getNodeBreadcrumbs(index, nodeOrId) {
  const node = resolveNode(index, nodeOrId)
  if (!node) {
    return []
  }

  const crumbs = []
  let current = node

  while (current) {
    crumbs.unshift(current)
    current = index.map.get(current.id)?.parent ?? null
  }

  return crumbs
}

export function getNodeCountLabel(node) {
  if (!node) {
    return '0'
  }

  if (node.type === 'folder') {
    return `${Array.isArray(node.children) ? node.children.length : 0} 项`
  }

  return `${Array.isArray(node.blocks) ? node.blocks.length : 0} 段`
}

export function getNodePreview(node) {
  if (!node) {
    return ''
  }

  return node.detail || node.intro || ''
}

export function getDefaultSelectedChildId(index, folderOrId) {
  const folder = resolveNode(index, folderOrId)
  if (!folder || folder.type !== 'folder') {
    return null
  }

  const firstChild = Array.isArray(folder.children) ? folder.children[0] : null
  return firstChild?.id ?? null
}

export function getEntrySiblingEntries(index, entryOrId) {
  const entry = resolveNode(index, entryOrId)
  if (!entry) {
    return []
  }

  const parent = resolveParent(index, entry)
  if (!parent || parent.type !== 'folder') {
    return []
  }

  return (parent.children ?? []).filter((child) => child.type === 'entry')
}

export function resolveSelectedNode(index, state = {}) {
  if (!index) {
    return null
  }

  const explicitEntry = state.entry ? resolveNode(index, state.entry) : null
  if (explicitEntry) {
    return explicitEntry
  }

  const explicitSelected = state.selected ? resolveNode(index, state.selected) : null
  if (explicitSelected) {
    return explicitSelected
  }

  const explicitFolder = state.folder ? resolveNode(index, state.folder) : null
  if (explicitFolder) {
    return explicitFolder
  }

  return index.root ?? null
}

export function resolveFolderNode(index, folderOrId) {
  const node = resolveNode(index, folderOrId)
  return node?.type === 'folder' ? node : null
}

export function resolveEntryNode(index, entryOrId) {
  const node = resolveNode(index, entryOrId)
  return node?.type === 'entry' ? node : null
}

export function getNodeDepth(node) {
  return Number(node?.depth ?? 0)
}
