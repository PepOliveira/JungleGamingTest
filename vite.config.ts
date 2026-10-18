import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

const MOCK_ENTRIES = ['/src/mocks/browser.ts', '/src/mocks/controls.ts']

function preloadMockRuntime(): Plugin {
  return {
    name: 'kurio-preload-mock-runtime',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        const bundle = context.bundle
        if (!bundle) return html

        const chunks = Object.values(bundle).filter((item) => item.type === 'chunk')
        const byFile = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
        const files = new Set<string>()

        const visit = (fileName: string) => {
          if (files.has(fileName)) return
          files.add(fileName)
          byFile.get(fileName)?.imports.forEach(visit)
        }

        chunks
          .filter((chunk) => MOCK_ENTRIES.some((entry) => chunk.facadeModuleId?.endsWith(entry)))
          .forEach((chunk) => visit(chunk.fileName))

        return [...files].map((file) => ({
          tag: 'link',
          attrs: { rel: 'modulepreload', crossorigin: true, href: `/${file}` },
          injectTo: 'head',
        }))
      },
    },
  }
}

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    preloadMockRuntime(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
})
