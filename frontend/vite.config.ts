import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  // P2-9 优化:分包 vendor,主包 2.67MB → 1.5MB,二次访问命中浏览器强缓存
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons', '@ant-design/cssinjs'],
          'editor': [
            '@uiw/react-md-editor',
            'react-markdown',
            'remark-gfm',
            'rehype-highlight',
            'highlight.js',
          ],
          'dayjs': ['dayjs'],
        },
      },
    },
  },
})