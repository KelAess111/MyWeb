import idle from '../assets/oc/rui-approved/idle.webp'
import annoyed from '../assets/oc/rui-approved/annoyed.webp'
import talk from '../assets/oc/rui-approved/talk.webp'
import dislike from '../assets/oc/rui-approved/dislike.webp'
import side from '../assets/oc/rui-approved/side.webp'

const expressionImageMap = {
  calm: idle,
  mischief: annoyed,
  helpless: dislike,
  think: side,
  drink: talk,
}

export function createOCSceneFromNode(node) {
  if (!node?.ocHoverLine) {
    return null
  }

  const { text, expression = 'calm', caption } = node.ocHoverLine
  const image = expressionImageMap[expression] || idle

  return {
    id: `oc-writing-${node.id}`,
    text: text || '这个栏位还没有 OC 评价。',
    expression,
    image,
    alt: `KelAess 对「${node.title}」的评价`,
    caption: caption || text || '芮瑟特的评价',
  }
}
