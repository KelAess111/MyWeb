import { supabase } from '../lib/supabase'

/**
 * Q&A 服务
 * 处理问答条目的 CRUD 操作
 */

/**
 * 获取所有已回答的问题（公开显示）
 * @returns {Promise<Array>} 问答列表
 */
export async function getAnsweredQuestions() {
  const { data, error } = await supabase
    .from('qa_entries')
    .select('*')
    .eq('status', 'answered')
    .order('display_order', { ascending: false })
    .order('answered_at', { ascending: false })

  if (error) {
    console.error('Error fetching Q&A:', error)
    return []
  }

  return data || []
}

/**
 * 提交新问题
 * @param {Object} questionData - 问题数据
 * @param {string} questionData.question - 问题内容
 * @param {string} [questionData.author_name] - 提问者名称（可选）
 * @param {string} [questionData.author_email] - 提问者邮箱（可选）
 * @returns {Promise<Object>} 创建结果
 */
export async function submitQuestion({ question, author_name = '匿名', author_email = '' }) {
  const { data, error } = await supabase
    .from('qa_entries')
    .insert([
      {
        question: question.trim(),
        author_name: author_name.trim() || '匿名',
        author_email: author_email.trim(),
        status: 'pending',
      },
    ])
    .select()

  if (error) {
    console.error('Error submitting question:', error)
    throw new Error('提交问题失败，请稍后再试')
  }

  return data?.[0]
}

/**
 * 获取所有问题（包括待回答的，仅管理员使用）
 * @returns {Promise<Array>} 所有问答列表
 */
export async function getAllQuestions() {
  const { data, error } = await supabase
    .from('qa_entries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all questions:', error)
    return []
  }

  return data || []
}

/**
 * 更新问答条目（仅管理员使用）
 * @param {string} id - 问答条目 ID
 * @param {Object} updates - 更新内容
 * @returns {Promise<Object>} 更新结果
 */
export async function updateQuestion(id, updates) {
  // 如果状态改为 answered，自动设置 answered_at
  if (updates.status === 'answered' && updates.answer) {
    updates.answered_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('qa_entries')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating question:', error)
    throw new Error('更新失败')
  }

  return data?.[0]
}

/**
 * 删除问答条目（仅管理员使用）
 * @param {string} id - 问答条目 ID
 * @returns {Promise<boolean>} 删除是否成功
 */
export async function deleteQuestion(id) {
  const { error } = await supabase.from('qa_entries').delete().eq('id', id)

  if (error) {
    console.error('Error deleting question:', error)
    throw new Error('删除失败')
  }

  return true
}
