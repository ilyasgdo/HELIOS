import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/cesium/Build/Cesium/Workers',
          dest: '/',
        },
        {
          src: 'node_modules/cesium/Build/Cesium/ThirdParty',
          dest: '/',
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Assets',
          dest: '/',
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Widgets',
          dest: '/',
        },
      ],
    }),
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify('/'),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
