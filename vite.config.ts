import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: false,
    },

    plugins: [
      react(),
    ],

    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },

    build: {
      target: 'es2022',
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code for better caching
            'react-vendor': ['react', 'react-dom'],
            'mapbox-vendor': ['mapbox-gl'],
            'icons-vendor': ['lucide-react'],
          },
        },
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'mapbox-gl', 'lucide-react'],
    },
  };
});
