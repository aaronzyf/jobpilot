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
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(process.cwd(), 'src/renderer/src'),
        '@core': coreSrc
      }
    }
  }
})
