<script setup>
defineProps({
  active: { type: String, default: '' },
});
</script>

<template>
  <header class="site-header">
    <a class="brand" href="/" aria-label="nymlc Projects 首页">
      <span class="brand-mark" aria-hidden="true">n.</span>
      <span class="brand-copy"><strong>nymlc</strong><small>PROJECTS</small></span>
    </a>
    <nav class="main-nav" aria-label="主导航">
      <a href="/">所有项目</a>
      <a v-if="active === 'finderx'" href="#features">功能</a>
      <a v-else href="/projects/finderx/">FinderX 介绍</a>
      <a
        class="nav-github"
        href="https://github.com/nymlc"
        target="_blank"
        rel="noreferrer"
      >GitHub <span aria-hidden="true">↗</span></a>
      <a
        class="nav-download"
        href="/projects/finderx/download.html"
      >获取 FinderX <span aria-hidden="true">→</span></a>
    </nav>
  </header>
</template>
