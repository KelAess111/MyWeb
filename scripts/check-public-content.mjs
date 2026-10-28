import { readdir,readFile } from 'node:fs/promises'
import { resolve,join } from 'node:path'

export async function verifyPublicSecrets(directory, values) {
  const secrets = Object.entries(values).filter(([_key,value]) => typeof value === 'string' && value.length > 5)
  async function scan(folder) {
    for (const entry of await readdir(folder,{withFileTypes:true})) {
      const path=join(folder,entry.name)
      if(entry.isDirectory()) await scan(path)
      else if(/\.(js|json|html|css)$/.test(entry.name)) {
        const content=await readFile(path,'utf8')
        for(const [key,value] of secrets) if(content.includes(value)) throw new Error(`公开构建包含本地机密 (${key})，已停止发布。请移除硬编码值后重新构建。`)
      }
    }
  }
  await scan(directory)
}

export default function publicSecretCheck() {
  let config
  return {
    name:'kel-public-secret-check',apply:'build',
    configResolved(value) { config=value },
    async closeBundle() {
      await verifyPublicSecrets(resolve(config.root,config.build.outDir),{
        VITE_AUTHOR_PASSWORD:config.env.VITE_AUTHOR_PASSWORD,
        VITE_EDIT_SECRET:config.env.VITE_EDIT_SECRET,
      })
    },
  }
}
