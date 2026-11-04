<script setup>
defineProps({
  note: { type: String, default: '用心做点实用的东西' },
});
</script>

<template>
  <footer class="site-footer section-wrap">
    <a class="brand brand-footer" href="/">
      <span class="brand-mark" aria-hidden="true">n.</span>
      <span class="brand-copy"><strong>nymlc</strong><small>PROJECTS</small></span>
    </a>
    <span>{{ note }} <i aria-hidden="true">·</i> {{ new Date().getFullYear() }}</span>
    <a href="https://github.com/nymlc/nymlc.github.io/issues" target="_blank" rel="noreferrer">反馈与建议 ↗</a>
  </footer>
</template>
