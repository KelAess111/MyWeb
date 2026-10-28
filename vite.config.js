import publicSecretCheck from './scripts/check-public-content.mjs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import localGamePlans from './scripts/local-game-plans.mjs'
import localContent from './scripts/local-content.mjs'
import localPdfProxy from './scripts/local-pdf-proxy.mjs'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), localGamePlans(), localContent(), localPdfProxy(), publicSecretCheck()],
  // Never put author credentials in a production bundle, even when .env.local exists.
  define: command === 'build' ? {
    'import.meta.env.VITE_AUTHOR_EMAIL': JSON.stringify(''),
    'import.meta.env.VITE_AUTHOR_PASSWORD': JSON.stringify(''),
    'import.meta.env.VITE_EDIT_SECRET': JSON.stringify(''),
    'import.meta.env.VITE_EDIT_MODE': JSON.stringify('false'),
  } : {},
  server: {
    host: '127.0.0.1',
    watch: { ignored: ['**/Kel-Portfolio-Studio-*.exe', '**/desktop/dist/**'] },
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
}))
