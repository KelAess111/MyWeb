import { isSupabaseConfigured, supabase } from '../lib/supabase'

const TABLE_NAME = 'public_writing_tree'

const workspaceDefinitions = {
  public: {
    id: 'public',
    treeKey: 'public-writing-root',
    storageKeys: {
      tree: 'writing-service:tree',
      drafts: 'writing-service:drafts',
      authorEmail: 'writing-service:author-email',
      editorMode: 'writing_admin_auth',
      authorAccess: 'writing_author_access',
    },
  },
  hidden: {
    id: 'hidden',
    treeKey: 'hidden-writing-root',
    storageKeys: {
      tree: 'hidden-writing-service:tree',
      drafts: 'hidden-writing-service:drafts',
      authorEmail: 'hidden-writing-service:author-email',
      editorMode: 'hidden_writing_admin_auth',
      authorAccess: 'hidden_writing_author_access',
    },
  },
}

export const PUBLIC_WRITING_WORKSPACE = Object.freeze(workspaceDefinitions.public)
export const HIDDEN_WRITING_WORKSPACE = Object.freeze(workspaceDefinitions.hidden)

function resolveWritingWorkspace(workspace = PUBLIC_WRITING_WORKSPACE) {
  const workspaceId = typeof workspace === 'string' ? workspace : workspace?.id
  const resolved = workspaceDefinitions[workspaceId]

  if (!resolved) {
    throw new Error('invalid-writing-workspace')
  }

  return resolved
}

export function getWritingWorkspaceStorageKeys(workspace = PUBLIC_WRITING_WORKSPACE) {
  return { ...resolveWritingWorkspace(workspace).storageKeys }
}

function canUseStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

function readStorage(key) {
  if (!canUseStorage()) {
    return null
  }

  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  if (!canUseStorage()) {
    return false
  }

  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function removeStorage(key) {
  if (!canUseStorage()) {
    return false
  }

  try {
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

function parseJson(raw, fallback) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return fallback
  }

  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function slugifySegment(value, fallback = 'item') {
  const base = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base || fallback
}

function normalizeText(value, fallback = '') {
  return String(value ?? fallback)
}

function normalizeAnnotation(annotation, index = 0) {
  if (!annotation || typeof annotation !== 'object') {
    return {
      id: `annotation-${index}`,
      term: '',
      occurrence: 1,
      content: '',
      title: '',
      category: 'meta',
    }
  }

  return {
    id: annotation.id ?? `annotation-${index}`,
    term: normalizeText(annotation.term),
    occurrence: Number(annotation.occurrence) > 0 ? Number(annotation.occurrence) : 1,
    content: normalizeText(annotation.content),
    title: normalizeText(annotation.title),
    category: normalizeText(annotation.category, 'meta') || 'meta',
  }
}

function normalizeHoverLine(hoverLine, fallbackId) {
  if (!hoverLine || typeof hoverLine !== 'object') {
    return null
  }

  return {
    id: hoverLine.id ?? `${fallbackId}-hover`,
    text: normalizeText(hoverLine.text),
    expression: normalizeText(hoverLine.expression, 'calm'),
    caption: normalizeText(hoverLine.caption),
  }
}

export function normalizeWritingBlock(block, index = 0, entryId = 'writing-entry') {
  if (!block || typeof block !== 'object') {
    return {
      id: `${entryId}-block-${index}`,
      type: 'paragraph',
      text: '',
    }
  }

  const baseId = block.id ?? `${entryId}-block-${index}`

  switch (block.type) {
    case 'subheading':
    case 'quote':
    case 'aside':
      return {
        id: baseId,
        type: block.type,
        text: normalizeText(block.text),
      }
    case 'list':
      return {
        id: baseId,
        type: 'list',
        items: Array.isArray(block.items) ? block.items.map((item) => normalizeText(item)) : [],
      }
    case 'dialogue':
      return {
        id: baseId,
        type: 'dialogue',
        lines: Array.isArray(block.lines)
          ? block.lines.map((line, lineIndex) => ({
              id: line?.id ?? `${baseId}-line-${lineIndex}`,
              speaker: normalizeText(line?.speaker),
              text: normalizeText(line?.text),
            }))
          : [],
      }
    case 'paragraph':
    default:
      return {
        id: baseId,
        type: 'paragraph',
        text: normalizeText(block.text),
      }
  }
}

function normalizeEntryBlockList(blocks, entryId) {
  return Array.isArray(blocks) ? blocks.map((block, index) => normalizeWritingBlock(block, index, entryId)) : []
}

function normalizeEntryAnnotations(annotations) {
  return Array.isArray(annotations) ? annotations.map((annotation, index) => normalizeAnnotation(annotation, index)) : []
}

export function normalizeWritingEntry(entry, index = 0) {
  const slug = slugifySegment(entry?.slug ?? entry?.title, `entry-${index}`)
  const id = entry?.id ?? `writing-entry-${slug}`

  return {
    id,
    slug,
    type: 'entry',
    title: normalizeText(entry?.title, '未命名条目'),
    intro: normalizeText(entry?.intro),
    detail: normalizeText(entry?.detail, entry?.intro ?? ''),
    date: normalizeText(entry?.date),
    template: normalizeText(entry?.template, 'fragment'),
    excerptLabel: normalizeText(entry?.excerptLabel, '条目'),
    meta: entry?.meta && typeof entry.meta === 'object' ? entry.meta : {},
    blocks: normalizeEntryBlockList(entry?.blocks, id),
    annotations: normalizeEntryAnnotations(entry?.annotations ?? entry?.meta?.annotations),
    ocHoverLine: normalizeHoverLine(entry?.ocHoverLine, id),
  }
}

function normalizeWritingFolder(folder, index = 0) {
  const slug = slugifySegment(folder?.slug ?? folder?.title, `folder-${index}`)
  const id = folder?.id ?? `writing-folder-${slug}`
  const children = Array.isArray(folder?.children) ? folder.children : []

  return {
    id,
    slug,
    type: 'folder',
    title: normalizeText(folder?.title, '未命名文件夹'),
    intro: normalizeText(folder?.intro),
    detail: normalizeText(folder?.detail, folder?.intro ?? ''),
    date: normalizeText(folder?.date),
    excerptLabel: normalizeText(folder?.excerptLabel, '目录'),
    meta: folder?.meta && typeof folder.meta === 'object' ? folder.meta : {},
    ocHoverLine: normalizeHoverLine(folder?.ocHoverLine, id),
    children: children.map((child, childIndex) => normalizeWritingNode(child, childIndex)),
  }
}

export function normalizeWritingNode(node, index = 0) {
  if (node?.type === 'folder') {
    return normalizeWritingFolder(node, index)
  }

  return normalizeWritingEntry(node, index)
}

function registerId(id, usedIds) {
  if (usedIds.has(id)) {
    throw new Error(`Duplicate writing node id: ${id}`)
  }

  usedIds.add(id)
}

function normalizeWritingTreeWithPaths(source) {
  const usedIds = new Set()

  const visit = (node, context) => {
    if (node?.type === 'folder') {
      const slug = slugifySegment(node.slug ?? node.title, `folder-${context.index}`)
      const id = node.id ?? `${context.parentId}-${slug}`
      const path = `${context.parentPath}/${slug}`
      const children = Array.isArray(node.children) ? node.children : []
      const normalizedFolder = {
        id,
        slug,
        path,
        type: 'folder',
        title: normalizeText(node.title, '未命名文件夹'),
        intro: normalizeText(node.intro),
        detail: normalizeText(node.detail, node.intro ?? ''),
        date: normalizeText(node.date),
        excerptLabel: normalizeText(node.excerptLabel, '目录'),
        meta: node.meta && typeof node.meta === 'object' ? node.meta : {},
        ocHoverLine: normalizeHoverLine(node.ocHoverLine, id),
        parentId: context.parentId,
        parentPath: context.parentPath,
        depth: context.depth,
        children: [],
      }

      registerId(normalizedFolder.id, usedIds)
      normalizedFolder.children = children.map((child, index) =>
        visit(child, {
          depth: context.depth + 1,
          index,
          parentId: normalizedFolder.id,
          parentPath: normalizedFolder.path,
        }),
      )
      return normalizedFolder
    }

    const slug = slugifySegment(node?.slug ?? node?.title, `entry-${context.index}`)
    const id = node?.id ?? `${context.parentId}-${slug}`
    const normalizedEntry = {
      id,
      slug,
      path: `${context.parentPath}/${slug}`,
      type: 'entry',
      title: normalizeText(node?.title, '未命名条目'),
      intro: normalizeText(node?.intro),
      detail: normalizeText(node?.detail, node?.intro ?? ''),
      date: normalizeText(node?.date),
      template: normalizeText(node?.template, 'fragment'),
      excerptLabel: normalizeText(node?.excerptLabel, '条目'),
      meta: node?.meta && typeof node.meta === 'object' ? node.meta : {},
      blocks: normalizeEntryBlockList(node?.blocks, id),
      annotations: normalizeEntryAnnotations(node?.annotations ?? node?.meta?.annotations),
      ocHoverLine: normalizeHoverLine(node?.ocHoverLine, id),
      parentId: context.parentId,
      parentPath: context.parentPath,
      depth: context.depth,
    }

    registerId(normalizedEntry.id, usedIds)
    return normalizedEntry
  }

  const root = visit(
    {
      type: 'folder',
      id: source?.id ?? 'writing-root',
      slug: source?.slug ?? 'writing',
      title: source?.title ?? '写作角落',
      intro: source?.intro ?? '',
      detail: source?.detail ?? source?.intro ?? '',
      excerptLabel: source?.excerptLabel ?? '根目录',
      meta: source?.meta ?? {},
      ocHoverLine: source?.ocHoverLine ?? null,
      children: Array.isArray(source?.children) ? source.children : [],
    },
    {
      depth: 0,
      index: 0,
      parentId: 'root',
      parentPath: '/root',
    },
  )

  return root
}

export function normalizeWritingTree(source) {
  return normalizeWritingTreeWithPaths(source)
}

export function serializeWritingTree(tree) {
  return JSON.stringify(normalizeWritingTree(tree))
}

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('missing-supabase-config')
  }

  return supabase
}

async function getRequiredAuthorId(client) {
  try {
    const { data, error } = await client.auth.getUser()

    if (error) {
      throw error
    }

    const authorId = data.user?.id

    if (!authorId) {
      throw new Error('missing-author-session')
    }

    return authorId
  } catch {
    throw new Error('missing-author-session')
  }
}

export async function getWritingAuthorSession() {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session ?? null
}

export async function requestWritingAuthorOtp(email, workspace = PUBLIC_WRITING_WORKSPACE) {
  const client = ensureSupabase()
  const { storageKeys } = resolveWritingWorkspace(workspace)
  const normalizedEmail = normalizeText(email).trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error('missing-author-email')
  }

  const { error } = await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    throw error
  }

  writeStorage(storageKeys.authorEmail, normalizedEmail)
  return true
}

export async function verifyWritingAuthorOtp({ email, token }, workspace = PUBLIC_WRITING_WORKSPACE) {
  const client = ensureSupabase()
  const { storageKeys } = resolveWritingWorkspace(workspace)
  const normalizedEmail = normalizeText(email).trim().toLowerCase() || readStorage(storageKeys.authorEmail) || ''
  const normalizedToken = normalizeText(token).trim()

  if (!normalizedEmail) {
    throw new Error('missing-author-email')
  }

  if (!normalizedToken) {
    throw new Error('missing-author-token')
  }

  const { data, error } = await client.auth.verifyOtp({
    email: normalizedEmail,
    token: normalizedToken,
    type: 'email',
  })

  if (error) {
    throw error
  }

  writeStorage(storageKeys.authorEmail, normalizedEmail)
  return data.session ?? null
}

export async function signOutWritingAuthor(workspace = PUBLIC_WRITING_WORKSPACE) {
  const { storageKeys } = resolveWritingWorkspace(workspace)

  if (!isSupabaseConfigured || !supabase) {
    removeStorage(storageKeys.authorEmail)
    return true
  }

  const { error } = await supabase.auth.signOut()

  removeStorage(storageKeys.authorEmail)

  if (error) {
    throw error
  }

  return true
}

export function getStoredAuthorEmail(workspace = PUBLIC_WRITING_WORKSPACE) {
  return readStorage(resolveWritingWorkspace(workspace).storageKeys.authorEmail) ?? ''
}

async function loadWritingTreeFromSupabase(workspace) {
  const client = ensureSupabase()
  const { treeKey } = resolveWritingWorkspace(workspace)
  const { data, error } = await client.from(TABLE_NAME).select('tree_data').eq('tree_key', treeKey).maybeSingle()

  if (error) {
    throw error
  }

  return data?.tree_data ?? null
}

async function saveWritingTreeToSupabase(tree, workspace) {
  const client = ensureSupabase()
  const { treeKey } = resolveWritingWorkspace(workspace)
  const authorId = await getRequiredAuthorId(client)
  const normalizedTree = normalizeWritingTree(tree)
  const { data: existingRow, error: loadError } = await client
    .from(TABLE_NAME)
    .select('tree_key')
    .eq('tree_key', treeKey)
    .maybeSingle()

  if (loadError) {
    throw loadError
  }

  if (existingRow) {
    const { error } = await client
      .from(TABLE_NAME)
      .update({
        tree_data: normalizedTree,
        updated_by: authorId,
      })
      .eq('tree_key', treeKey)

    if (error) {
      throw error
    }

    return true
  }

  const { error } = await client
    .from(TABLE_NAME)
    .insert({
      tree_key: treeKey,
      tree_data: normalizedTree,
      created_by: authorId,
      updated_by: authorId,
    })

  if (error) {
    throw error
  }

  return true
}

async function hasWritingAuthorSession() {
  if (!isSupabaseConfigured || !supabase) {
    return false
  }

  const { data, error } = await supabase.auth.getSession()
  return !error && Boolean(data.session)
}

export async function saveWritingTree(tree, workspace = PUBLIC_WRITING_WORKSPACE) {
  const resolvedWorkspace = resolveWritingWorkspace(workspace)
  const normalizedTree = normalizeWritingTree(tree)
  const didSaveLocal = writeStorage(resolvedWorkspace.storageKeys.tree, serializeWritingTree(normalizedTree))

  if (isSupabaseConfigured && supabase) {
    await saveWritingTreeToSupabase(normalizedTree, resolvedWorkspace)
  }

  return didSaveLocal || Boolean(normalizedTree)
}

export async function loadWritingTree(fallback = null, workspace = PUBLIC_WRITING_WORKSPACE) {
  const resolvedWorkspace = resolveWritingWorkspace(workspace)
  const isHiddenWorkspace = resolvedWorkspace.id === HIDDEN_WRITING_WORKSPACE.id
  const canLoadRemote = !isHiddenWorkspace || await hasWritingAuthorSession()

  if (canLoadRemote && isSupabaseConfigured && supabase) {
    try {
      const remoteTree = await loadWritingTreeFromSupabase(resolvedWorkspace)
      if (remoteTree) {
        const normalized = normalizeWritingTree(remoteTree)
        writeStorage(resolvedWorkspace.storageKeys.tree, JSON.stringify(normalized))
        return normalized
      }
    } catch {
      // Use the workspace fallback when remote loading fails.
    }
  }

  if (isHiddenWorkspace && !await hasWritingAuthorSession()) {
    return fallback
  }

  const localTree = parseJson(readStorage(resolvedWorkspace.storageKeys.tree), null)
  return localTree ? normalizeWritingTree(localTree) : fallback
}

export function clearWritingTree(workspace = PUBLIC_WRITING_WORKSPACE) {
  return removeStorage(resolveWritingWorkspace(workspace).storageKeys.tree)
}

export function normalizeWritingDraft(draft) {
  const source = draft && typeof draft === 'object' ? draft : {}

  return {
    id: source.id ?? `writing-draft-${slugifySegment(source.slug ?? source.title ?? source.id, 'draft')}`,
    title: normalizeText(source.title),
    body: normalizeText(source.body),
    published: Boolean(source.published),
    updatedAt: source.updatedAt ?? null,
    meta: source.meta && typeof source.meta === 'object' ? source.meta : {},
  }
}

export function serializeWritingDrafts(drafts) {
  const list = Array.isArray(drafts)
    ? drafts.map((draft, index) => normalizeWritingDraft({ ...draft, id: draft?.id ?? `writing-draft-${index}` }))
    : []
  return JSON.stringify(list)
}

export function saveWritingDrafts(drafts, workspace = PUBLIC_WRITING_WORKSPACE) {
  return writeStorage(resolveWritingWorkspace(workspace).storageKeys.drafts, serializeWritingDrafts(drafts))
}

export function loadWritingDrafts(fallback = [], workspace = PUBLIC_WRITING_WORKSPACE) {
  const parsed = parseJson(readStorage(resolveWritingWorkspace(workspace).storageKeys.drafts), [])
  return Array.isArray(parsed)
    ? parsed.map((draft, index) => normalizeWritingDraft({ ...draft, id: draft?.id ?? `writing-draft-${index}` }))
    : fallback
}

export function clearWritingDrafts(workspace = PUBLIC_WRITING_WORKSPACE) {
  return removeStorage(resolveWritingWorkspace(workspace).storageKeys.drafts)
}

export function getWritingStorageKeys(workspace = PUBLIC_WRITING_WORKSPACE) {
  return getWritingWorkspaceStorageKeys(workspace)
}
