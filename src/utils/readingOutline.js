// Build the outline from parsed headings, so fenced code never becomes a heading.
export default function readingOutline() {
  return (tree) => {
    const headings = []
    const getText = node => node.type === 'text' ? node.value : (node.children || []).map(getText).join('')
    const visit = node => {
      if (node.type === 'element' && ['h2', 'h3'].includes(node.tagName)) {
        const id = `reading-section-${headings.length + 1}`
        node.properties = { ...node.properties, id }
        headings.push({ id, title: getText(node), level: node.tagName })
      }
      node.children?.forEach(visit)
    }
    visit(tree)
    if (headings.length < 3) return
    tree.children.unshift({ type: 'element', tagName: 'details', properties: { className: ['reading-outline'] }, children: [
      { type: 'element', tagName: 'summary', properties: {}, children: [{ type: 'text', value: `本页目录 · ${headings.length} 个章节` }] },
      { type: 'element', tagName: 'nav', properties: { ariaLabel: '文章目录' }, children: headings.map(heading => ({
        type: 'element', tagName: 'a', properties: { href: `#${heading.id}`, className: [heading.level === 'h3' ? 'is-subheading' : ''] }, children: [{ type: 'text', value: heading.title }],
      })) },
    ] })
  }
}
