import { supabase } from '../lib/supabaseClient'
import { requireLocalEditMode, saveLocalContent } from '../utils/editMode'
import { uniqueNewCards, cardForms } from '../utils/ankiImport'

const AUTHOR_USER_ID = '8dff792d-ceab-4299-9d0a-e984191fe29c'
const personalKey = name => `kel-anki:${name}`
function personal(name) { try { const value = JSON.parse(localStorage.getItem(personalKey(name)) || '[]'); return Array.isArray(value) ? value : [] } catch { return [] } }
function store(name, value) { localStorage.setItem(personalKey(name), JSON.stringify(value)) }

async function localCards() {
  const response = await fetch(`${import.meta.env.BASE_URL}content/anki-cards.json`, { cache: 'no-store' })
  if (!response.ok) throw new Error('网站词库文件加载失败，请刷新重试')
  const cards = await response.json()
  if (!Array.isArray(cards)) throw new Error('网站词库文件格式不正确')
  return cards
}

async function allCards(language) {
  const local = await localCards()
  let remote = []
  if (supabase) {
    try {
      for (let start = 0; ; start += 1000) {
        const { data, error } = await supabase.from('anki_cards').select('*').eq('user_id', AUTHOR_USER_ID).eq('language', language).order('id').range(start,start + 999).abortSignal(AbortSignal.timeout(8000))
        if (error) throw error
        remote.push(...(data || []))
        if (!data || data.length < 1000) break
      }
    } catch (error) {
      if (!local.some(card => card.language === language && !card.is_deleted)) throw error
      console.warn('云端旧词库暂时无法读取，已载入网站精选词库。')
    }
  }
  const merged = new Map(remote.map(card => [card.id,card]))
  // File overrides let the local editor update legacy cards without changing cloud data.
  for (const card of local.filter(card => card.language === language)) merged.set(card.id,card)
  const deleted = new Set(local.filter(card => card.is_deleted).flatMap(cardForms))
  const seen = new Set()
  return [...merged.values()].filter(card => {
    if (card.is_deleted) return false
    const forms = cardForms(card)
    if (forms.some(form => seen.has(form) || deleted.has(form))) return false
    forms.forEach(form => seen.add(form))
    return true
  })
}

export async function getUserCards(language, includeDiscarded = false) {
  const discarded = new Set(personal('discarded'))
  return (await allCards(language)).filter(card => includeDiscarded || !discarded.has(card.id))
}

function payload(input, language) {
  const card = {
    language: input.language || language,
    original_text: (input.originalText ?? input.original_text ?? '').trim(),
    pronunciation: input.pronunciation || '',
    kanji_form: input.kanjiForm ?? input.kanji_form ?? '',
    part_of_speech: input.partOfSpeech ?? input.part_of_speech ?? '',
    translation: (input.translation || '').trim(),
    special_note: input.specialNote ?? input.special_note ?? '',
    is_discarded: false,
  }
  if (!['english','japanese'].includes(card.language) || !card.original_text || !card.translation) throw new Error('语言、原文和中文释义必填')
  return card
}

export async function importCards(language, incoming) {
  requireLocalEditMode()
  const records = incoming.map(card => payload(card,language))
  const existing = await allCards(language)
  const fresh = uniqueNewCards(existing, records).map(card => ({ ...card, id: crypto.randomUUID(), created_at: new Date().toISOString() }))
  if (fresh.length) {
    const restoring = new Set(fresh.flatMap(cardForms))
    const local = (await localCards()).filter(card => !card.is_deleted || !cardForms(card).some(form => restoring.has(form)))
    await saveLocalContent('/api/local-anki-cards', [...local,...fresh])
  }
  return { added: fresh.length, skipped: records.length - fresh.length }
}

export async function createCard(input) {
  const result = await importCards(input.language,[input])
  if (!result.added) throw new Error('这个词已经在词库中，无需重复添加')
  return result
}

export async function updateCard(id, updates) {
  requireLocalEditMode()
  const local = await localCards()
  let old = local.find(card => card.id === id)
  if (!old && supabase) { const {data,error} = await supabase.from('anki_cards').select('*').eq('id',id).eq('user_id',AUTHOR_USER_ID).single(); if (error) throw error; old = data }
  if (!old) throw new Error('卡片不存在')
  const card = { ...old,...payload(updates,old.language),id }
  await saveLocalContent('/api/local-anki-cards',[...local.filter(item => item.id !== id),card])
  return card
}

export async function deleteCard(id) {
  requireLocalEditMode()
  const local = await localCards()
  let card = local.find(item => item.id === id)
  if (!card && supabase) { const {data,error} = await supabase.from('anki_cards').select('*').eq('id',id).eq('user_id',AUTHOR_USER_ID).single(); if (error) throw error; card = data }
  if (!card) throw new Error('卡片不存在')
  await saveLocalContent('/api/local-anki-cards',[...local.filter(item => item.id !== id),{ ...card,is_deleted:true }])
}

export async function searchCards(language, searchTerm) {
  const term = searchTerm.normalize('NFKC').replace(/\s/g,'').toLowerCase()
  return (await getUserCards(language,true)).filter(card => ['original_text','translation','kanji_form','pronunciation'].some(key => String(card[key] || '').normalize('NFKC').replace(/\s/g,'').toLowerCase().includes(term)))
}

// Practice actions only affect this browser, never the author's shared card records.
export async function discardCard(id) { store('discarded',[...new Set([...personal('discarded'),id])]) }
export async function restoreCard(id) { store('discarded',personal('discarded').filter(item => item !== id)) }
export async function getDiscardedCards(language) { const ids = new Set(personal('discarded')); return (await allCards(language)).filter(card => ids.has(card.id)) }

export async function savePracticeSession(data) {
  const record = { id:crypto.randomUUID(),language:data.language,correct_count:data.correctCount,wrong_count:data.wrongCount,max_combo:data.maxCombo,created_at:new Date().toISOString() }
  store('history',[record,...personal('history')].slice(0,228))
  return record
}
export async function getPracticeHistory(language) {
  const history = personal('history').filter(item => item.language === language)
  if (supabase) {
    try {
      const {data:{user}} = await supabase.auth.getUser()
      if (user) {
        const {data,error} = await supabase.from('anki_practice_sessions').select('*').eq('user_id',user.id).eq('language',language).order('created_at',{ascending:false}).limit(114).abortSignal(AbortSignal.timeout(8000))
        if (!error) history.push(...(data || []))
      }
    } catch { /* Preserve new local practice records when offline. */ }
  }
  return history.sort((a,b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0,114)
}
export async function getOverallStats(language) {
  const history = await getPracticeHistory(language)
  const totalCorrect = history.reduce((sum,item) => sum + item.correct_count,0), totalWrong = history.reduce((sum,item) => sum + item.wrong_count,0), total = totalCorrect + totalWrong
  return { totalCorrect,totalWrong,total,accuracy:total ? Math.round(totalCorrect / total * 10000) / 100 : 0,sessionCount:history.length }
}
export async function addToWrongCards(id,language) {
  const all = personal('wrong'), existing = all.filter(item => item.language === language)
  if (existing.some(item => item.card_id === id)) return
  const entry = { id:crypto.randomUUID(),card_id:id,language,added_at:new Date().toISOString(),position:Date.now() }
  store('wrong',[...all.filter(item => item.language !== language),...[entry,...existing].slice(0,50)])
}
export async function getWrongCards(language) {
  const cards = new Map((await allCards(language)).map(card => [card.id,card]))
  const local = personal('wrong').filter(item => item.language === language).map(item => ({ ...item,anki_cards:cards.get(item.card_id) })).filter(item => item.anki_cards)
  // Keep earlier signed-in cloud wrong cards visible; new practice records stay local.
  if (supabase) {
    try {
      const {data:{user}} = await supabase.auth.getUser()
      if (user) {
        const {data,error} = await supabase.from('anki_wrong_cards').select('id,position,added_at,anki_cards (*)').eq('user_id',user.id).eq('language',language).order('position',{ascending:false})
        if (!error) local.push(...(data || []).filter(item => item.anki_cards && !local.some(row => row.anki_cards.id === item.anki_cards.id)))
      }
    } catch { /* Local practice remains available offline. */ }
  }
  return local
}
export async function removeFromWrongCards(id) {
  const rows = personal('wrong')
  if (rows.some(item => item.id === id)) { store('wrong',rows.filter(item => item.id !== id)); return }
  if (supabase) {
    const {data:{user}} = await supabase.auth.getUser()
    if (!user) throw new Error('请登录后移除旧的云端错题')
    const {error} = await supabase.from('anki_wrong_cards').delete().eq('id',id).eq('user_id',user.id)
    if (error) throw error
  }
}
