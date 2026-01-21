
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Quan trọng: Không sử dụng define để gán process.env thành {} 
  // vì nó sẽ phá vỡ shim chúng ta đã tạo trong index.html
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'utils': ['html2pdf.js', 'jszip', 'file-saver']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
