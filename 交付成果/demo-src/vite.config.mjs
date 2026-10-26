import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  plugins: [vue()],
  define: {'process.env.NODE_ENV': JSON.stringify('production')},
  build: {
    outDir: '../assets/demo',
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL('./main.js', import.meta.url)),
      name: 'ExportTradeDemo',
      formats: ['iife'],
      fileName: () => 'workspace.js',
      cssFileName: 'workspace'
    },
    sourcemap: false,
    reportCompressedSize: false
  }
});
