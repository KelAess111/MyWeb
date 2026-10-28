import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp,mkdir,writeFile,readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { command,inspect,publish } = require('../desktop/publisher.cjs')

test('release builds, commits and pushes only reviewed files; failed push is retryable', async () => {
  const folder = await mkdtemp(join(tmpdir(),'kel-release-test-'))
  const repo = join(folder,'repo'), bare = join(folder,'remote.git')
  await mkdir(repo)
  await command('git',['init','--bare',bare],folder)
  await command('git',['init','-b','main'],repo)
  const git = args => command('git',args,repo)
  await git(['config','user.name','Editor Test'])
  await git(['config','user.email','editor-test@example.invalid'])
  await git(['remote','add','origin','https://github.com/KelAess111/MyWeb.git'])
  // A repository-local push URL guarantees this test never contacts GitHub.
  await git(['config','remote.origin.pushurl',bare])
  await writeFile(join(repo,'.gitignore'),'*.local\n.env*\n')
  await mkdir(join(repo,'public/content'),{recursive:true})
  await writeFile(join(repo,'public/content/cards.json'),'[]\n')
  await git(['add','.'])
  await git(['commit','-m','initial'])
  await writeFile(join(repo,'public/content/cards.json'),'[1]\n')
  await writeFile(join(repo,'.env.local'),'PRIVATE_TEST_VALUE=never-upload\n')
  const plan = await inspect(repo)
  assert.deepEqual(plan.files,['public/content/cards.json'])
  let builds = 0
  const release = await publish(repo,'测试版本 1',plan.files,() => {},async () => { builds++ })
  assert.equal(builds,1)
  assert.equal(await command('git',['--git-dir',bare,'rev-parse','main'],folder),release.sha)
  assert.equal(await git(['show','HEAD:public/content/cards.json']),'[1]')
  assert.equal((await git(['ls-tree','-r','--name-only','HEAD'])).includes('.env.local'),false)
  assert.equal(JSON.parse(await readFile(join(repo,'public/content/site-version.json'),'utf8')).name,'测试版本 1')
  await writeFile(join(repo,'public/content/cards.json'),'[2]\n')
  const second = await inspect(repo)
  await git(['config','remote.origin.pushurl',join(folder,'missing.git')])
  await assert.rejects(publish(repo,'测试版本 2',second.files,() => {},async () => { builds++ }))
  const beforeRetry = await git(['rev-parse','HEAD'])
  await git(['config','remote.origin.pushurl',bare])
  const retry = await publish(repo,'测试版本 2',[],() => {},async () => { throw new Error('retry must not rebuild') })
  assert.equal(retry.sha,beforeRetry)
  assert.equal(await command('git',['--git-dir',bare,'rev-parse','main'],folder),beforeRetry)
  assert.equal(builds,2)
})
