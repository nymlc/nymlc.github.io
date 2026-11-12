<script setup>
import { computed, onMounted, ref } from 'vue';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import { FINDERX_RELEASES_URL, loadLatestFinderXRelease } from '../data/releases.js';

const release = ref(null);
const releaseLoading = ref(true);
const releaseError = ref(false);
const releaseAsset = computed(() => release.value?.assets?.find((item) => item.name.toLowerCase() === 'finderx.dmg'));
const releaseHref = computed(() => releaseAsset.value?.browser_download_url || release.value?.html_url || FINDERX_RELEASES_URL);
const releaseLabel = computed(() => {
  if (releaseAsset.value) return '下载 FinderX.dmg';
  if (release.value) return '查看最新版本';
  return '前往 GitHub Releases';
});
const releaseSummary = computed(() => {
  if (releaseLoading.value) return '正在检查最新版本…';
  if (releaseAsset.value) return `${release.value.name || release.value.tag_name} · macOS 11+ · Apple Silicon`;
  if (release.value) return `${release.value.name || release.value.tag_name} · 安装包暂未附加`;
  if (releaseError.value) return '暂时无法读取版本状态 · 可前往 GitHub Releases';
  return 'macOS 11+ · Apple Silicon';
});

onMounted(async () => {
  try {
    release.value = await loadLatestFinderXRelease();
  } catch (error) {
    console.warn('Unable to load FinderX releases:', error);
    releaseError.value = true;
  } finally {
    releaseLoading.value = false;
  }
});

const features = [
  {
    number: '01 / FINDERX',
    icon: [
      'M12 7v5l3 2',
      'M12 3a9 9 0 1 0 9 9',
    ],
    tone: 'green',
    title: '常用位置与最近记录',
    description: '从贴边工具栏或菜单栏入口，访问收藏、最近打开的文件夹与文件。历史列表和当前已打开位置分开呈现。',
    tags: ['收藏', '最近文件夹', '最近文件'],
  },
  {
    number: '02 / NAVIGATION',
    icon: [
      'M10 6 4 12l6 6',
      'M4 12h16',
      'm14 6 6 6-6 6',
    ],
    tone: 'green',
    title: 'Finder 导航',
    description: '在图标视图的行首、行尾继续使用方向键；支持跨行与 Shift 扩选，不可靠时交还 Finder 原生处理。',
    tags: ['方向键', '跨行移动', 'Shift 扩选'],
  },
  {
    number: '03 / LOCAL SHARE',
    icon: [
      'M8.5 12h7',
      'M9.5 8.5h3a3.5 3.5 0 0 1 0 7h-3a3.5 3.5 0 0 1 0-7Z',
      'M14.5 8.5h-3a3.5 3.5 0 0 0 0 7h3a3.5 3.5 0 0 0 0-7Z',
    ],
    tone: 'green',
    title: '局域网扫码传输',
    description: '从 FinderX 右键菜单创建临时二维码，另一台设备扫码即可下载。文件只在当前局域网设备间传输。',
    tags: ['Finder 右键', '临时链接', '扫码下载'],
  },
  {
    number: '04 / AI NAMING',
    icon: [
      'm12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z',
      'm19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z',
    ],
    tone: 'green',
    title: 'AI 文件命名',
    description: '在重命名或另存为时生成候选名称。你可以配置兼容服务、选择模型，并在发送前查看本次请求内容。',
    tags: ['你来配置', '发送前预览', '钥匙串保护'],
  },
];
</script>

<template>
  <div class="product-page">
    <SiteHeader active="finderx" />
    <main id="main-content" tabindex="-1">
      <section class="product-hero">
        <div class="product-copy" v-reveal>
          <p class="product-kicker"><i></i> A BETTER FLOW FOR FINDER</p>
          <h1>文件切换，<br><em>不必绕远路。</em></h1>
          <p class="product-intro">常用位置、最近记录与快捷操作，就在 Finder 旁边。少一点窗口间的来回，多一点顺手。</p>
          <div class="hero-actions">
            <a class="button button-forest" href="#download">获取 FinderX <span aria-hidden="true">↓</span></a>
            <a class="quiet-link" href="#features">探索功能 <span aria-hidden="true">↓</span></a>
          </div>
          <div class="product-platform"><span>macOS 11+</span><i></i><span>Apple Silicon</span><i></i><span>原生 macOS 应用</span></div>
        </div>
        <div class="product-visual" v-reveal="100">
          <figure class="product-screenshot">
            <div class="screenshot-stage">
              <img
                src="/assets/finderx-real-history-settings.png"
                srcset="/assets/finderx-real-history-settings.png 1x, /assets/finderx-real-history-settings@2x.png 2x"
                width="620"
                height="560"
                alt="FinderX 完整设置窗口，展示侧边栏、功能入口和历史记录设置"
              >
            </div>
            <figcaption><span>真实应用截图</span><span>FINDERX / 历史记录</span></figcaption>
          </figure>
        </div>
      </section>

      <section id="features" class="feature-section section-wrap">
        <div class="section-heading" v-reveal>
          <div><p class="section-eyebrow">MADE FOR YOUR FLOW</p><h2>把常用操作，<br class="mobile-only">放近一点。</h2></div>
          <p class="section-aside">FinderX 不替代 Finder，<br>而是在你需要时给你一条更短的路径。</p>
        </div>
        <div class="feature-grid">
          <article v-for="(feature, index) in features" :key="feature.number" class="feature-card" v-reveal="index * 70">
            <span class="feature-number">{{ feature.number }}</span>
            <span class="feature-icon" :class="`feature-icon-${feature.tone}`" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  v-for="path in feature.icon"
                  :key="path"
                  :d="path"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
            <div class="tag-list"><span v-for="tag in feature.tags" :key="tag">{{ tag }}</span></div>
          </article>
        </div>
      </section>

      <section class="privacy-band section-wrap" v-reveal>
        <span class="privacy-symbol" aria-hidden="true">⌑</span>
        <div><p class="section-eyebrow">TRANSPARENT BY DESIGN</p><h2>权限与数据，清楚、可控。</h2></div>
        <p>FinderX 的核心能力在本机运行。AI 命名由你主动触发；局域网分享也只在你创建分享时启动。</p>
        <a href="/projects/finderx/privacy.html">查看权限与数据说明 <span>→</span></a>
      </section>

      <section id="download" class="download-cta section-wrap" v-reveal>
        <img src="/assets/finderx-icon.png" alt="" class="cta-icon">
        <div class="download-cta-copy">
          <p class="section-eyebrow">FINDERX FOR MAC</p>
          <h2>让 Finder 工作流更顺一点。</h2>
          <p aria-live="polite">{{ releaseSummary }}</p>
          <small>下载 DMG 后拖入 Applications；首次启动按提示授权。</small>
        </div>
        <div class="download-cta-actions">
          <a class="button button-forest" :href="releaseHref" :target="releaseAsset ? undefined : '_blank'" rel="noreferrer">
            {{ releaseLabel }} <span aria-hidden="true">{{ releaseAsset ? '↓' : '↗' }}</span>
          </a>
          <a class="download-release-link" :href="release?.html_url || FINDERX_RELEASES_URL" target="_blank" rel="noreferrer">
            版本说明 <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </main>
    <SiteFooter note="FinderX · 一个持续打磨的 macOS 工具" />
  </div>
</template>
