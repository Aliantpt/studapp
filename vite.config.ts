import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// gh-pages отдаёт сайт из /studapp/, отсюда и base
export default defineConfig({
  base: '/studapp/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'StudApp — помощник студента',
        short_name: 'StudApp',
        description: 'Планер домашних заданий, расписание и учебный помощник',
        lang: 'ru',
        theme_color: '#4f46e5',
        background_color: '#f5f5fa',
        display: 'standalone',
        start_url: '/studapp/',
        scope: '/studapp/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
