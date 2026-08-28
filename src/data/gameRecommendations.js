const gameModules = import.meta.glob('../assets/game/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const gameCollator = new Intl.Collator('zh-Hans-CN', {
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

  return normalized || `game-${index + 1}`
}

export const gameRecommendations = Object.entries(gameModules)
  .map(([path, src]) => ({ path, src, title: getTitle(path) }))
  .filter((item) => item.title)
  .sort((left, right) => gameCollator.compare(left.title, right.title))
  .map((item, index) => {
    const assetKey = getAssetKey(item.title, index)

    return {
      ...item,
      assetKey,
      entryId: `game-entry-${assetKey}`,
    }
  })

export const gameRecommendationsTree = {
  id: 'game-writing-root',
  slug: 'game',
  type: 'folder',
  title: '游戏推荐',
  intro: '仅从本地游戏图片生成的游戏记录工作区。',
  detail: '',
  excerptLabel: '游戏评价',
  children: gameRecommendations.map((item) => ({
    id: item.entryId,
    slug: item.assetKey,
    type: 'entry',
    title: item.title,
    intro: '',
    detail: '',
    status: 'incomplete',
    excerptLabel: '游戏评价',
    meta: { assetKey: item.assetKey },
    blocks: [],
    annotations: [],
  })),
}
