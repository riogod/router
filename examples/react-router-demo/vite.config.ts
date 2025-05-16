import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@riogz/router': resolve(__dirname, '../../packages/router/dist/index.es.js'),
      '@riogz/router-plugin-browser': resolve(__dirname, '../../packages/router-plugin-browser/dist/index.es.js'),
    },
  },
})
