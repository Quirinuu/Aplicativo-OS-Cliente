import path from 'path';


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy para backend em desenvolvimento
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      }
    }
  },
  define: {
    // Variáveis de ambiente para o frontend
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:5000'),
    'import.meta.env.VITE_WS_URL': JSON.stringify('ws://localhost:5000'),
  }
});