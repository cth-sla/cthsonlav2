
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Thay vì gán bằng object trống {}, ta ánh xạ tới biến toàn cục để không làm hỏng shim trong index.html
    'process.env': 'window.process.env'
  },
  build: {
    // Vercel mặc định tìm thư mục 'dist' cho Vite projects
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'recharts-vendor': ['recharts'],
          'utils-vendor': ['html2pdf.js', 'jszip', 'file-saver']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
