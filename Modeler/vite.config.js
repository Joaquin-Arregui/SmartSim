// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: { port: 9000 },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        modelerResource: resolve(__dirname, 'modelerResource.html')
        // si tienes otro html, añádelo aquí como otra entrada
        // modelerOther: resolve(__dirname, 'modelerOther.html')
      }
    }
  }
});
