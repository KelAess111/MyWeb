const $ = id => document.getElementById(id)
let state, plan, uploading = false
function unwrap(result) { if (!result.ok) throw new Error(result.error); return result.data }
function show(info) {
  state = info
  $('project').textContent = info.root || '请选择项目文件夹'
  if (!info.url) { $('notice').textContent = info.error || '请选择项目'; return }
  $('website').src = info.url
  $('mode-label').textContent = info.mode === 'edit' ? '编辑模式 · 仅本机' : '预览模式 · 只读'
  $('toggle').textContent = info.mode === 'edit' ? '切换到预览' : '切换到编辑'
  $('notice').textContent = info.mode === 'edit' ? '编辑内容后请先保存，再切换预览或上传。游戏规划和新增词库保存在项目文件中。' : '正在预览访客看到的网站。已有云端日记、文章仍按原方式保存到云端。'
}
async function guard(fn) { try { await fn() } catch (error) { $('notice').textContent = error.message; if ($('publish-dialog').open) $('log').textContent += `\n${error.message}` } }
async function inspect() {
  plan = unwrap(await window.studio.inspect())
  $('destination').textContent = `上传到 ${plan.remote} · 分支 ${plan.branch}`
  $('files').textContent = plan.files.join('\n') || '没有待提交的网站变更；若上次上传失败，可直接重试。'
  $('skipped').textContent = plan.skipped.length ? `已排除：${plan.skipped.join('、')}` : ''
}
$('choose').onclick = () => guard(async () => show(unwrap(await window.studio.choose())))
$('toggle').onclick = () => guard(async () => show(unwrap(await window.studio.mode(state?.mode === 'edit' ? 'preview' : 'edit'))))
$('release').onclick = () => guard(async () => { await inspect(); $('log').textContent = ''; $('publish-dialog').showModal(); $('version').focus() })
$('close-dialog').onclick = () => { if (!uploading) $('publish-dialog').close() }
$('publish-dialog').querySelector('form').onsubmit = event => { event.preventDefault(); $('upload').click() }
$('refresh').onclick = () => guard(inspect)
$('upload').onclick = () => guard(async () => {
  if (!$('version').reportValidity() || uploading) return
  uploading = true
  for (const id of ['upload','refresh','close-dialog','choose','toggle','release']) $(id).disabled = true
  try {
    const result = unwrap(await window.studio.publish($('version').value, plan.files))
    $('log').textContent += `\n上传成功：${result.version}\n提交：${result.sha}\n若仓库已关联自动部署，托管平台会继续构建上线。`
    $('notice').textContent = '版本已提交并上传。托管平台是否部署成功，请查看原有部署平台。'
  } finally {
    uploading = false
    for (const id of ['upload','refresh','close-dialog','choose','toggle','release']) $(id).disabled = false
  }
})
$('publish-dialog').addEventListener('cancel', event => { if (uploading) event.preventDefault() })
window.studio.onLog(text => { $('log').textContent = ($('log').textContent + text).slice(-18000); $('log').scrollTop = $('log').scrollHeight })
guard(async () => show(unwrap(await window.studio.info())))
