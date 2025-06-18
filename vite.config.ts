import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }: { mode: string }) => {
    const env = loadEnv(mode, '.', '');
    // Get repository name for GitHub Pages or use a default
    const repoName = 'ai-statement-parser';
    
    return {
      base: mode === 'production' ? `/${repoName}/` : '/',
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, '.'),
        }
      }
    };
});
