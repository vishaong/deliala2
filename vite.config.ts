import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/slack-proxy': {
        target: 'https://hooks.slack.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          // /api/slack-proxy/... 형태에서 실제 슬랙 경로 추출
          const match = path.match(/^\/api\/slack-proxy(\/.*)$/);
          if (match) {
            return match[1];
          }
          return path.replace('/api/slack-proxy', '');
        },
      },
    },
  },
})

