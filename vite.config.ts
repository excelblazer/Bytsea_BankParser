import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }: { mode: string }) => {
    // Load env variables is kept for future use if needed
    // const env = loadEnv(mode, '.', '');
    
    // Get repository name for GitHub Pages by detecting repository name from package.json
    // This reads the name from package.json and removes any org prefix
    const pkgName = process.env.npm_package_name || 'bytsea-statement-parser';
    const repoName = pkgName.includes('/') ? pkgName.split('/')[1] : pkgName;
    
    return {
      base: mode === 'production' ? `/${repoName}/` : '/',
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
        rollupOptions: {
          output: {
            // Ensure asset paths are relative for better compatibility with different deployment environments
            assetFileNames: 'assets/[name].[hash].[ext]',
            chunkFileNames: 'assets/[name].[hash].js',
            entryFileNames: 'assets/[name].[hash].js'
          }
        }
      }
    };
});
