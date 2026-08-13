/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Repo name on GitHub Pages — base must match "/<repo-name>/" in production.
const REPO_NAME = 'compras-sob-pressao'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.png'],
      manifest: {
        name: 'Receitas PPP01P',
        short_name: 'Receitas PPP01P',
        description:
          'Receitas vegetarianas adaptadas para a panela de pressão elétrica Philco PPP01P, com lista de compras automática.',
        theme_color: '#047857',
        background_color: '#0c0a09',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Recipe browsing/search is fully static — precache the app shell so
        // it works offline right after the first visit. Shopping-list sync
        // has no server to reach anyway (localStorage-only), so there's no
        // network request to intercept there.
        globPatterns: ['**/*.{js,css,html,png,svg}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}))
