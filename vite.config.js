import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

const outDirs = { alpha: 'dist/alpha', dev: 'dist/dev' }

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [vue(), viteSingleFile()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  publicDir: 'public',
  build: {
    outDir: outDirs[mode] ?? 'dist',
    emptyOutDir: true,
  },
}))
