import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'wallet.png'],
      manifest: {
        name: 'FinTrack Pro',
        short_name: 'FinTrack',
        description: 'Personal Finance Tracker',
        theme_color: '#3b82f6',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'wallet.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'wallet.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        home: resolve(__dirname, 'home.html'),
        settings: resolve(__dirname, 'settings.html')
      }
    }
  }
});
