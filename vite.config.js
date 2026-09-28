import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import localGamePlans from './scripts/local-game-plans.mjs'
import localPdfProxy from './scripts/local-pdf-proxy.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localGamePlans(), localPdfProxy()],
  server: {
    proxy: {
      '/api/ipapi': {
        target: 'https://ipapi.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ipapi/, ''),
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules[\\/]pdfjs-dist[\\/]/.test(id)) return 'pdf-viewer'
          if (/node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) return 'react-vendor'
        },
      }
    },
    chunkSizeWarningLimit: 1000,
    // 开启压缩
    minify: true,
  }
})
