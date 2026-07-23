import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',        // Node에서 브라우저 DOM 흉내 (컴포넌트 테스트용)
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
  },
})
