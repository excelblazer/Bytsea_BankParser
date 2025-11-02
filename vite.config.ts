import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }: { mode: string }) => {
    // Load env variables is kept for future use if needed
    // const env = loadEnv(mode, '.', '');
    
    // For GitHub Pages deployment - check if using custom domain
    const isGitHubPages = process.env.GITHUB_PAGES === 'true';
    const hasCustomDomain = true; // Since we have CNAME file with app.bytsea.com
    
    return {
      plugins: [react()],
      base: mode === 'production' && isGitHubPages && !hasCustomDomain ? `/Bytsea_BankParser/` : '/',
      define: {
        // We're not using environment variables for API keys anymore
        // as users provide their own keys through the UI
        'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.VITE_OCR_API_URL': JSON.stringify(process.env.VITE_OCR_API_URL || '')
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, '.'),
          '@components': resolve(__dirname, './components'),
          '@config': resolve(__dirname, './config'),
          '@hooks': resolve(__dirname, './hooks'),
          '@services': resolve(__dirname, './services'),
          '@utils': resolve(__dirname, './utils'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: mode !== 'production',
        copyPublicDir: true,
        minify: mode === 'production' ? 'esbuild' : false,
        rollupOptions: {
          input: resolve(__dirname, 'index.html'),
          output: {
            assetFileNames: 'assets/[name].[hash].[ext]',
            chunkFileNames: 'assets/[name].[hash].js',
            entryFileNames: 'assets/[name].[hash].js',
            // Optimized code splitting
            manualChunks(id) {
              // Vendor chunks for better caching
              if (id.includes('node_modules')) {
                // Split large vendor libraries
                if (id.includes('@google/genai')) {
                  return 'vendor-gemini';
                }
                if (id.includes('tesseract.js')) {
                  return 'vendor-ocr';
                }
                if (id.includes('pdfjs-dist')) {
                  return 'vendor-pdf';
                }
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'vendor-react';
                }
                return 'vendor';
              }
              // Split config and utils for better caching
              if (id.includes('/config/')) {
                return 'config';
              }
              if (id.includes('/utils/')) {
                return 'utils';
              }
            }
          }
        },
        // Ensure HTML transformation works properly
        emptyOutDir: true,
        assetsInlineLimit: 0 // Ensure all CSS files like consolidated.css are emitted as separate files
      }
    };
});
