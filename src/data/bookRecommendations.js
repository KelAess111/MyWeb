const bookModules = import.meta.glob('../assets/book/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const bookCollator = new Intl.Collator('zh-Hans-CN', {
  numeric: true,
  sensitivity: 'base',
})

function getFileName(path) {
  return path.split('/').pop() ?? ''
}

function getTitle(path) {
  return getFileName(path).replace(/\.[^.]+$/, '').trim()
}

function getAssetKey(title, index) {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `book-${index + 1}`
}

export const bookRecommendations = Object.entries(bookModules)
  .map(([path, src]) => ({ path, src, title: getTitle(path) }))
  .filter((item) => item.title)
  .sort((left, right) => bookCollator.compare(left.title, right.title))
  .map((item, index) => {
    const assetKey = getAssetKey(item.title, index)
    return { ...item, assetKey, entryId: `book-entry-${assetKey}` }
  })

export const bookRecommendationsTree = {
  id: 'book-writing-root',
  slug: 'book',
  type: 'folder',
  title: '推荐书目',
  intro: '仅从本地书籍图片生成的书评工作区。',
  detail: '',
  excerptLabel: '书评',
  children: bookRecommendations.map((item) => ({
    id: item.entryId,
    slug: item.assetKey,
    type: 'entry',
    title: item.title,
    intro: '',
    detail: '',
    status: 'incomplete',
    excerptLabel: '书评',
    meta: { assetKey: item.assetKey },
    blocks: [],
    annotations: [],
  })),
}
