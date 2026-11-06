import guide from '../assets/oc/rui-approved/guide.webp'
import idle from '../assets/oc/rui-approved/idle.webp'
import dislike from '../assets/oc/rui-approved/dislike.webp'
import annoyed from '../assets/oc/rui-approved/annoyed.webp'
import surprise from '../assets/oc/rui-approved/surprise.webp'
import talk from '../assets/oc/rui-approved/talk.webp'
import side from '../assets/oc/rui-approved/side.webp'

export const homepageDefaultScenes = [
  {
    id: 'oc-default-1',
    text: '不够带劲？试试右上角播放音乐。现在它更像一个真正的广播入口了。',
    expression: 'mischief',
    image: guide,
    alt: '芮瑟特摊手指引方向。',
    caption: '先提醒你，右上角那颗小东西不是摆设。',
  },
  {
    id: 'oc-default-2',
    text: '你现在看到的，只是这个世界的一小部分。',
    expression: 'calm',
    image: idle,
    alt: '芮瑟特双手交叠候立。',
    caption: '欢迎，但这里只是入口。',
  },
  {
    id: 'oc-default-3',
    text: '如果想关闭入场动画，可以在设置里取消勾选”显示入场动画”。',
    expression: 'helpless',
    image: dislike,
    alt: '芮瑟特抱臂露出嫌弃的表情。',
    caption: '你好，特别是今天。',
  },
  {
    id: 'oc-default-4',
    text: '其实设定上 KelAess 有个妹妹……没什么，只是想告诉你。',
    expression: 'mischief',
    image: annoyed,
    alt: '芮瑟特双手交握，带着克制的微笑。',
    caption: '神神秘秘地说起一些设定碎片。',
  },
  {
    id: 'oc-default-5',
    text: '等等，我刚刚是不是把这句话说得太认真了？',
    expression: 'think',
    image: surprise,
    alt: '芮瑟特皱眉惊讶，手收向领口。',
    caption: '让我想想刚才有没有说漏什么。',
  },
  {
      id: 'oc-default-6',
      text: '我的画风和右边不一样？那当然是因为我是ai合成图片哦。',
      expression: 'think',
      image: talk,
      alt: '芮瑟特摊掌开口说话。',
      caption: '以后会变成手绘的。',
    },
]

export const homepageMusicScenes = [
  {
    id: 'oc-music-1',
    text: 'Right Corner Radio 已接入。芮瑟特现在默认你准备听点夜晚才适合开的东西。',
    expression: 'calm',
    image: side,
    alt: '芮瑟特侧身候立。',
    caption: '广播一开，整个房间的空气都会变得更晚一点。',
  },
  {
    id: 'oc-music-2',
    text: 'KelAess 经常彻夜听歌，听的大概是彻夜之歌。',
    expression: 'mischief',
    image: annoyed,
    alt: '芮瑟特双手交握，带着克制的微笑。',
    caption: '有些夜晚，是靠循环播放撑过去的。',
  },
  {
    id: 'oc-music-3',
    text: 'KelAess 开始听不惯术力口，后来听得太多了，于是慢慢接受了这种风格。',
    expression: 'helpless',
    image: dislike,
    alt: '芮瑟特抱臂露出嫌弃的表情。',
    caption: '有些风格不是突然喜欢，而是被反复播放驯化。',
  },
  {
    id: 'oc-music-4',
    text: '广播匿名信道已经打开。你可以给他留言，也可以只是在这里把同一首歌放很多遍。',
    expression: 'unhinged',
    image: guide,
    alt: '芮瑟特摊手指引方向。',
    caption: '广播打开后，芮瑟特会默认你想把夜晚再拉长一点。',
  },
  {
    id: 'oc-music-5',
    text: '先喝口水，再决定下一首要不要继续循环。',
    expression: 'calm',
    image: idle,
    alt: '芮瑟特双手交叠候立。',
    caption: '循环播放之前，先照顾一下自己。',
  },
]

export const writingDefaultScenes = [
  {
    id: 'oc-writing-default',
    text: '这里是写作角落。选一个栏位，我会告诉你我怎么看。',
    expression: 'calm',
    image: talk,
    alt: '芮瑟特摊掌开口说话。',
    caption: '选个栏位，听听芮瑟特的评价。',
  },
]
