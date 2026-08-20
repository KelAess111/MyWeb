const publicWritingData = {
  id: 'writing-root',
  slug: 'writing',
  type: 'folder',
  title: '写作角落',
  intro: '公开写作目录。',
  detail: '这里是公开写作模块的根目录。左侧浏览栏位，右侧查看详情，双击进入更深层内容。',
  excerptLabel: '根目录',
  children: [
    {
      id: 'writing-folder-fragments',
      slug: 'fragments',
      type: 'folder',
      title: '片段与碎句',
      intro: '一些短句、残片、没有长到成为整篇文章的东西。',
      detail: '这个目录用来收纳较短的文字片段。可以继续往里建立子栏位，也可以单独进入条目阅读。',
      excerptLabel: '目录',
      children: [
        {
          id: 'writing-entry-window-rain',
          slug: 'window-rain',
          type: 'entry',
          title: '窗边的雨',
          intro: '一段关于雨夜和光影的短文。',
          detail: '这是一个示例条目，用来展示阅读翻页、注释以及目录和内容互相切换的基本体验。',
          template: 'fragment',
          excerptLabel: '条目',
          annotations: [
            {
              id: 'annotation-window-rain-1',
              term: '雨丝',
              occurrence: 1,
              content: '这里的“雨丝”只是示例注释词，用来确认写作模块与日志区注释渲染保持一致。',
              title: '雨丝',
              category: 'meta',
            },
          ],
          blocks: [
            {
              id: 'window-rain-block-1',
              type: 'paragraph',
              text: '她靠在窗边，看外面的雨丝被街灯拉得很长，像一封没有写完的信。',
            },
            {
              id: 'window-rain-block-2',
              type: 'quote',
              text: '如果夜晚有颜色，那大概就是玻璃上那层反光的蓝。',
            },
            {
              id: 'window-rain-block-3',
              type: 'paragraph',
              text: '再低一点头，就会看见室内的影子也叠进了雨里。',
            },
          ],
        },
      ],
    },
    {
      id: 'writing-folder-essays',
      slug: 'essays',
      type: 'folder',
      title: '长文与段落',
      intro: '适合做多页阅读的文章示例。',
      detail: '这个目录用于测试像书页一样的阅读体验，包括分页、同层条目切换以及详情栏展示。',
      excerptLabel: '目录',
      children: [
        {
          id: 'writing-entry-slow-corridor',
          slug: 'slow-corridor',
          type: 'entry',
          title: '缓慢走廊',
          intro: '一篇分段较多的示例文章。',
          detail: '用于验证正文分页、右侧详情、条目切换和 block 级渲染是否正常。',
          template: 'essay',
          excerptLabel: '条目',
          annotations: [
            {
              id: 'annotation-slow-corridor-1',
              term: '走廊',
              occurrence: 2,
              content: '第二次出现“走廊”时触发注释，用来验证 occurrence 逻辑。',
              title: '走廊',
              category: 'process',
            },
          ],
          blocks: [
            {
              id: 'slow-corridor-block-1',
              type: 'subheading',
              text: '第一节',
            },
            {
              id: 'slow-corridor-block-2',
              type: 'paragraph',
              text: '走廊尽头总是更亮一点，于是每次走过去都像在接近什么。',
            },
            {
              id: 'slow-corridor-block-3',
              type: 'paragraph',
              text: '可是真的走到那里时，走廊又只是走廊，灯管轻轻响着，没有谁在等。',
            },
            {
              id: 'slow-corridor-block-4',
              type: 'aside',
              text: '有些地方之所以难忘，不是因为发生过什么，而是因为它总像快要发生什么。',
            },
            {
              id: 'slow-corridor-block-5',
              type: 'list',
              items: ['旧墙面', '鞋跟回声', '过亮的拐角'],
            },
            {
              id: 'slow-corridor-block-6',
              type: 'paragraph',
              text: '于是她学会在每个经过的地方稍微停一下，把自己还给当下。',
            },
          ],
        },
      ],
    },
    {
      id: 'writing-folder-dialogues',
      slug: 'dialogues',
      type: 'folder',
      title: '对话与片场',
      intro: '以对话为主的内容。',
      detail: '用于测试 dialogue block 渲染，并确认对话行里的注释也与日志模块一致。',
      excerptLabel: '目录',
      children: [
        {
          id: 'writing-entry-late-platform',
          slug: 'late-platform',
          type: 'entry',
          title: '晚站台',
          intro: '一段发生在站台上的简短对话。',
          detail: '这个条目重点测试对话块、双击进入阅读页，以及对话文字也能挂注释。',
          template: 'dialogue',
          excerptLabel: '条目',
          annotations: [
            {
              id: 'annotation-late-platform-1',
              term: '末班车',
              occurrence: 1,
              content: '站台对话中的关键词注释示例。',
              title: '末班车',
              category: 'world',
            },
          ],
          blocks: [
            {
              id: 'late-platform-block-1',
              type: 'dialogue',
              lines: [
                {
                  id: 'late-platform-line-1',
                  speaker: 'A',
                  text: '你等的是末班车，还是一个不会来的人？',
                },
                {
                  id: 'late-platform-line-2',
                  speaker: 'B',
                  text: '也许都不是，我只是想把今天再拖久一点。',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export { publicWritingData }
