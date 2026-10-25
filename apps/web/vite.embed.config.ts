import { defineConfig } from 'vite';

// Library build for the website widget: apps/web/src/embed/index.ts becomes
// dist/embed/v1.js, with the livekit-client voice stack split into a lazy
// sibling chunk that only loads when a visitor starts voice.
export default defineConfig({
  build: {
    outDir: 'dist/embed',
    emptyOutDir: false,
    lib: {
      entry: 'src/embed/index.ts',
      formats: ['es'],
      fileName: () => 'v1.js',
    },
    rollupOptions: {
      output: {
        chunkFileNames: '[name]-[hash].js',
      },
    },
  },
});
