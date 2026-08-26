const coverModules = import.meta.glob('../assets/picture/*/surface.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const imageModules = import.meta.glob('../assets/picture/*/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const galleryMetadata = [
  {
    id: '2030',
    year: '2030',
    title: '2030 图册',
    summary: '预留给这一年的新画面，先用封面和时间节点占位。',
    note: '这一年的图册还在整理中，等新图片到位后会继续补充。',
    side: 'left',
    status: 'reserved',
  },
  {
    id: '2029',
    year: '2029',
    title: '2029 图册',
    summary: '先把这一年的入口和封面保留下来。',
    note: '图册内容暂未展开，当前只有封面可供进入。',
    side: 'right',
    status: 'reserved',
  },
  {
    id: '2028',
    year: '2028',
    title: '2028 图册',
    summary: '为后续补图预留的年份节点。',
    note: '目前还没有正文图片，先显示封面和空状态。',
    side: 'left',
    status: 'reserved',
  },
  {
    id: '2027',
    year: '2027',
    title: '2027 图册',
    summary: '这一年先保留目录与封面。',
    note: '等图片整理好后，这一页会继续补全。',
    side: 'right',
    status: 'reserved',
  },
  {
    id: '2026',
    year: '2026',
    title: '2026 图册',
    summary: '目前已经整理好的图册，从这一年开始浏览。',
    note: '这一年已经放入了实际图片，可以直接放大查看。',
    side: 'left',
    status: 'published',
  },
]

const galleryCollator = new Intl.Collator('zh-Hans-CN', {
  numeric: true,
  sensitivity: 'base',
})

function getFileName(path) {
  return path.split('/').pop() ?? ''
}

function getBaseName(path) {
  return getFileName(path).replace(/\.[^.]+$/, '')
}

function getYear(path) {
  return path.match(/\/picture\/(\d{4})\//)?.[1] ?? null
}

function getCoverForYear(year) {
  return Object.entries(coverModules).find(([path]) => getYear(path) === year)?.[1] ?? ''
}

function getImagesForYear(year) {
  return Object.entries(imageModules)
    .filter(([path]) => getYear(path) === year && getBaseName(path).toLowerCase() !== 'surface')
    .sort(([leftPath], [rightPath]) => galleryCollator.compare(getFileName(leftPath), getFileName(rightPath)))
    .map(([path, src], index) => {
      const baseName = getBaseName(path)
      return {
        src,
        alt: baseName ? `${year} 图册 ${baseName}` : `${year} 图册第 ${index + 1} 张`,
      }
    })
}

export const publicGalleryData = galleryMetadata.map((entry) => {
  const images = getImagesForYear(entry.year)

  return {
    ...entry,
    cover: getCoverForYear(entry.year),
    images,
    imageCount: images.length,
    hasImages: images.length > 0,
  }
})
