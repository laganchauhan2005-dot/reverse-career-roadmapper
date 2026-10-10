import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore - tailwindcss v4 plugin
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
