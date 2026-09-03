import gamesImage from '../assets/photo/游戏爱好.jpg'
import animeImage from '../assets/photo/动漫推荐.jpg'
import paintingImage from '../assets/photo/审美积累.jpg'
import modelingImage from '../assets/photo/推荐书目.jpg'
import musicImage from '../assets/photo/音乐喜好.jpg'
import writingImage from '../assets/photo/小作文.jpg'

export const workCategories = [
  {
    id: 'games',
    path: '/works/games',
    title: '游戏爱好',
    navLabel: '游戏爱好',
    summary: '展示我的游戏爱好、喜欢的玩法、游戏截图。',
    intro:
      '这里会整理我的最近玩的游戏、喜欢的世界观与玩法，也会放一些游玩后的评价与感受。',
    accent: 'violet',
    image: gamesImage,
  },
  {
    id: 'painting',
    path: '/works/painting',
    title: '审美积累',
    navLabel: '审美积累',
    summary: '展示喜欢的插画、画师以及风格。',
    intro:
      '这里会收集我在各平台收集的插画，展示审美积累，也会记录风格变化。',
    accent: 'rose',
    image: paintingImage,
  },
  {
    id: 'music',
    path: '/works/music',
    title: '音乐喜好',
    navLabel: '音乐喜好',
    summary: '展示喜欢的曲目、风格与制作人。',
    intro:
      '这里将会放置我喜欢的音乐以及一些不错的填词，欣赏不同的音乐风格，感受其中的情绪。',
    accent: 'cyan',
    image: musicImage,
  },
  {
    id: 'modeling',
    path: '/works/modeling',
    title: '推荐书目',
    navLabel: '推荐书目',
    summary: '展示喜欢的书目、分享一些感想。',
    intro:
      '这里会记录我对书籍的理解与感受，也会分享一些读后感与思考。',
    accent: 'amber',
    image: modelingImage,
  },
  {
    id: 'writing',
    path: '/works/writing',
    title: '小作文',
    navLabel: '小作文',
    summary: '展示短篇、设定集、剧情草稿与创作碎片。',
    intro:
      '这里会是故事碎片、角色笔记与世界观草稿的集中地，也是注释模块最常发挥作用的区域之一。',
    accent: 'emerald',
    image: writingImage,
  },
  {
    id: 'anime',
    path: '/works/anime',
    title: '动漫推荐',
    navLabel: '动漫推荐',
    summary: '整理我喜欢的动漫作品、角色与观看推荐。',
    intro:
      '这里会收集值得推荐的动漫作品、观看感受和个人偏好，也会逐步补充主题分类与作品笔记。',
    accent: 'sky',
    image: animeImage,
  },
]

export function findWorkCategory(categoryId) {
  return workCategories.find((category) => category.id === categoryId)
}
