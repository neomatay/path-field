/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 项目站点部署在 /path-field/ 子路径下
  base: '/path-field/',
  plugins: [
    react(),
    // 本地优先 PWA：离线可用 + 可安装到主屏幕（iOS 会清理未安装 PWA 的数据，见 ROADMAP 第 7 节）
    VitePWA({
      // 自动更新：新 SW 安装后立即接管（skipWaiting），下次打开就是新版本。
      // 之前用 'prompt' 但没做更新提示 UI，导致新版本永远不激活、用户一直看旧缓存。
      registerType: 'autoUpdate',
      manifest: {
        name: 'PATH Field',
        short_name: 'PATH',
        description: '理解训练、安排下一步、并在中断后重新开始的健身成长工具',
        theme_color: '#205a3e',
        background_color: '#f1e2b8',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
