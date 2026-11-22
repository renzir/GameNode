import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3420, proxy: { '/api': 'http://localhost:3421', '/static/games': 'http://localhost:3421/static/games' } },
})
