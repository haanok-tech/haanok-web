import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/categories': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/subcategories': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/product': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/order': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/api/client': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
