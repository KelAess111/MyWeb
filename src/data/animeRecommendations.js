const animeModules = import.meta.glob('../assets/animation/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const animeCollator = new Intl.Collator('zh-Hans-CN', {
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

  return normalized || `anime-${index + 1}`
}

export const animeRecommendations = Object.entries(animeModules)
  .map(([path, src]) => ({ path, src, title: getTitle(path) }))
  .filter((item) => item.title)
  .sort((left, right) => animeCollator.compare(left.title, right.title))
  .map((item, index) => {
    const assetKey = getAssetKey(item.title, index)

    return {
      ...item,
      assetKey,
      entryId: `anime-entry-${assetKey}`,
    }
  })

export const animeRecommendationsTree = {
  id: 'anime-writing-root',
  slug: 'anime',
  type: 'folder',
  title: '动漫推荐',
  intro: '仅从本地动漫图片生成的评价工作区。',
  detail: '',
  excerptLabel: '动漫评价',
  children: animeRecommendations.map((item) => ({
    id: item.entryId,
    slug: item.assetKey,
    type: 'entry',
    title: item.title,
    intro: '',
    detail: '',
    status: 'incomplete',
    excerptLabel: '观感',
    meta: {
      assetKey: item.assetKey,
    },
    blocks: [],
    annotations: [],
  })),
}
