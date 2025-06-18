import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }: { mode: string }) => {
    // Load env variables is kept for future use if needed
    // const env = loadEnv(mode, '.', '');
    
    // For GitHub Pages deployment - using explicit repository name
    const isGitHubPages = process.env.GITHUB_PAGES === 'true';
    
    return {
      plugins: [react()],
      base: mode === 'production' || isGitHubPages ? `/Bytsea_BankParser/` : '/',
      define: {
        // We're not using environment variables for API keys anymore
        // as users provide their own keys through the UI
        'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
        'process.env.NODE_ENV': JSON.stringify(mode)
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: mode !== 'production',
        // Ensure index.html gets copied to the dist folder
        copyPublicDir: true,
        // Minify output for production builds
        minify: mode === 'production' ? 'esbuild' : false,
        rollupOptions: {
          input: resolve(__dirname, 'index.html'),
          output: {
            // Ensure asset paths are relative for better compatibility with different deployment environments
            assetFileNames: 'assets/[name].[hash].[ext]',
            chunkFileNames: 'assets/[name].[hash].js',
            entryFileNames: 'assets/[name].[hash].js',
            // Ensure large chunks are split
            manualChunks(id) {
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            }
          }
        },
        // Ensure HTML transformation works properly
        emptyOutDir: true
      }
    };
});
