import resetCommon from '../assets/oc/Reset_common.png'
import resetDrink from '../assets/oc/Reset_drink.png'
import resetGreet from '../assets/oc/Reset_greet.png'
import resetSpeechless from '../assets/oc/Reset_speechless.png'
import resetThink from '../assets/oc/Reset_think.png'

export const hiddenSpaceOcScenes = {
  firstVisit: [
    {
      id: 'hidden-intro-1',
      text: '没想到你真的找到了这里。',
      expression: 'mischief',
      image: resetCommon,
      alt: 'KelAess 的 Q 版形象带着一点得意，像是早就猜到会有人找到这里。',
      caption: '欢迎来到不那么正式的地方。',
    },
    {
      id: 'hidden-intro-2',
      text: '这里没有首页那样端正，更多是我不太成熟、却舍不得丢掉的东西。',
      expression: 'calm',
      image: resetGreet,
      alt: 'KelAess 的 Q 版形象以温和的姿态解释这个更私人、更放松的空间。',
      caption: '轻松点，这里没有必要装得太完美。',
    },
    {
      id: 'hidden-intro-3',
      text: '你可以从这里进入游戏、绘画、写作这些角落，慢慢翻就好。',
      expression: 'calm',
      image: resetThink,
      alt: 'KelAess 的 Q 版形象认真思考后为来访者指引隐藏空间的不同角落。',
      caption: '既然进来了，就随便看看吧。',
    },
  ],
  returnGreeting: {
    id: 'hidden-return',
    text: '又来了……这次想翻哪一格？',
    expression: 'greet',
    image: resetGreet,
    alt: 'KelAess 的 Q 版形象熟稔地向再次到访的来访者打招呼。',
    caption: '老地方，但每次翻开都会有点不同。',
  },
  defaults: {
    home: {
      id: 'hidden-home-default',
      text: '这里比首页轻松很多，你可以先决定从哪个方向开始。',
      expression: 'calm',
      image: resetGreet,
      alt: 'KelAess 的 Q 版形象站在隐藏空间首页，温和地等待来访者选择方向。',
      caption: '你可以慢一点看。',
    },
    games: {
      id: 'hidden-games-default',
      text: '游戏这边会更吵一点，毕竟它们总喜欢把没成熟的想法全端出来。',
      expression: 'mischief',
      image: resetCommon,
      alt: 'KelAess 的 Q 版形象带着一点调侃，像是在吐槽游戏里的未成熟想法。',
      caption: '有些想法不完整，但它们确实活过。',
    },
    painting: {
      id: 'hidden-painting-default',
      text: '绘画区会安静一点，但也最容易留下那些改来改去却还是舍不得删掉的痕迹。',
      expression: 'think',
      image: resetThink,
      alt: 'KelAess 的 Q 版形象陷入思考，像是在回看那些反复修改过的画面。',
      caption: '画面有时候比语言更会说实话。',
    },
    writing: {
      id: 'hidden-writing-default',
      text: '写作区通常更碎一点，因为很多东西先以句子活下来，结构反而是后来补上的。',
      expression: 'think',
      image: resetThink,
      alt: 'KelAess 的 Q 版形象认真思考着那些先以句子活下来的故事碎片。',
      caption: '有些故事先会以碎片的形式求生。',
    },
    journal: {
      id: 'hidden-journal-default',
      text: '日志区会更接近日常本身，事情、日期和吐槽会并排躺在一起，不太体面，但比较真。',
      expression: 'speechless',
      image: resetSpeechless,
      alt: 'KelAess 的 Q 版形象露出无言以对的表情，像是在面对不太体面的日常记录。',
      caption: '有些事如果不记下来，过几天就会被我自己改写掉。',
    },
    personal: {
      id: 'hidden-personal-default',
      text: '个人角落会更轻松些，像是把平时不太会主动讲出来的偏好和兴趣摊开。',
      expression: 'drink',
      image: resetDrink,
      alt: 'KelAess 的 Q 版形象拿着饮料，像是在更轻松地和来访者聊天。',
      caption: '这里更像聊天，不像展示。',
    },
  },
}
