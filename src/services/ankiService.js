import { supabase } from '../lib/supabaseClient'

// 作者的用户ID（词库所有者）
const AUTHOR_USER_ID = '8dff792d-ceab-4299-9d0a-e984191fe29c'

// 检查是否为本地编辑模式
function isLocalEditMode() {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem('localEditMode') === 'true'
  } catch {
    return false
  }
}

// 获取当前用户（编辑模式下使用环境变量账号自动登录）
async function getCurrentUser() {
  if (isLocalEditMode()) {
    // 编辑模式下使用环境变量中的账号自动登录
    const authorEmail = import.meta.env.VITE_AUTHOR_EMAIL
    const authorPassword = import.meta.env.VITE_AUTHOR_PASSWORD

    if (authorEmail && authorPassword) {
      try {
        // 先检查是否已经登录
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email === authorEmail) {
          return user
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: authorEmail,
          password: authorPassword,
        })

        if (error) {
          throw new Error('编辑模式自动登录失败')
        }

        return data.user
      } catch {
        throw new Error('编辑模式认证失败')
      }
    }

    return { id: 'local-edit-mode', email: 'local@edit.mode' }
  }

  if (!supabase) {
    throw new Error('Supabase未配置')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('用户未登录')
  }

  return user
}

// ==================== 卡片管理 ====================

/**
 * 获取用户的所有卡片（所有用户读取作者的词库）
 * @param {string} language - 'japanese' | 'english'
 * @param {boolean} includeDiscarded - 是否包含弃置的卡片
 * @returns {Promise<Array>}
 */
export async function getUserCards(language, includeDiscarded = false) {
  // 所有用户都读取作者的词库
  let query = supabase
    .from('anki_cards')
    .select('*')
    .eq('user_id', AUTHOR_USER_ID)
    .eq('language', language)

  if (!includeDiscarded) {
    query = query.eq('is_discarded', false)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

/**
 * 创建新卡片（仅本地编辑模式）
 * @param {Object} cardData
 * @returns {Promise<Object>}
 */
export async function createCard(cardData) {
  if (!isLocalEditMode()) {
    throw new Error('只有本地编辑模式可以添加卡片')
  }

  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('anki_cards')
    .insert([{
      user_id: user.id,
      language: cardData.language,
      original_text: cardData.originalText,
      pronunciation: cardData.pronunciation || null,
      kanji_form: cardData.kanjiForm || null,
      part_of_speech: cardData.partOfSpeech || null,
      translation: cardData.translation,
      special_note: cardData.specialNote || null,
    }])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * 更新卡片（仅本地编辑模式）
 * @param {string} cardId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateCard(cardId, updates) {
  if (!isLocalEditMode()) {
    throw new Error('只有本地编辑模式可以更新卡片')
  }

  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('anki_cards')
    .update({
      original_text: updates.originalText,
      pronunciation: updates.pronunciation || null,
      kanji_form: updates.kanjiForm || null,
      part_of_speech: updates.partOfSpeech || null,
      translation: updates.translation,
      special_note: updates.specialNote || null,
    })
    .eq('id', cardId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * 删除卡片（仅本地编辑模式）
 * @param {string} cardId
 * @returns {Promise<void>}
 */
export async function deleteCard(cardId) {
  if (!isLocalEditMode()) {
    throw new Error('只有本地编辑模式可以删除卡片')
  }

  const user = await getCurrentUser()

  const { error } = await supabase
    .from('anki_cards')
    .delete()
    .eq('id', cardId)
    .eq('user_id', user.id)

  if (error) {
    throw error
  }
}

/**
 * 搜索卡片（所有用户搜索作者的词库）
 * @param {string} language
 * @param {string} searchTerm
 * @returns {Promise<Array>}
 */
export async function searchCards(language, searchTerm) {
  // 移除搜索词中的空格，用于更宽松的罗马音匹配
  const searchTermNoSpace = searchTerm.replace(/\s+/g, '')

  const { data, error } = await supabase
    .from('anki_cards')
    .select('*')
    .eq('user_id', AUTHOR_USER_ID)
    .eq('language', language)

  if (error) {
    throw error
  }

  // 在客户端进行过滤，支持更灵活的罗马音匹配
  const filtered = (data || []).filter(card => {
    const originalMatch = card.original_text?.toLowerCase().includes(searchTerm.toLowerCase())
    const translationMatch = card.translation?.toLowerCase().includes(searchTerm.toLowerCase())
    const kanjiMatch = card.kanji_form?.toLowerCase().includes(searchTerm.toLowerCase())

    // 罗马音匹配：移除空格后进行比较
    const pronunciationNoSpace = (card.pronunciation || '').replace(/\s+/g, '').toLowerCase()
    const pronunciationMatch = pronunciationNoSpace.includes(searchTermNoSpace.toLowerCase())

    return originalMatch || translationMatch || kanjiMatch || pronunciationMatch
  })

  return filtered
}

// ==================== 练习记录 ====================

/**
 * 保存练习记录
 * @param {Object} sessionData
 * @returns {Promise<Object>}
 */
export async function savePracticeSession(sessionData) {
  const user = await getCurrentUser()

  // 编辑模式下也允许保存练习记录
  const { data, error } = await supabase
    .from('anki_practice_sessions')
    .insert([{
      user_id: user.id,
      language: sessionData.language,
      correct_count: sessionData.correctCount,
      wrong_count: sessionData.wrongCount,
      max_combo: sessionData.maxCombo,
    }])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * 获取练习历史（最近114次）
 * @param {string} language
 * @returns {Promise<Array>}
 */
export async function getPracticeHistory(language) {
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('anki_practice_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('language', language)
    .order('created_at', { ascending: false })
    .limit(114)

  if (error) {
    throw error
  }

  return data || []
}

/**
 * 计算总正确率
 * @param {string} language
 * @returns {Promise<Object>}
 */
export async function getOverallStats(language) {
  const history = await getPracticeHistory(language)

  const totalCorrect = history.reduce((sum, session) => sum + session.correct_count, 0)
  const totalWrong = history.reduce((sum, session) => sum + session.wrong_count, 0)
  const total = totalCorrect + totalWrong
  const accuracy = total > 0 ? (totalCorrect / total) * 100 : 0

  return {
    totalCorrect,
    totalWrong,
    total,
    accuracy: Math.round(accuracy * 100) / 100,
    sessionCount: history.length,
  }
}

// ==================== 错题本管理 ====================

/**
 * 添加到错题本
 * @param {string} cardId
 * @param {string} language
 * @returns {Promise<void>}
 */
export async function addToWrongCards(cardId, language) {
  const user = await getCurrentUser()

  // 检查是否已存在
  const { data: existing } = await supabase
    .from('anki_wrong_cards')
    .select('id')
    .eq('user_id', user.id)
    .eq('card_id', cardId)
    .eq('language', language)
    .single()

  if (existing) {
    return
  }

  // 获取当前最大position
  const { data: wrongCards } = await supabase
    .from('anki_wrong_cards')
    .select('position')
    .eq('user_id', user.id)
    .eq('language', language)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = wrongCards && wrongCards.length > 0 ? wrongCards[0].position + 1 : 1

  // 检查是否超过50条，如果超过则删除最旧的
  const { data: allWrongCards } = await supabase
    .from('anki_wrong_cards')
    .select('id, position')
    .eq('user_id', user.id)
    .eq('language', language)
    .order('position', { ascending: true })

  if (allWrongCards && allWrongCards.length >= 50) {
    await supabase
      .from('anki_wrong_cards')
      .delete()
      .eq('id', allWrongCards[0].id)
  }

  // 插入新记录
  const { error } = await supabase
    .from('anki_wrong_cards')
    .insert([{
      user_id: user.id,
      card_id: cardId,
      language: language,
      position: nextPosition,
    }])

  if (error) {
    throw error
  }
}

/**
 * 获取错题本
 * @param {string} language
 * @returns {Promise<Array>}
 */
export async function getWrongCards(language) {
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('anki_wrong_cards')
    .select(`
      id,
      position,
      added_at,
      anki_cards (*)
    `)
    .eq('user_id', user.id)
    .eq('language', language)
    .order('position', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

/**
 * 从错题本移除
 * @param {string} wrongCardId
 * @returns {Promise<void>}
 */
export async function removeFromWrongCards(wrongCardId) {
  const user = await getCurrentUser()

  // 编辑模式下也允许移除错题
  const { error } = await supabase
    .from('anki_wrong_cards')
    .delete()
    .eq('id', wrongCardId)
    .eq('user_id', user.id)

  if (error) {
    throw error
  }
}

// ==================== 弃置卡片管理 ====================

/**
 * 弃置卡片（所有用户都可以操作作者的词库）
 * @param {string} cardId
 * @returns {Promise<void>}
 */
export async function discardCard(cardId) {
  const { error } = await supabase
    .from('anki_cards')
    .update({ is_discarded: true })
    .eq('id', cardId)
    .eq('user_id', AUTHOR_USER_ID)

  if (error) {
    throw error
  }
}

/**
 * 恢复弃置的卡片（所有用户都可以操作作者的词库）
 * @param {string} cardId
 * @returns {Promise<void>}
 */
export async function restoreCard(cardId) {
  const { error } = await supabase
    .from('anki_cards')
    .update({ is_discarded: false })
    .eq('id', cardId)
    .eq('user_id', AUTHOR_USER_ID)

  if (error) {
    throw error
  }
}

/**
 * 获取弃置的卡片（所有用户读取作者的词库）
 * @param {string} language
 * @returns {Promise<Array>}
 */
export async function getDiscardedCards(language) {
  const { data, error } = await supabase
    .from('anki_cards')
    .select('*')
    .eq('user_id', AUTHOR_USER_ID)
    .eq('language', language)
    .eq('is_discarded', true)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}
