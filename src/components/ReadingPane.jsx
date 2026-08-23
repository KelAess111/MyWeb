import { useEffect, useMemo, useRef, useState } from 'react'
import AnnotatedText from './AnnotatedText'

function getEntryAnnotations(entry) {
  return entry?.annotations ?? entry?.meta?.annotations ?? []
}

function flattenParagraphText(blocks = []) {
  return blocks
    .map((block) => {
      if (block?.type === 'paragraph' || block?.type === 'quote' || block?.type === 'aside' || block?.type === 'subheading') {
        return block.text ?? ''
      }

      if (block?.type === 'list') {
        return Array.isArray(block.items) ? block.items.filter(Boolean).join('；') : ''
      }

      if (block?.type === 'dialogue') {
        return Array.isArray(block.lines)
          ? block.lines.map((line) => [line?.speaker, line?.text].filter(Boolean).join('：')).filter(Boolean).join('\n')
          : ''
      }

      return ''
    })
    .filter(Boolean)
}

function getBlockCharacterCount(block) {
  if (!block) {
    return 0
  }

  if (block.type === 'paragraph' || block.type === 'quote' || block.type === 'aside' || block.type === 'subheading') {
    return (block.text ?? '').length
  }

  if (block.type === 'list') {
    return Array.isArray(block.items) ? block.items.join('').length : 0
  }

  if (block.type === 'dialogue') {
    if (!Array.isArray(block.lines)) {
      return 0
    }

    return block.lines.reduce((sum, line) => {
      return sum + (line?.speaker ?? '').length + (line?.text ?? '').length
    }, 0)
  }

  return 0
}

function paginateBlocks(blocks, targetCharsPerPage = 800) {
  if (!blocks || blocks.length === 0) {
    return [[]]
  }

  const pages = []
  let currentPage = []
  let currentPageChars = 0

  for (const block of blocks) {
    const blockChars = getBlockCharacterCount(block)

    if (currentPage.length === 0) {
      currentPage.push(block)
      currentPageChars = blockChars
    } else if (currentPageChars + blockChars <= targetCharsPerPage) {
      currentPage.push(block)
      currentPageChars += blockChars
    } else {
      pages.push(currentPage)
      currentPage = [block]
      currentPageChars = blockChars
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  return pages.length ? pages : [[]]
}

function ReaderBlock({ block, annotations, entryId }) {
  if (!block) {
    return null
  }

  if (block.type === 'subheading') {
    return <h3 className="hidden-space-writing-reader-subheading">{block.text}</h3>
  }

  if (block.type === 'quote') {
    return (
      <blockquote className="hidden-space-writing-reader-segment hidden-space-writing-reader-quote">
        <AnnotatedText body={block.text} annotations={annotations} idPrefix={`${entryId}-${block.id}`} />
      </blockquote>
    )
  }

  if (block.type === 'aside') {
    return (
      <aside className="hidden-space-writing-reader-segment hidden-space-writing-reader-aside">
        <AnnotatedText body={block.text} annotations={annotations} idPrefix={`${entryId}-${block.id}`} />
      </aside>
    )
  }

  if (block.type === 'list') {
    return (
      <ul className="hidden-space-writing-reader-list">
        {(block.items ?? []).map((item, index) => (
          <li key={`${block.id}-item-${index}`}>
            <AnnotatedText body={item} annotations={annotations} idPrefix={`${entryId}-${block.id}-item-${index}`} />
          </li>
        ))}
      </ul>
    )
  }

  if (block.type === 'dialogue') {
    return (
      <div className="hidden-space-writing-reader-dialogue">
        {(block.lines ?? []).map((line, index) => (
          <div key={line.id ?? `${block.id}-line-${index}`} className="hidden-space-writing-reader-dialogue-line">
            {line.speaker ? <strong>{line.speaker}：</strong> : null}
            <AnnotatedText body={line.text ?? ''} annotations={annotations} idPrefix={`${entryId}-${block.id}-line-${index}`} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="hidden-space-writing-reader-segment">
      <AnnotatedText body={block.text} annotations={annotations} idPrefix={`${entryId}-${block.id}`} />
    </div>
  )
}

function ReadingPane({
  entry,
  siblingEntries = [],
  activeEntryId,
  onJumpToEntry,
  onBackToDirectory,
  editorMode = false,
  onEditNode,
  currentFolder,
}) {
  const pageRef = useRef(null)
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPageIndex(0)
      pageRef.current?.scrollTo?.({ top: 0, behavior: 'auto' })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [entry?.id])

  const annotations = useMemo(() => getEntryAnnotations(entry), [entry])
  const blocks = useMemo(() => (Array.isArray(entry?.blocks) ? entry.blocks : []), [entry])
  const pages = useMemo(() => paginateBlocks(blocks), [blocks])
  const flattenedPreview = useMemo(() => flattenParagraphText(blocks).join('\n\n'), [blocks])

  if (!entry) {
    return null
  }

  const hasPrev = pageIndex > 0
  const hasNext = pageIndex < pages.length - 1
  const currentPage = pages[pageIndex] ?? []

  return (
    <div className="hidden-space-writing-reading-shell">
      <aside className="hidden-space-writing-reading-tree">
        <div className="hidden-space-writing-reading-tree-head">
          <div>
            <p className="hidden-space-writing-count">{currentFolder?.title ?? '当前目录'}</p>
            <h2>同层条目</h2>
          </div>
        </div>

        <div className="hidden-space-writing-reading-tree-summary">
          <strong>{entry.title}</strong>
          <p>{entry.detail || entry.intro || '这条内容还没有简介。'}</p>
        </div>

        <div className="hidden-space-writing-reading-tree-list">
          {siblingEntries.length ? siblingEntries.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`hidden-space-writing-reading-tree-item ${item.id === activeEntryId ? 'is-active' : ''}`}
              onClick={() => onJumpToEntry(item)}
            >
              <span className="hidden-space-writing-reading-tree-item-title">{item.title}</span>
              <span className="hidden-space-writing-reading-tree-item-intro">{item.intro || '暂无简介'}</span>
            </button>
          )) : (
            <div className="hidden-space-writing-reader-empty">当前目录没有其他条目。</div>
          )}
        </div>

        <div className="hidden-space-writing-reader-toolbar-actions">
          <button type="button" className="btn secondary" onClick={onBackToDirectory}>
            返回目录
          </button>
          {editorMode && typeof onEditNode === 'function' ? (
            <button type="button" className="btn secondary" onClick={() => onEditNode(entry)}>
              编辑当前项
            </button>
          ) : null}
        </div>
      </aside>

      <article className="hidden-space-writing-reader-panel">
        <header className="hidden-space-writing-reader-page-header">
          <div>
            <h2>{entry.title}</h2>
            <p className="hidden-space-writing-detail-intro">{entry.detail || entry.intro || '这条内容还没有简介。'}</p>
            {entry.date ? <p className="hidden-space-writing-count">日期：{entry.date}</p> : null}
            <p className="hidden-space-writing-count">
              状态：{entry.status === 'completed' ? '已完成' : '未完成'}
            </p>
          </div>
        </header>

        <div className="hidden-space-writing-reader-toolbar">
          <strong>正文预览</strong>
          <span>{flattenedPreview.length} 字符</span>
        </div>

        <div className="hidden-space-writing-reader-stage">
          <div ref={pageRef} className="hidden-space-writing-reader-page">
            <div className="hidden-space-writing-reader-page-body">
              {currentPage.length ? currentPage.map((block) => (
                <ReaderBlock key={block.id} block={block} annotations={annotations} entryId={entry.id} />
              )) : (
                <div className="hidden-space-writing-reader-empty">这条内容还没有正文。</div>
              )}
            </div>
          </div>
        </div>

        <footer className="hidden-space-writing-reader-footer">
          <p>{annotations.length ? `共有 ${annotations.length} 条注释。` : '当前没有注释。'}</p>
          <div className="hidden-space-writing-reader-controls">
            <button type="button" className="btn secondary" disabled={!hasPrev} onClick={() => setPageIndex((current) => Math.max(0, current - 1))}>
              上一页
            </button>
            <button type="button" className="btn secondary" disabled={!hasNext} onClick={() => setPageIndex((current) => current + 1)}>
              下一页
            </button>
          </div>
        </footer>
      </article>
    </div>
  )
}

export default ReadingPane
