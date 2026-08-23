export const workCategories = [
  {
    id: 'games',
    path: '/works/games',
    title: '游戏爱好',
    navLabel: '游戏爱好',
    summary: '展示我的游戏项目、玩法构想、截图与开发记录。',
    intro:
      '这里会整理我的游戏设计、世界观尝试与开发过程，也会放一些仍在成长中的原型与想法。',
    accent: 'violet',
  },
  {
    id: 'painting',
    path: '/works/painting',
    title: '美图分享',
    navLabel: '美图分享',
    summary: '展示插画、角色设定、练习作品与风格探索。',
    intro:
      '这里会收集我在角色形象、氛围画面与色彩尝试上的积累，也会记录风格变化。',
    accent: 'rose',
  },
  {
    id: 'music',
    path: '/works/music',
    title: '音乐喜好',
    navLabel: '音乐喜好',
    summary: '展示原创曲目、氛围实验与配乐片段。',
    intro:
      '这里将会放置我做过的原创音乐、配乐实验和一些只存在于某个情绪阶段的声音。',
    accent: 'cyan',
  },
  {
    id: 'modeling',
    path: '/works/modeling',
    title: '推荐书目',
    navLabel: '推荐书目',
    summary: '展示 3D 模型、场景设计与角色尝试。',
    intro:
      '这里会记录我对角色、道具和场景结构的立体化尝试，也会放一些未完成但值得保留的过程。',
    accent: 'amber',
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
  },
]

export function findWorkCategory(categoryId) {
  return workCategories.find((category) => category.id === categoryId)
}
