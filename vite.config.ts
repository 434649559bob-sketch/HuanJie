import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

const gitHash = execSync('git rev-parse --short HEAD').toString().trim();

export default defineConfig({
  plugins: [react()],
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
    cssMinify: 'esbuild',
  },
  css: {
    devSourcemap: true,
  },
});
