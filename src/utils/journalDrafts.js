export const emptyAnnotation = () => ({
  id: `annotation-${crypto.randomUUID()}`,
  term: '',
  occurrence: 1,
  content: '',
})

export const emptyEntry = {
  title: '',
  entryDate: '',
  body: '',
  published: false,
  annotations: [emptyAnnotation()],
  attachments: [],
}

export function createEmptyJournalDraft() {
  return {
    ...emptyEntry,
    annotations: [emptyAnnotation()],
    attachments: [],
  }
}
