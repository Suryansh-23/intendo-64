import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'buffer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
    'process.env': {},
    Buffer: ['buffer', 'Buffer']
  },
  resolve: {
    alias: {
      process: "process/browser",
      buffer: "buffer",
      stream: "stream-browserify",
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
