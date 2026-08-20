import { useMemo, useState } from 'react'

function createLineId(prefix, index) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${index}`
}

function createBlock(type, entryId, index = 0) {
  const id = `${entryId}-block-${type}-${Date.now()}-${index}`

  if (type === 'list') {
    return {
      id,
      type: 'list',
      items: [''],
    }
  }

  if (type === 'dialogue') {
    return {
      id,
      type: 'dialogue',
      lines: [
        {
          id: createLineId(`${id}-line`, 0),
          speaker: '',
          text: '',
        },
      ],
    }
  }

  return {
    id,
    type,
    text: '',
  }
}

const BLOCK_TYPES = [
  { value: 'paragraph', label: '段落' },
  { value: 'subheading', label: '小标题' },
  { value: 'quote', label: '引用' },
  { value: 'aside', label: '旁白' },
  { value: 'list', label: '列表' },
  { value: 'dialogue', label: '对话' },
]

function WritingBlockEditor({ blocks = [], entryId, onChange }) {
  const safeBlocks = useMemo(() => (Array.isArray(blocks) ? blocks : []), [blocks])
  const [nextType, setNextType] = useState('paragraph')

  const updateBlock = (blockId, patch) => {
    onChange(
      safeBlocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
    )
  }

  const removeBlock = (blockId) => {
    const nextBlocks = safeBlocks.filter((block) => block.id !== blockId)
    onChange(nextBlocks.length ? nextBlocks : [createBlock('paragraph', entryId)])
  }

  const addBlock = () => {
    onChange([...safeBlocks, createBlock(nextType, entryId, safeBlocks.length)])
  }

  const moveBlock = (blockId, direction) => {
    const index = safeBlocks.findIndex((block) => block.id === blockId)
    if (index < 0) {
      return
    }

    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= safeBlocks.length) {
      return
    }

    const nextBlocks = [...safeBlocks]
    const [currentBlock] = nextBlocks.splice(index, 1)
    nextBlocks.splice(nextIndex, 0, currentBlock)
    onChange(nextBlocks)
  }

  const updateListItem = (blockId, itemIndex, value) => {
    const block = safeBlocks.find((item) => item.id === blockId)
    const nextItems = (block?.items ?? []).map((item, index) => (index === itemIndex ? value : item))
    updateBlock(blockId, { items: nextItems })
  }

  const addListItem = (blockId) => {
    const block = safeBlocks.find((item) => item.id === blockId)
    updateBlock(blockId, { items: [...(block?.items ?? []), ''] })
  }

  const removeListItem = (blockId, itemIndex) => {
    const block = safeBlocks.find((item) => item.id === blockId)
    const nextItems = (block?.items ?? []).filter((_, index) => index !== itemIndex)
    updateBlock(blockId, { items: nextItems.length ? nextItems : [''] })
  }

  const updateDialogueLine = (blockId, lineId, patch) => {
    const block = safeBlocks.find((item) => item.id === blockId)
    const nextLines = (block?.lines ?? []).map((line) => (line.id === lineId ? { ...line, ...patch } : line))
    updateBlock(blockId, { lines: nextLines })
  }

  const addDialogueLine = (blockId) => {
    const block = safeBlocks.find((item) => item.id === blockId)
    const nextLines = [
      ...(block?.lines ?? []),
      {
        id: createLineId(`${blockId}-line`, (block?.lines ?? []).length),
        speaker: '',
        text: '',
      },
    ]
    updateBlock(blockId, { lines: nextLines })
  }

  const removeDialogueLine = (blockId, lineId) => {
    const block = safeBlocks.find((item) => item.id === blockId)
    const nextLines = (block?.lines ?? []).filter((line) => line.id !== lineId)
    updateBlock(blockId, {
      lines: nextLines.length
        ? nextLines
        : [
            {
              id: createLineId(`${blockId}-line`, 0),
              speaker: '',
              text: '',
            },
          ],
    })
  }

  return (
    <fieldset className="hidden-space-writing-editor-blocks">
      <legend>正文块</legend>

      <div className="hidden-space-writing-editor-blocks-toolbar">
        <label>
          <span>新增类型</span>
          <select value={nextType} onChange={(event) => setNextType(event.target.value)}>
            {BLOCK_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn secondary" onClick={addBlock}>
          新增正文块
        </button>
      </div>

      <div className="hidden-space-writing-editor-block-list">
        {safeBlocks.map((block, index) => (
          <article key={block.id} className="hidden-space-writing-editor-block-card">
            <div className="hidden-space-writing-editor-block-head">
              <div>
                <strong>{BLOCK_TYPES.find((item) => item.value === block.type)?.label ?? '段落'}</strong>
                <span>第 {index + 1} 块</span>
              </div>
              <div className="hidden-space-writing-editor-inline-actions">
                <button type="button" className="btn secondary" onClick={() => moveBlock(block.id, -1)} disabled={index === 0}>
                  上移
                </button>
                <button type="button" className="btn secondary" onClick={() => moveBlock(block.id, 1)} disabled={index === safeBlocks.length - 1}>
                  下移
                </button>
                <button type="button" className="btn secondary danger" onClick={() => removeBlock(block.id)}>
                  删除
                </button>
              </div>
            </div>

            {block.type === 'list' ? (
              <div className="hidden-space-writing-editor-nested-list">
                {(block.items ?? []).map((item, itemIndex) => (
                  <div key={`${block.id}-item-${itemIndex}`} className="hidden-space-writing-editor-nested-row">
                    <input
                      type="text"
                      value={item}
                      onChange={(event) => updateListItem(block.id, itemIndex, event.target.value)}
                      placeholder={`列表项 ${itemIndex + 1}`}
                    />
                    <button type="button" className="btn secondary danger" onClick={() => removeListItem(block.id, itemIndex)}>
                      删除
                    </button>
                  </div>
                ))}
                <button type="button" className="btn secondary" onClick={() => addListItem(block.id)}>
                  新增列表项
                </button>
              </div>
            ) : null}

            {block.type === 'dialogue' ? (
              <div className="hidden-space-writing-editor-nested-list">
                {(block.lines ?? []).map((line, lineIndex) => (
                  <div key={line.id ?? `${block.id}-line-${lineIndex}`} className="hidden-space-writing-editor-dialogue-row">
                    <input
                      type="text"
                      value={line.speaker ?? ''}
                      onChange={(event) => updateDialogueLine(block.id, line.id, { speaker: event.target.value })}
                      placeholder="说话人"
                    />
                    <textarea
                      rows={2}
                      value={line.text ?? ''}
                      onChange={(event) => updateDialogueLine(block.id, line.id, { text: event.target.value })}
                      placeholder="对话内容"
                    />
                    <button type="button" className="btn secondary danger" onClick={() => removeDialogueLine(block.id, line.id)}>
                      删除
                    </button>
                  </div>
                ))}
                <button type="button" className="btn secondary" onClick={() => addDialogueLine(block.id)}>
                  新增对话行
                </button>
              </div>
            ) : null}

            {block.type !== 'list' && block.type !== 'dialogue' ? (
              <textarea
                rows={block.type === 'paragraph' ? 5 : 3}
                value={block.text ?? ''}
                onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                placeholder="输入这一块的正文"
              />
            ) : null}
          </article>
        ))}
      </div>
    </fieldset>
  )
}

export default WritingBlockEditor
