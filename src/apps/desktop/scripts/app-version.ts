import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * 版本号同步钩子。
 *
 * 唯一版本源是仓库根的 package.json。dev 启动和 build 都会触发 buildStart，
 * 把 version 写进渲染层的配置文件；UI 只读这份文件，不再硬编码版本号。
 */
const ROOT_PACKAGE = resolve(process.cwd(), '../../../package.json')
const OUTPUT = resolve(process.cwd(), 'src/renderer/src/generated/version.ts')

/** 生成文件内容。固定格式，方便对比后跳过无意义写入 */
function render(version: string): string {
  return `// 由构建钩子从 package.json 同步，请勿手改。\nexport const APP_VERSION = '${version}'\n`
}

export function appVersion(): Plugin {
  const sync = () => {
    const pkg = JSON.parse(readFileSync(ROOT_PACKAGE, 'utf8')) as { version?: string }
    if (!pkg.version) throw new Error(`[app-version] package.json 缺少 version: ${ROOT_PACKAGE}`)

    const next = render(pkg.version)
    try {
      if (readFileSync(OUTPUT, 'utf8') === next) return
    } catch {
      // 文件不存在，正常走下面的写入
    }
    writeFileSync(OUTPUT, next)
    console.log(`[app-version] ${pkg.version}`)
  }

  return {
    name: 'app-version',
    buildStart: sync
  }
}
