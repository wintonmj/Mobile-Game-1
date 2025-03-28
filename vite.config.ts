import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    open: true,
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5175
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Phaser library goes into its own chunk
          if (id.includes('node_modules/phaser')) {
            return 'phaser';
          }
          
          // Split app code by module type
          if (id.includes('/src/models/')) {
            return 'models';
          }
          if (id.includes('/src/views/')) {
            return 'views';
          }
          if (id.includes('/src/controllers/')) {
            return 'controllers';
          }
          
          // Handle other dependencies
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        }
      }
    },
    // Increase the warning limit for Phaser which is a large library
    chunkSizeWarningLimit: 1500
  },
  base: './',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  publicDir: 'public',
}); 