import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/',
  plugins: [vue()],
  build: {
    // 草原河流场景（three + 着色器）是首页懒加载的单独 chunk，体积超过默认阈值是预期内的
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        home: 'index.html',
        finderx: 'projects/finderx/index.html',
        download: 'projects/finderx/download.html',
        privacy: 'projects/finderx/privacy.html',
      },
    },
  },
});
