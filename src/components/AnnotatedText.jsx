import { useMemo, useState } from 'react'
import AnnotationTerm from './AnnotationTerm'

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildSegments(body, annotations) {
  if (!body) {
    return []
  }

  const sortedAnnotations = [...annotations]
    .filter((annotation) => annotation.term && annotation.content)
    .sort((left, right) => right.term.length - left.term.length)

  if (!sortedAnnotations.length) {
    return [body]
  }

  const matchQueue = sortedAnnotations.map((annotation, index) => ({
    ...annotation,
    internalId: annotation.id ?? `annotation-${index}`,
    occurrence: Number.isFinite(Number(annotation.occurrence)) ? Number(annotation.occurrence) : 1,
  }))

  const counters = new Map()
  const pattern = new RegExp(sortedAnnotations.map((annotation) => escapeRegExp(annotation.term)).join('|'), 'g')
  const segments = []
  let cursor = 0
  let match = pattern.exec(body)

  while (match) {
    const term = match[0]
    const nextCount = (counters.get(term) ?? 0) + 1
    counters.set(term, nextCount)

    const annotation = matchQueue.find((item) => item.term === term && item.occurrence === nextCount)

    if (!annotation) {
      match = pattern.exec(body)
      continue
    }

    if (match.index > cursor) {
      segments.push(body.slice(cursor, match.index))
    }

    segments.push({
      type: 'annotation',
      annotation,
    })

    cursor = match.index + term.length
    match = pattern.exec(body)
  }

  if (cursor < body.length) {
    segments.push(body.slice(cursor))
  }

  return segments.length ? segments : [body]
}

function AnnotatedText({ body, annotations = [], idPrefix = 'afterlight' }) {
  const [openAnnotationId, setOpenAnnotationId] = useState(null)

  const segments = useMemo(() => buildSegments(body, annotations), [annotations, body])

  if (!segments.length) {
    return null
  }

  return (
    <p className="annotated-text">
      {segments.map((segment, index) => {
        if (typeof segment === 'string') {
          return <span key={`${idPrefix}-text-${index}`}>{segment}</span>
        }

        const annotationId = `${idPrefix}-${segment.annotation.internalId}`
        return (
          <AnnotationTerm
            key={annotationId}
            id={annotationId}
            label={segment.annotation.term}
            title={segment.annotation.title ?? segment.annotation.term}
            content={segment.annotation.content}
            category={segment.annotation.category ?? 'meta'}
            isOpen={openAnnotationId === annotationId}
            onOpen={() => setOpenAnnotationId(annotationId)}
            onClose={() => setOpenAnnotationId(null)}
            onToggle={() => setOpenAnnotationId((currentId) => (currentId === annotationId ? null : annotationId))}
          />
        )
      })}
    </p>
  )
}

export default AnnotatedText
