const { spawn } = require('node:child_process')
const { readFile, writeFile, unlink } = require('node:fs/promises')
const { join } = require('node:path')

function command(executable, args, cwd, onLog = () => {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, windowsHide: true, shell: false, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })
    let output = '', errors = ''
    child.stdout.on('data', data => { output += data; onLog(String(data)) })
    child.stderr.on('data', data => { errors = (errors + data).slice(-12000); onLog(String(data)) })
    const timer = setTimeout(() => { child.kill(); reject(new Error('操作超时，请检查网络后重试')) }, 240000)
    child.once('error', error => { clearTimeout(timer); reject(error) })
    child.once('exit', code => { clearTimeout(timer); code === 0 ? resolve(output.replace(/\r?\n$/, '')) : reject(new Error((errors || output).trim() || `操作失败 (${code})`)) })
  })
}

function publishable(file) {
  if (file.includes('\\') || file.split('/').some(part => !part || part === '..' || part.startsWith('.env') || ['node_modules','dist','.git','.claude'].includes(part))) return false
  if (/\.(env|local|log|exe|zip|pem|key|pfx)$/i.test(file) || (/(?:secret|credential|token)/i.test(file) && file !== 'src/data/secretRoom.js')) return false
  return /^(src|public|content|styles|api|scripts|docs|tests|desktop)\//.test(file) || /^(package(?:-lock)?\.json|vite\.config\.js|vercel\.json|index\.html|\.gitignore|README\.md)$/.test(file)
}

function parseStatus(output) {
  const parts = output.split('\0').filter(Boolean), result = []
  for (let i = 0; i < parts.length; i++) {
    const item = parts[i], status = item.slice(0, 2), path = item.slice(3)
    if (/[RC]/.test(status)) i++
    result.push({ status, path })
  }
  return result
}

async function inspect(root) {
  const git = args => command('git', args, root)
  const branch = await git(['symbolic-ref','--short','HEAD'])
  const remote = await git(['remote','get-url','origin'])
  if (!/^(https:\/\/github\.com\/KelAess111\/MyWeb(?:\.git)?|git@github\.com:KelAess111\/MyWeb(?:\.git)?)$/.test(remote)) throw new Error('项目 origin 与原网站仓库不匹配，请先检查仓库设置')
  const rows = parseStatus(await git(['status','--porcelain=v1','-z','--untracked-files=all']))
  const staged = rows.filter(row => row.status[0] !== ' ' && row.status !== '??')
  if (staged.length) throw new Error('项目已有暂存的更改，请先处理后再用应用发布，避免混入其他提交')
  const files = rows.filter(row => publishable(row.path)).map(row => row.path)
  return { branch, remote, files, skipped: rows.filter(row => !publishable(row.path)).map(row => row.path) }
}

async function publish(root, version, expectedFiles, onLog, build) {
  if (typeof version !== 'string' || !version.trim() || version.length > 80 || /[\r\n\x00-\x1f]/.test(version)) throw new Error('请输入 1～80 字的版本名称')
  const git = args => command('git', args, root, onLog)
  const pendingPath = join(root, '.kel-release.local')
  let pending
  try { pending = JSON.parse(await readFile(pendingPath, 'utf8')) } catch {}
  if (pending) {
    const head = await git(['rev-parse','HEAD'])
    const branch = await git(['symbolic-ref','--short','HEAD'])
    if (head !== pending.sha || branch !== pending.branch) throw new Error('上次上传失败后分支或提交发生变化，请先手动处理 .kel-release.local')
    onLog('重试上传上次已创建的提交…\n')
    await git(['push','origin',`HEAD:refs/heads/${branch}`])
    await unlink(pendingPath)
    return pending
  }
  const plan = await inspect(root)
  if (!plan.files.length) throw new Error('没有需要上传的网站变更')
  if (JSON.stringify([...plan.files].sort()) !== JSON.stringify([...expectedFiles].sort())) throw new Error('文件列表已变化，请重新打开发布面板检查')
  await writeFile(join(root,'public/content/site-version.json'), JSON.stringify({ name: version.trim(), createdAt: new Date().toISOString() }, null, 2) + '\n')
  onLog('正在构建并检查公开网站…\n')
  await build()
  const after = await inspect(root)
  const files = [...new Set([...plan.files, 'public/content/site-version.json'])]
  if (after.files.some(file => !files.includes(file))) throw new Error('构建期间出现其他改动，请重新检查变更清单')
  await git(['add','--',...files])
  await git(['commit','-m',`release: ${version.trim()}`,'--only','--',...files])
  pending = { sha: await git(['rev-parse','HEAD']), branch: plan.branch, version: version.trim() }
  await writeFile(pendingPath, JSON.stringify(pending))
  onLog('提交已创建，正在上传…\n')
  await git(['push','origin',`HEAD:refs/heads/${plan.branch}`])
  await unlink(pendingPath)
  return pending
}

module.exports = { command, publishable, parseStatus, inspect, publish }
