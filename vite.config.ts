import { defineConfig } from 'vite'
import react from '@vitejs/react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // هذا هو السطر الأهم لحل مشكلة الصفحة البيضاء في GitHub Pages
  base: '/wafer-save-smart/', 
  
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
