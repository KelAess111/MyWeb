import resetCommon from '../assets/oc/Reset_common.png'
import resetDrink from '../assets/oc/Reset_drink.png'
import resetGreet from '../assets/oc/Reset_greet.png'
import resetSpeechless from '../assets/oc/Reset_speechless.png'
import resetThink from '../assets/oc/Reset_think.png'

const expressionImageMap = {
  calm: resetGreet,
  mischief: resetCommon,
  helpless: resetSpeechless,
  think: resetThink,
  drink: resetDrink,
}

export function createOCSceneFromNode(node) {
  if (!node?.ocHoverLine) {
    return null
  }

  const { text, expression = 'calm', caption } = node.ocHoverLine
  const image = expressionImageMap[expression] || resetGreet

  return {
    id: `oc-writing-${node.id}`,
    text: text || '这个栏位还没有 OC 评价。',
    expression,
    image,
    alt: `KelAess 对「${node.title}」的评价`,
    caption: caption || text || '芮瑟特的评价',
  }
}
