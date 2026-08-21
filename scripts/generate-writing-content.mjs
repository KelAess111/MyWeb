import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const inputPath = path.resolve(projectRoot, 'content/writing/writing-source.json')
const outputPath = path.resolve(projectRoot, 'src/data/hiddenSpaceWriting.generated.js')

function slugifySegment(value, fallback = 'item') {
  const base = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base || fallback
}

function normalizeHoverLine(hoverLine, fallbackId) {
  if (!hoverLine || typeof hoverLine !== 'object') {
    return null
  }

  return {
    id: hoverLine.id ?? `${fallbackId}-hover`,
    text: hoverLine.text ?? '',
    expression: hoverLine.expression ?? 'calm',
    caption: hoverLine.caption ?? '',
  }
}

function normalizeBlock(block, index, entryId) {
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
        text: block.text ?? '',
      }
    case 'list':
      return {
        id: baseId,
        type: 'list',
        items: Array.isArray(block.items) ? block.items.map((item) => String(item ?? '')) : [],
      }
    case 'dialogue':
      return {
        id: baseId,
        type: 'dialogue',
        lines: Array.isArray(block.lines)
          ? block.lines.map((line, lineIndex) => ({
              id: line?.id ?? `${baseId}-line-${lineIndex}`,
              speaker: line?.speaker ?? '',
              text: line?.text ?? '',
            }))
          : [],
      }
    case 'paragraph':
    default:
      return {
        id: baseId,
        type: 'paragraph',
        text: block.text ?? '',
      }
  }
}

function ensureSupportedTemplate(template, entryId) {
  const supportedTemplates = new Set(['fragment', 'essay', 'world-note', 'dialogue'])
  const nextTemplate = template ?? 'fragment'

  if (!supportedTemplates.has(nextTemplate)) {
    throw new Error(`Unsupported writing template "${nextTemplate}" in ${entryId}`)
  }

  return nextTemplate
}

function registerId(id, usedIds) {
  if (usedIds.has(id)) {
    throw new Error(`Duplicate writing node id: ${id}`)
  }

  usedIds.add(id)
}

function normalizeEntryNode(node, context, usedIds) {
  const slug = slugifySegment(node.slug ?? node.title, `entry-${context.index}`)
  const id = node.id ?? `${context.parentId}-${slug}`
  registerId(id, usedIds)

  return {
    id,
    slug,
    path: `${context.parentPath}/${slug}`,
    type: 'entry',
    title: node.title ?? '未命名条目',
    intro: node.intro ?? '',
    detail: node.detail ?? node.intro ?? '',
    template: ensureSupportedTemplate(node.template, id),
    excerptLabel: node.excerptLabel ?? '条目',
    meta: node.meta && typeof node.meta === 'object' ? node.meta : {},
    blocks: Array.isArray(node.blocks) ? node.blocks.map((block, index) => normalizeBlock(block, index, id)) : [],
    ocHoverLine: normalizeHoverLine(node.ocHoverLine, id),
  }
}

function normalizeFolderNode(node, context, usedIds) {
  const slug = slugifySegment(node.slug ?? node.title, `folder-${context.index}`)
  const id = node.id ?? `${context.parentId}-${slug}`
  const pathValue = `${context.parentPath}/${slug}`
  registerId(id, usedIds)

  const normalizedFolder = {
    id,
    slug,
    path: pathValue,
    type: 'folder',
    title: node.title ?? '未命名文件夹',
    intro: node.intro ?? '',
    detail: node.detail ?? node.intro ?? '',
    excerptLabel: node.excerptLabel ?? '目录',
    meta: node.meta && typeof node.meta === 'object' ? node.meta : {},
    ocHoverLine: normalizeHoverLine(node.ocHoverLine, id),
    children: [],
  }

  const children = Array.isArray(node.children) ? node.children : []
  normalizedFolder.children = children.map((child, index) => normalizeWritingNode(child, {
    index,
    parentId: normalizedFolder.id,
    parentPath: normalizedFolder.path,
  }, usedIds))

  return normalizedFolder
}

function normalizeWritingNode(node, context, usedIds) {
  if (node?.type === 'folder') {
    return normalizeFolderNode(node, context, usedIds)
  }

  return normalizeEntryNode(node ?? {}, context, usedIds)
}

function normalizeWritingTree(source) {
  const usedIds = new Set()

  return normalizeFolderNode(
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
      index: 0,
      parentId: 'root',
      parentPath: '/root',
    },
    usedIds,
  )
}

async function main() {
  const raw = await readFile(inputPath, 'utf8')
  const parsed = JSON.parse(raw)
  const normalized = normalizeWritingTree(parsed)
  const fileContents = `export const hiddenSpaceWriting = ${JSON.stringify(normalized, null, 2)}\n`
  await writeFile(outputPath, fileContents, 'utf8')
  console.log(`Generated ${path.relative(projectRoot, outputPath)}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
