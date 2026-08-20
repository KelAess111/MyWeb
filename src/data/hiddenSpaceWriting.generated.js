import { normalizeWritingTree } from '../services/writingService'
import { publicWritingData } from './publicWritingData'

const hiddenSpaceWriting = normalizeWritingTree({
  ...publicWritingData,
  id: 'hidden-writing-root',
  slug: 'hidden-writing',
  title: '隐藏写作角落',
  intro: '只在隐藏空间展示的写作目录。',
  detail: '这里沿用同一套写作系统，但挂在隐藏空间布局里，供隐藏空间路线直接复用。',
})

export { hiddenSpaceWriting }
