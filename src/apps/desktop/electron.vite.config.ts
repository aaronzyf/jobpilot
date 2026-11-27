import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** 领域包以源码形式被引用，避免额外的构建步骤 */
const coreSrc = resolve(process.cwd(), '../../packages/core/src')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@core': coreSrc } }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@core': coreSrc } }
  },
  renderer: {
    // 第二个入口给 SQL 日志窗口用，与主界面共用 preload 和样式令牌
    build: {
      rollupOptions: {
        input: {
          main: resolve(process.cwd(), 'src/renderer/index.html'),
          sqllog: resolve(process.cwd(), 'src/renderer/sqllog.html')
        }
      }
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(process.cwd(), 'src/renderer/src'),
        '@core': coreSrc
      }
    }
  }
})
