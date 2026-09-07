import { useState } from 'react'
import AnnotationTerm from './AnnotationTerm'

/**
 * 全局注释组件 - 可以在任何地方使用
 *
 * 使用示例：
 * <Annotate term="原创角色" content="这是我自己设计的角色">原创角色</Annotate>
 * <Annotate term="GAL游戏" title="关于GAL" content="视觉小说类游戏" category="reference">GAL游戏</Annotate>
 * <Annotate term="专业术语" content="说明" className="custom-annotation">专业术语</Annotate>
 */
function Annotate({
  children,
  term,           // 要标注的词（可选，默认使用 children）
  content,        // 注释内容
  title,          // 弹窗标题（可选）
  category = 'meta', // 分类：meta/reference/technical
  className = ''  // 自定义类名
}) {
  const [isOpen, setIsOpen] = useState(false)
  const label = term || children
  const uniqueId = `annotate-${Math.random().toString(36).substr(2, 9)}`

  if (!content) {
    // 如果没有内容，直接返回文字，不添加注释
    return <>{children}</>
  }

  return (
    <span className={className}>
      <AnnotationTerm
        id={uniqueId}
        label={label}
        title={title || label}
        content={content}
        category={category}
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        onToggle={() => setIsOpen(!isOpen)}
      />
    </span>
  )
}

export default Annotate
