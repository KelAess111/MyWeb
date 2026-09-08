import { supabase } from '../lib/supabase'

// ==================== 卡片管理 ====================

/**
 * 获取用户的所有卡片
 * @param {string} language - 'japanese' | 'english'
 * @returns {Promise<Array>}
 */
export async function getUserCards(language) {
  if (!supabase) {
    throw new Error('Supabase未配置')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('用户未登录')
  }

  const { data, error } = await supabase
    .from('anki_cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('language', language)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

/**
 * 创建新卡片
 * @param {Object} cardData
 * @returns {Promise<Object>}
 */
export async function createCard(cardData) {
  if (!supabase) {
    throw new Error('Supabase未配置')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('用户未登录')
  }

  const { data, error } = await supabase
    .from('anki_cards')
    .insert([{
      user_id: user.id,
      language: cardData.language,
      original_text: cardData.originalText,
      pronunciation: cardData.pronunciation || null,
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
 * 更新卡片
 * @param {string} cardId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateCard(cardId, updates) {
  if (!supabase) {
    throw new Error('Supabase未配置')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('用户未登录')
  }

  const { data, error } = await supabase
    .from('anki_cards')
    .update({
      original_text: updates.originalText,
      pronunciation: updates.pronunciation || null,
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
 * 删除卡片
 * @param {string} cardId
 * @returns {Promise<void>}
 */
export async function deleteCard(cardId) {
  if (!supabase) {
    throw new Error('Supabase未配置')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('用户未登录')
  }

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
 * 搜索卡片
 * @param {string} language
 * @param {string} searchTerm
 * @returns {Promise<Array>}
 */
export async function searchCards(language, searchTerm) {
  if (!supabase) {
    throw new Error('Supabase未配置')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('用户未登录')
  }

  const { data, error } = await supabase
    .from('anki_cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('language', language)
    .or(`original_text.ilike.%${searchTerm}%,translation.ilike.%${searchTerm}%`)

  if (error) {
    throw error
  }

  return data || []
}

// ==================== 练习记录 ====================

/**
 * 保存练习记录
 * @param {Object} sessionData
 * @returns {Promise<Object>}
 */
export async function savePracticeSession(sessionData) {
  if (!supabase) {
    throw new Error('Supabase未配置')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('用户未登录')
  }

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
  if (!supabase) {
    throw new Error('Supabase未配置')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('用户未登录')
  }

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
  if (!supabase) {
    throw new Error('Supabase未配置')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('用户未登录')
  }

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
  if (!supabase) {
    throw new Error('Supabase未配置')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('用户未登录')
  }

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
  if (!supabase) {
    throw new Error('Supabase未配置')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('用户未登录')
  }

  const { error } = await supabase
    .from('anki_wrong_cards')
    .delete()
    .eq('id', wrongCardId)
    .eq('user_id', user.id)

  if (error) {
    throw error
  }
}
