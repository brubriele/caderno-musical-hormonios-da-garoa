import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Caderno e Ensaios são duas entradas HTML independentes.
// A Vercel publica as duas páginas no diretório dist.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        ensaios: resolve(process.cwd(), 'ensaios.html'),
      },
    },
  },
})
