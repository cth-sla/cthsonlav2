
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Đảm bảo process.env không gây lỗi ReferenceError trong trình duyệt
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'recharts', 'lucide-react'],
          'genai': ['@google/genai']
        }
      }
    }
  },
  server: {
    port: 3000
  }
});
