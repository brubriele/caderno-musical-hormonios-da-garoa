import { defineConfig } from 'vite'

// O Caderno continua como página principal; Ensaios é um módulo multipágina.
// As rotas /api são compiladas pela Vercel como Functions.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        ensaios: 'ensaios.html'
      }
    }
  }
})
