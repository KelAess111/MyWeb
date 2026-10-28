export const cardForms = card => [card.original_text, card.kanji_form].filter(Boolean).map(text => `${card.language}:${text.normalize('NFKC').trim().toLowerCase()}`)

export function uniqueNewCards(existing, incoming) {
  const known = new Set(existing.flatMap(cardForms))
  return incoming.filter(card => {
    const forms = cardForms(card)
    if (forms.some(form => known.has(form))) return false
    forms.forEach(form => known.add(form))
    return true
  })
}

// Simple rows: word | translation, or two spreadsheet columns.
// Detailed spreadsheet rows: original, pronunciation, kanji, POS, translation, note.
export function parseCardTsv(text, language) {
  if (!['english','japanese'].includes(language)) throw new Error('语言无效')
  const lines = text.split(/\r?\n/).filter(line => line.trim())
  if (!text.trim() || lines.length > 2000) throw new Error('每次请输入 1～2000 行')
  return lines.map((line,index) => {
    const cells = line.split(line.includes('\t') ? '\t' : '|').map(value => value.trim())
    let original_text, pronunciation = '', kanji_form = '', part_of_speech = '', translation, special_note = ''
    if (cells.length === 2) [original_text,translation] = cells
    else if (cells.length === 6 && line.includes('\t')) [original_text,pronunciation,kanji_form,part_of_speech,translation,special_note] = cells
    else throw new Error(`第 ${index + 1} 行格式不正确：请写“单词 | 中文意思”，或粘贴表格的 2 列／6 列。`)
    if (!original_text || !translation) throw new Error(`第 ${index + 1} 行缺少单词或中文意思。`)
    return { language,original_text,pronunciation,kanji_form,part_of_speech,translation,special_note }
  })
}
