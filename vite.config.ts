import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // شيلنا كلمة swc من هنا
import path from 'path'

export default defineConfig({
  base: '/wafer-save-smart/', 
  plugins: [react()],
  server: {
    host: "::",
    port: 8080,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
