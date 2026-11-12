<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import '../styles/home.css';
import { alpine, coast, island, river } from '../windfields/scenes.js';

const sceneOptions = [island, river, coast, alpine];
const sceneById = Object.fromEntries(sceneOptions.map((item) => [item.id, item]));
const selectedSceneId = ref('island');
const activeScene = computed(() => sceneById[selectedSceneId.value]);

const hero = ref(null);
const poster = ref(null);
const canvas = ref(null);
const live = ref(false);
const offscreen = ref(false);
const ready = ref(false);
const reducedMotion = ref(false);
const saveData = ref(false);
const manualPaused = ref(false);
const posterFailed = ref(false);
const webglFailed = ref(false);
const fallbackLabel = computed(() => {
  if (webglFailed.value) return '当前使用静态预览';
  if (reducedMotion.value) return '已尊重减少动态效果设置';
  if (saveData.value) return '已尊重省流量设置';
  if (posterFailed.value && !live.value) return '场景预览图片暂不可用';
  return '';
});

let observer;
let motionQuery;
let app = null;
let building = false;
let unmounted = false;
let cancelIdle = () => {};

function chooseScene(id) {
  if (!sceneById[id] || selectedSceneId.value === id) return;
  selectedSceneId.value = id;
  posterFailed.value = false;
  app?.applyScene(activeScene.value);
  if (offscreen.value || manualPaused.value || reducedMotion.value || saveData.value) live.value = false;
}

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
  if (building || app || unmounted || !canvas.value || reducedMotion.value || saveData.value || manualPaused.value) return;
  building = true;
  try {
    const { createWindFields } = await import('../windfields/index.js');
    if (unmounted) return;
    app = createWindFields(canvas.value, {
      scene: activeScene.value,
      onFirstFrame: () => {
        webglFailed.value = false;
        live.value = true;
      },
      onLost: () => {
        webglFailed.value = true;
        live.value = false;
      },
    });
    if (!offscreen.value && !reducedMotion.value && !saveData.value && !manualPaused.value) app.start();
  } catch (error) {
    console.warn('[nymlc] 实时场景不可用，继续显示海报图', error);
    app = null;
    webglFailed.value = true;
  } finally {
    building = false;
  }
}

// 进入视口才建 / 才跑，离开就暂停
watch([ready, offscreen, reducedMotion, saveData, manualPaused], () => {
  if (!ready.value) return;
  if (offscreen.value || reducedMotion.value || saveData.value || manualPaused.value) app?.stop();
  else if (app) {
    app.start();
    live.value = true;
  }
  else build();
});

function onMotionPreferenceChange(event) {
  reducedMotion.value = event.matches;
  if (event.matches) {
    app?.stop();
    live.value = false;
  } else if (!saveData.value) {
    whenIdle(() => { ready.value = true; });
  }
}

onMounted(() => {
  document.title = 'nymlc Projects — 小工具，认真做';
  document.body.classList.add('is-home');
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.value = motionQuery.matches;
  saveData.value = navigator.connection?.saveData === true;
  if ('addEventListener' in motionQuery) motionQuery.addEventListener('change', onMotionPreferenceChange);
  else motionQuery.addListener?.(onMotionPreferenceChange);

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => {
      offscreen.value = !entry.isIntersecting;
    }, { threshold: 0.25 });
    observer.observe(hero.value);
  }

  if (!reducedMotion.value && !saveData.value) whenIdle(() => { ready.value = true; });
});

onBeforeUnmount(() => {
  unmounted = true;
  cancelIdle();
  document.body.classList.remove('is-home');
  observer?.disconnect();
  if (motionQuery && 'removeEventListener' in motionQuery) motionQuery.removeEventListener('change', onMotionPreferenceChange);
  else motionQuery?.removeListener?.(onMotionPreferenceChange);
  app?.dispose();
  app = null;
});
</script>

<template>
  <div class="site-home">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <header class="home-bar">
      <a class="brand" href="/" aria-label="nymlc Projects 首页">
        <span class="brand-mark" aria-hidden="true">n.</span>
        <span class="brand-copy"><strong>nymlc</strong><small>PROJECTS</small></span>
      </a>
      <nav aria-label="页面导航">
        <a class="home-bar-link" href="#projects">浏览作品 <span aria-hidden="true">↓</span></a>
      </nav>
    </header>

    <main id="main-content" tabindex="-1">
      <section ref="hero" class="scene-hero" aria-label="nymlc Projects">
        <div class="scene-stage" :class="{ 'is-live': live }">
          <img
            ref="poster"
            class="scene-poster"
            :class="{ 'is-failed': posterFailed }"
            :key="activeScene.id"
            :src="activeScene.src"
            :srcset="`${activeScene.srcSm} 1000w, ${activeScene.src} 2000w`"
            sizes="(max-width: 680px) calc(100vw - 24px), (max-width: 900px) calc(100vw - 48px), (max-width: 1800px) 92vw, 1600px"
            width="2000"
            height="769"
            :alt="activeScene.alt"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            @error="posterFailed = true"
          >
          <canvas ref="canvas" class="scene-canvas" aria-hidden="true"></canvas>
        </div>

        <div class="scene-caption">
          <div class="scene-caption-copy">
            <h1>nymlc Projects</h1>
            <p class="scene-sub">
              把日常的小麻烦，做成顺手的独立应用。
              <span class="scene-sub-detail">{{ activeScene.line }}</span>
              <span v-if="fallbackLabel" class="scene-status">{{ fallbackLabel }}</span>
            </p>
          </div>
          <div class="scene-caption-meta">
            <span class="scene-switch-label">风景</span>
            <div class="scene-switch" role="group" aria-label="场景主题">
              <button
                v-for="item in sceneOptions"
                :key="item.id"
                type="button"
                :aria-pressed="selectedSceneId === item.id"
                @click="chooseScene(item.id)"
              >{{ item.name }}</button>
            </div>
            <button
              class="scene-motion-toggle"
              type="button"
              :aria-pressed="manualPaused"
              :aria-label="manualPaused ? '恢复场景动画' : '暂停场景动画'"
              @click="manualPaused = !manualPaused"
            >{{ manualPaused ? '播放动画' : '暂停动画' }}</button>
          </div>
        </div>
        <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {{ manualPaused ? `${activeScene.name}：场景动画已暂停` : (fallbackLabel ? `${activeScene.name}：${fallbackLabel}` : `${activeScene.name}场景正在播放`) }}
        </p>
      </section>

      <section id="projects" class="projects">
        <div class="projects-heading" v-reveal>
          <div>
            <p class="section-eyebrow">PROJECTS <span aria-hidden="true">/</span> 作品</p>
            <h2>为日常，做趁手的工具。</h2>
            <p class="projects-lead">目前开放 1 个应用，更多正在生长。</p>
          </div>
          <span class="projects-count" aria-label="共 1 个应用">01 <i aria-hidden="true">—</i> 01</span>
        </div>

        <article id="finderx" class="app-card" v-reveal="80">
          <div class="app-card-copy">
            <a class="app-head" href="/projects/finderx/">
              <img class="app-icon" src="/assets/finderx-icon.png" width="60" height="60" alt="FinderX 应用图标">
              <span><strong>FinderX</strong><small>MACOS · FINDER 效率增强</small></span>
            </a>
            <p class="app-desc">把最近记录、Finder 导航、AI 命名和局域网扫码传输，放到你已经习惯的 Finder 旁边。少一点来回切换，多一点顺手。</p>
            <div class="app-actions">
              <a class="app-download" href="/projects/finderx/#download"><span aria-hidden="true">↓</span> 获取 FinderX · macOS</a>
              <a class="app-more" href="/projects/finderx/">了解更多 <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <ul class="app-features" aria-label="FinderX 功能">
            <li>最近记录</li>
            <li>Finder 导航</li>
            <li>AI 命名</li>
            <li>局域网扫码传输</li>
          </ul>
        </article>

        <div class="app-next" v-reveal="140">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 20v-8m0 3c-4.8 0-7-2.8-7-7 4.2 0 7 2.2 7 7Zm0-3c0-4.4 2.4-7 7-7 0 4.2-2.4 7-7 7Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>下一个应用，还在慢慢生长</span>
        </div>
      </section>

      <footer id="about" class="home-foot">
        <span>nymlc Projects · 独立应用与工具 · {{ new Date().getFullYear() }}</span>
        <span class="home-foot-credit">
          实时场景基于
          <a href="https://github.com/cswfww123/wind-fields" target="_blank" rel="noreferrer">wind-fields</a>
          渲染 ·
          <a href="https://github.com/nymlc" target="_blank" rel="noreferrer">GitHub ↗</a>
        </span>
      </footer>
    </main>
  </div>
</template>
