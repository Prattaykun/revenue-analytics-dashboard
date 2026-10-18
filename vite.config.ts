import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base './' so the build works under https://prattaykun.github.io/revenue-analytics-dashboard/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
