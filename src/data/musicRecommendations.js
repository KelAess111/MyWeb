const makerModules = import.meta.glob('../assets/music_share/maker/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' })
const musicModules = import.meta.glob('../assets/music_share/music/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' })

const collator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' })

function filename(path) {
  return path.split('/').pop()?.replace(/\.[^.]+$/, '').trim() ?? ''
}

function assetKey(name, fallback) {
  const value = name.toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-').replace(/^-+|-+$/g, '')
  return value || fallback
}

function collect(modules, prefix) {
  return Object.entries(modules)
    .map(([path, src]) => ({ path, src, name: filename(path) }))
    .filter((item) => item.name && item.src)
    .sort((a, b) => collator.compare(a.name, b.name))
    .map((item, index) => ({ ...item, assetKey: `${prefix}-${assetKey(item.name, `${prefix}-${index + 1}`)}` }))
}

export const musicMakers = collect(makerModules, 'maker')
export const musicAlbums = collect(musicModules, 'album').map((item) => ({ ...item, track: item.name }))

export const musicRecommendationsTree = {
  id: 'music-writing-root',
  slug: 'music',
  type: 'folder',
  title: '音乐喜好',
  intro: '',
  detail: '',
  excerptLabel: '音乐笔记',
  children: [
    ...musicMakers.map((item) => ({ id: `music-entry-${item.assetKey}`, slug: item.assetKey, type: 'entry', title: item.name, intro: '', detail: '', meta: { assetKey: item.assetKey, kind: 'maker' }, blocks: [], annotations: [] })),
    ...musicAlbums.map((item) => ({ id: `music-entry-${item.assetKey}`, slug: item.assetKey, type: 'entry', title: item.name, intro: '', detail: '', meta: { assetKey: item.assetKey, kind: 'album' }, blocks: [], annotations: [] })),
  ],
}
