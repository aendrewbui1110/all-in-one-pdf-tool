import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: { port: 3002 },
  build: { outDir: 'dist' },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@components': resolve(__dirname, 'src/components'),
    },
  },
});
