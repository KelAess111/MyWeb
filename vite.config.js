import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
        manualChunks: {
          // 将大型库分离成独立的 chunk
          'pdf-viewer': ['pdfjs-dist'],
          'markdown': ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex'],
          'ui-libs': ['framer-motion', 'photoswipe'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // 开启压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true
      }
    }
  }
})
