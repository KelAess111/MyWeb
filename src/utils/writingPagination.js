export function getEntryReaderSegments(entry) {
  if (!entry || entry.type !== 'entry') {
    return []
  }

  return entry.blocks.map((block, index) => ({
    id: block.id ?? `${entry.id}-segment-${index}`,
    type: block.type,
    text: block.text ?? '',
    items: Array.isArray(block.items) ? block.items : [],
    lines: Array.isArray(block.lines) ? block.lines : [],
  }))
}

export function getReaderMeta(entry, pages, pageIndex = 0) {
  return {
    entryId: entry?.id ?? null,
    title: entry?.title ?? '',
    pageIndex,
    pageCount: Array.isArray(pages) ? pages.length : 0,
    isFirstPage: pageIndex <= 0,
    isLastPage: pageIndex >= Math.max((Array.isArray(pages) ? pages.length : 0) - 1, 0),
  }
}

export function measureReaderPageHeight(container) {
  if (!container) {
    return 0
  }

  const styles = window.getComputedStyle(container)
  const paddingTop = Number.parseFloat(styles.paddingTop || '0')
  const paddingBottom = Number.parseFloat(styles.paddingBottom || '0')
  return container.clientHeight - paddingTop - paddingBottom
}

export function getEntrySiblingEntries(index, entryId) {
  const entry = index.byId.get(entryId) ?? null
  if (!entry?.parentId) {
    return []
  }

  const parent = index.byId.get(entry.parentId) ?? null
  if (!parent || parent.type !== 'folder') {
    return []
  }

  return parent.children.filter((child) => child.type === 'entry')
}

export function getReaderPageSegments(segments, maxSegmentsPerPage = 3) {
  const pages = []
  let currentPage = []

  segments.forEach((segment) => {
    currentPage.push(segment)

    if (currentPage.length >= maxSegmentsPerPage) {
      pages.push(currentPage)
      currentPage = []
    }
  })

  if (currentPage.length) {
    pages.push(currentPage)
  }

  return pages
}

function splitParagraphTextIntoUnits(text) {
  const normalizedText = String(text || '').trim()
  if (!normalizedText) {
    return []
  }

  const sentenceUnits = normalizedText.match(/[^。！？!?；;]+[。！？!?；;]?/g) || [normalizedText]
  const units = []

  sentenceUnits.forEach((sentence) => {
    const trimmedSentence = sentence.trim()
    if (!trimmedSentence) {
      return
    }

    if (trimmedSentence.length <= 80 || !/\s/.test(trimmedSentence)) {
      units.push(trimmedSentence)
      return
    }

    trimmedSentence.split(/(?<=\s)/).map((unit) => unit.trim()).filter(Boolean).forEach((unit) => units.push(unit))
  })

  return units.length ? units : [normalizedText]
}

function createPartialSegment(segment, text, partIndex) {
  return {
    ...segment,
    id: `${segment.id}-part-${partIndex}`,
    text,
  }
}

export function createMeasurementSegmentElement(documentRef, segment) {
  const wrapper = documentRef.createElement('div')
  wrapper.className = 'hidden-space-writing-reader-segment'

  if (segment.type === 'subheading') {
    const element = documentRef.createElement('h3')
    element.className = 'hidden-space-writing-reader-subheading'
    element.textContent = segment.text
    wrapper.appendChild(element)
  } else if (segment.type === 'quote') {
    const element = documentRef.createElement('blockquote')
    element.className = 'hidden-space-writing-reader-quote'
    element.textContent = segment.text
    wrapper.appendChild(element)
  } else if (segment.type === 'aside') {
    const element = documentRef.createElement('aside')
    element.className = 'hidden-space-writing-reader-aside'
    element.textContent = segment.text
    wrapper.appendChild(element)
  } else if (segment.type === 'list') {
    const list = documentRef.createElement('ul')
    list.className = 'hidden-space-writing-reader-list'
    segment.items.forEach((item) => {
      const li = documentRef.createElement('li')
      li.textContent = item
      list.appendChild(li)
    })
    wrapper.appendChild(list)
  } else if (segment.type === 'dialogue') {
    const dialogue = documentRef.createElement('div')
    dialogue.className = 'hidden-space-writing-reader-dialogue'
    segment.lines.forEach((line) => {
      const paragraph = documentRef.createElement('p')
      paragraph.innerHTML = ''
      const speaker = documentRef.createElement('strong')
      speaker.textContent = `${line.speaker || '角色'}：`
      paragraph.appendChild(speaker)
      paragraph.appendChild(documentRef.createTextNode(line.text || ''))
      dialogue.appendChild(paragraph)
    })
    wrapper.appendChild(dialogue)
  } else {
    const element = documentRef.createElement('p')
    element.className = 'hidden-space-writing-reader-paragraph'
    element.textContent = segment.text
    wrapper.appendChild(element)
  }

  return wrapper
}

function canFitSegment(measurementTarget, pageHeight, segment) {
  const node = createMeasurementSegmentElement(measurementTarget.ownerDocument, segment)
  measurementTarget.appendChild(node)
  const fits = measurementTarget.scrollHeight <= pageHeight
  measurementTarget.removeChild(node)
  return fits
}

function findLargestFittingParagraph(segment, measurementTarget, pageHeight) {
  const units = splitParagraphTextIntoUnits(segment.text)
  if (!units.length) {
    return null
  }

  let low = 1
  let high = units.length
  let best = 0

  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const candidate = createPartialSegment(segment, units.slice(0, middle).join(' '), 0)

    if (canFitSegment(measurementTarget, pageHeight, candidate)) {
      best = middle
      low = middle + 1
    } else {
      high = middle - 1
    }
  }

  if (!best) {
    return null
  }

  return {
    fitted: createPartialSegment(segment, units.slice(0, best).join(' '), 0),
    remainingText: units.slice(best).join(' '),
  }
}

function splitOversizedParagraph(segment, measurementTarget, pageHeight, partIndex) {
  const split = findLargestFittingParagraph(segment, measurementTarget, pageHeight)
  if (!split) {
    return null
  }

  return {
    fitted: {
      ...split.fitted,
      id: `${segment.id}-part-${partIndex}`,
    },
    remaining: split.remainingText
      ? {
          ...segment,
          id: `${segment.id}-part-${partIndex + 1}`,
          text: split.remainingText,
        }
      : null,
  }
}

export function paginateReaderSegments({ segments, pageHeight, measurementTarget }) {
  if (!segments.length) {
    return []
  }

  if (!pageHeight || !measurementTarget) {
    return getReaderPageSegments(segments, 3)
  }

  const pages = []
  let currentPage = []
  let pendingSegments = [...segments]
  let partIndex = 0

  const clearMeasurement = () => {
    measurementTarget.innerHTML = ''
  }

  const flushPage = () => {
    if (currentPage.length) {
      pages.push(currentPage)
      currentPage = []
    }
    clearMeasurement()
  }

  while (pendingSegments.length) {
    const segment = pendingSegments.shift()
    const node = createMeasurementSegmentElement(measurementTarget.ownerDocument, segment)
    measurementTarget.appendChild(node)
    const overflows = measurementTarget.scrollHeight > pageHeight

    if (!overflows) {
      currentPage.push(segment)
      continue
    }

    measurementTarget.removeChild(node)

    if (currentPage.length) {
      flushPage()
      pendingSegments.unshift(segment)
      continue
    }

    if (segment.type === 'paragraph' && segment.text) {
      const split = splitOversizedParagraph(segment, measurementTarget, pageHeight, partIndex)
      partIndex += 2

      if (split) {
        currentPage.push(split.fitted)
        flushPage()
        if (split.remaining) {
          pendingSegments.unshift(split.remaining)
        }
        continue
      }
    }

    // Keep non-splittable blocks readable rather than dropping them.
    currentPage.push(segment)
    flushPage()
  }

  flushPage()
  return pages.length ? pages : getReaderPageSegments(segments, 3)
}
