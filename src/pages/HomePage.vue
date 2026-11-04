<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import '../styles/home.css';

const scene = {
  name: '草原河流',
  note: '草原河流 · 顺水而行',
  line: '水声不急，草坡顺着河湾慢慢铺开。',
  src: '/assets/scenes/scene-grassland-river.webp',
  srcSm: '/assets/scenes/scene-grassland-river-sm.webp',
  alt: '俯瞰草原河流：蜿蜒的河湾、乡间土路、树林与牧场',
};

const hero = ref(null);
const poster = ref(null);
const canvas = ref(null);
const live = ref(false);
const offscreen = ref(false);
const ready = ref(false);

let observer;
let app = null;
let building = false;
let unmounted = false;
let cancelIdle = () => {};

// 实时场景在海报图出来、浏览器空下来之后才加载；海报先顶着，第一帧出来后画布淡入。
// 不等 window.load：字体样式表会把 load 拖得很晚
function whenIdle(fn) {
  const run = () => {
    if (unmounted) return;
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(fn, { timeout: 2000 });
      cancelIdle = () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(fn, 300);
      cancelIdle = () => clearTimeout(id);
    }
  };
  const img = poster.value;
  if (!img || img.complete) run();
  else {
    img.addEventListener('load', run, { once: true });
    img.addEventListener('error', run, { once: true });
  }
}

async function build() {
  if (building || app || unmounted || !canvas.value) return;
  building = true;
  try {
    const { createWindFields } = await import('../windfields/index.js');
    if (unmounted) return;
    app = createWindFields(canvas.value, {
      onFirstFrame: () => { live.value = true; },
      onLost: () => { live.value = false; },
    });
    if (!offscreen.value) app.start();
  } catch (error) {
    console.warn('[nymlc] 实时场景不可用，继续显示海报图', error);
    app = null;
  } finally {
    building = false;
  }
}

// 进入视口才建 / 才跑，离开就暂停
watch([ready, offscreen], () => {
  if (!ready.value) return;
  if (offscreen.value) app?.stop();
  else if (app) app.start();
  else build();
});

onMounted(() => {
  document.title = 'nymlc Projects — 小工具，认真做';
  document.body.classList.add('is-home');

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => {
      offscreen.value = !entry.isIntersecting;
    }, { threshold: 0.25 });
    observer.observe(hero.value);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData === true;
  if (!reduced && !saveData) whenIdle(() => { ready.value = true; });
});

onBeforeUnmount(() => {
  unmounted = true;
  cancelIdle();
  document.body.classList.remove('is-home');
  observer?.disconnect();
  app?.dispose();
  app = null;
});
</script>

<template>
  <div class="site-home">
    <header class="home-bar">
      <a class="brand" href="/" aria-label="nymlc Projects 首页">
        <span class="brand-mark" aria-hidden="true">n.</span>
        <span class="brand-copy"><strong>nymlc</strong><small>PROJECTS</small></span>
      </a>
      <a class="home-bar-link" href="#finderx">认识 FinderX <span aria-hidden="true">↗</span></a>
    </header>

    <main>
      <section ref="hero" class="scene-hero" aria-label="nymlc Projects">
        <div class="scene-stage" :class="{ 'is-live': live }">
          <img
            ref="poster"
            class="scene-poster"
            :src="scene.src"
            :srcset="`${scene.srcSm} 1000w, ${scene.src} 2000w`"
            sizes="(max-width: 900px) 100vw, 1360px"
            width="2000"
            height="1036"
            :alt="scene.alt"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          >
          <canvas ref="canvas" class="scene-canvas" aria-hidden="true"></canvas>
        </div>

        <div class="scene-caption">
          <h1>nymlc Projects</h1>
          <p class="scene-sub">把日常的小麻烦，做成顺手的独立应用。</p>
          <p class="scene-sub scene-sub-soft">{{ scene.line }}</p>
          <p class="scene-note">{{ scene.note }}</p>
          <a class="scene-cue" href="#projects">沿着田野，看看我做的应用 <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section id="projects" class="projects">
        <div class="projects-heading" v-reveal>
          <p class="section-eyebrow">PROJECTS</p>
          <h2>在这里，遇见下一件趁手的工具</h2>
          <p class="projects-lead">目前开放 1 个应用，更多正在生长。</p>
        </div>

        <article id="finderx" class="app-card" v-reveal="80">
          <div class="app-card-copy">
            <a class="app-head" href="/projects/finderx/">
              <img class="app-icon" src="/assets/finderx-icon.png" width="60" height="60" alt="FinderX 应用图标">
              <span><strong>FinderX</strong><small>MACOS · FINDER 效率增强</small></span>
            </a>
            <p class="app-desc">把最近记录、Finder 导航、AI 命名和局域网扫码传输，放到你已经习惯的 Finder 旁边。少一点来回切换，多一点顺手。</p>
            <div class="app-tags"><span>最近记录</span><span>Finder 导航</span><span>AI 命名</span><span>局域网扫码传输</span></div>
            <div class="app-actions">
              <a class="app-download" href="/projects/finderx/download.html"><span aria-hidden="true">↓</span> 下载 FinderX · macOS</a>
              <a class="app-more" href="/projects/finderx/">了解更多 <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <figure class="app-shot">
            <img
              src="/assets/finderx-real-history-settings.png"
              width="666"
              height="606"
              alt="FinderX 真实应用截图：最近文件夹与最近文件数量设置"
              loading="lazy"
            >
          </figure>
        </article>

        <div class="app-next" v-reveal="140">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 20v-8m0 3c-4.8 0-7-2.8-7-7 4.2 0 7 2.2 7 7Zm0-3c0-4.4 2.4-7 7-7 0 4.2-2.4 7-7 7Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>下一个应用，还在田里慢慢长</span>
        </div>
      </section>

      <footer id="about" class="home-foot">
        <span>nymlc Projects · 独立应用与工具 · {{ new Date().getFullYear() }}</span>
        <span class="home-foot-credit">
          田野场景基于
          <a href="https://github.com/cswfww123/wind-fields" target="_blank" rel="noreferrer">wind-fields</a>
          渲染 ·
          <a href="https://github.com/nymlc" target="_blank" rel="noreferrer">GitHub ↗</a>
        </span>
      </footer>
    </main>
  </div>
</template>
