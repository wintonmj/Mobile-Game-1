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
    alias: {
      '@': resolve(__dirname, 'src'),
      '@assets': resolve(__dirname, 'src/assets')
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
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    cssTarget: 'esnext',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
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
          if (id.includes('/src/scenes/')) {
            return 'scenes';
          }
          
          // Handle other dependencies
          if (id.includes('node_modules/')) {
            if (id.includes('phaser')) {
              return 'phaser';
            }
            return 'vendor';
          }
        }
      }
    },
    // Increase the warning limit for large chunks
    chunkSizeWarningLimit: 1500
  },
  base: './',
  assetsInclude: [
    // Image formats
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.gif',
    '**/*.svg',
    // Audio formats
    '**/*.mp3',
    '**/*.ogg',
    '**/*.wav',
    // Font formats
    '**/*.ttf',
    '**/*.woff',
    '**/*.woff2',
    // Tilemap formats
    '**/*.json',
    '**/*.tmx',
    '**/*.tsx'
  ],
  publicDir: 'public',
  optimizeDeps: {
    include: [
      'phaser',
      // Add other frequently used dependencies here
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  }
}); 