import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // رجعنا النسخة اللي موجودة في ملفك
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // السطر اللي هيصلح الصفحة البيضاء
  base: '/wafer-save-smart/', 

  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
