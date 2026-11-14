import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // relative base so it works on GitHub Pages, Vercel, or custom subpaths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
