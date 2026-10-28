import { useId, useState } from 'react'
import { vocabularyPacks } from '../data/ankiVocabulary'
import { parseCardTsv, uniqueNewCards } from '../utils/ankiImport'
import { getUserCards, importCards } from '../services/ankiService'

export default function AnkiImportPanel({ language,onImported }) {
  const inputId = useId()
  const [text,setText] = useState(''), [preview,setPreview] = useState(null), [busy,setBusy] = useState(false), [message,setMessage] = useState('')
  const pack = vocabularyPacks[language]
  const sample = language === 'english' ? 'hesitate | 犹豫\ncurious | 好奇的' : 'めやす | 大致标准\nうっかり | 不留神'
  const inspect = async incoming => {
    setBusy(true); setPreview(null); setMessage('')
    try {
      const records = incoming || parseCardTsv(text,language)
      const existing = await getUserCards(language,true)
      const fresh = uniqueNewCards(existing,records)
      setPreview({ cards:fresh, total:records.length, skipped:records.length-fresh.length })
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  const save = async () => {
    if (!preview?.cards.length || busy) return
    setBusy(true)
    try {
      const result = await importCards(language,preview.cards)
      setMessage(`已保存到本地项目：新增 ${result.added} 词，跳过重复 ${preview.skipped + result.skipped} 词。重新练习即可使用；线上需要在 App 中“一键上传”后才会更新。`)
      setPreview(null); setText(''); await onImported()
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  return <details className="anki-batch-panel">
    <summary>为{language === 'english' ? '英语' : '日语'}添加新词 / 批量导入</summary>
    <p><strong>当前网站已内置{language === 'english' ? '英语' : '日语'}精选 {pack.length} 词，可以直接练习，无需导入。</strong></p>
    <p>这里只用来添加你自己的新词；不会替换原词库。请先在上方选择英语或日语，再粘贴对应的内容。</p>
    <label htmlFor={inputId}>① 粘贴新词：每行写“单词 | 中文意思”</label>
    <p>中间是英文竖线 |，不是字母 I。也可以从表格直接复制“单词、中文意思”两列，不要复制表头。</p>
    <textarea id={inputId} className="anki-form-textarea" rows={5} disabled={busy} value={text} onChange={event => { setText(event.target.value); setPreview(null); setMessage('') }} placeholder={sample} />
    <button type="button" className="anki-search-btn" disabled={busy} onClick={() => { setText(sample); setPreview(null); setMessage('已填入示例，可以照着改。示例尚未保存。') }}>填入示例</button>
    <button type="button" className="anki-search-btn" disabled={busy || !text.trim()} onClick={() => inspect()}>{busy ? '处理中…' : '② 检查格式和重复'}</button>
    <details className="anki-import-advanced">
      <summary>需要读音、词性和搭配？使用完整表格</summary>
      <p>表格按以下 6 列排列：原文、读音、汉字、词性、中文意思、备注。选中这 6 列的数据复制过来即可，空白列也要保留。英语“汉字”列留空；日语可填假名、罗马音和汉字。只有原文、中文意思必填。</p>
      <p>英文忽略大小写和全半角差异；日语按已有假名、汉字去重，粘贴内容自身的重复也会跳过。</p>
    </details>
    <details className="anki-import-advanced">
      <summary>补回缺失的内置精选词</summary>
      <p>只有你主动删除了内置词、想补回时才需要使用。它不会覆盖你修改过的同名词。练习中“弃置”的词请到“已弃置”里恢复。</p>
      <button type="button" className="anki-search-btn" disabled={busy} onClick={() => inspect(pack)}>检查精选 {pack.length} 词是否缺失</button>
    </details>
    {preview && <div className="anki-import-preview">
      <p role="status">共读取 {preview.total} 词：可新增 <strong>{preview.cards.length}</strong> 词，重复跳过 {preview.skipped} 词。</p>
      {preview.cards.length > 0 ? <>
        <p>下面预览前 8 词；检查无误后再保存。</p>
        <ul>{preview.cards.slice(0,8).map((card,index) => <li key={index}>{card.kanji_form || card.original_text}{card.pronunciation ? ` · ${card.pronunciation}` : ''} · {card.translation}</li>)}</ul>
        <button type="button" className="anki-add-btn" disabled={busy} onClick={save}>{busy ? '保存中…' : `③ 保存 ${preview.cards.length} 个新词到本地`}</button>
      </> : <p>这些词已经在词库里，无需再次导入。可以直接开始练习。</p>}
    </div>}
    {message && <p role="status">{message}</p>}
  </details>
}
