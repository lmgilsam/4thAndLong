import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' keeps asset paths relative so the build works on Vercel and in previews.
export default defineConfig({
  base: './',
  plugins: [react()],
})
