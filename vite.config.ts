import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

const PRELOAD_FONTS = [/fraunces-latin-opsz-normal-[\w-]+\.woff2$/, /source-sans-3-latin-wght-normal-[\w-]+\.woff2$/]

function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter((file) => PRELOAD_FONTS.some((pattern) => pattern.test(file)))
        return files.map((file) => ({
          tag: 'link',
          attrs: { rel: 'preload', href: `/${file}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head-prepend',
        }))
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), preloadFonts()],
})