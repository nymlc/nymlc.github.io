<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

const features = [
  {
    number: '01 / FINDERX',
    icon: '⌂',
    tone: 'purple',
    title: '常用位置与最近记录',
    description: '从贴边工具栏或菜单栏入口，访问收藏、最近打开的文件夹与文件。历史列表和当前已打开位置分开呈现。',
    tags: ['收藏', '最近文件夹', '最近文件'],
  },
  {
    number: '02 / NAVIGATION',
    icon: '↔',
    tone: 'blue',
    title: 'Finder 导航',
    description: '在图标视图的行首、行尾继续使用方向键；支持跨行与 Shift 扩选，不可靠时交还 Finder 原生处理。',
    tags: ['方向键', '跨行移动', 'Shift 扩选'],
  },
  {
    number: '03 / LOCAL SHARE',
    icon: '⌁',
    tone: 'green',
    title: '局域网扫码传输',
    description: '从 FinderX 右键菜单创建临时二维码，另一台设备扫码即可下载。文件只在当前局域网设备间传输。',
    tags: ['Finder 右键', '临时链接', '扫码下载'],
  },
  {
    number: '04 / AI NAMING',
    icon: '✳',
    tone: 'orange',
    title: 'AI 文件命名',
    description: '在重命名或另存为时生成候选名称。你可以配置兼容服务、选择模型，并在发送前查看本次请求内容。',
    tags: ['你来配置', '发送前预览', '钥匙串保护'],
  },
];

const releaseUrl = 'https://github.com/nymlc/nymlc.github.io/releases';
</script>

<template>
  <div class="product-page">
    <SiteHeader active="finderx" />
    <main>
      <section class="product-hero">
        <div class="product-copy" v-reveal>
          <a class="back-link" href="/">← <span>nymlc Projects</span></a>
          <p class="product-kicker"><i></i> A BETTER FLOW FOR FINDER</p>
          <h1>文件切换，<br><em>不必绕远路。</em></h1>
          <p class="product-intro">常用位置、最近记录与快捷操作，就在 Finder 旁边。少一点窗口间的来回，多一点顺手。</p>
          <div class="hero-actions">
            <a class="button button-forest" href="/projects/finderx/download.html">获取 FinderX <span aria-hidden="true">↗</span></a>
            <a class="quiet-link" href="#features">探索功能 <span aria-hidden="true">↓</span></a>
          </div>
          <div class="product-platform"><span>macOS 11+</span><i></i><span>Apple Silicon</span><i></i><span>原生 macOS 应用</span></div>
        </div>
        <div class="product-visual" v-reveal="100">
          <div class="screenshot-glow"></div>
          <figure class="product-screenshot">
            <img src="/assets/finderx-real-history-settings.png" width="666" height="606" alt="FinderX 真实设置窗口，展示最近文件夹和最近文件数量配置">
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
            <span class="feature-icon" :class="`feature-icon-${feature.tone}`">{{ feature.icon }}</span>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
            <div class="tag-list"><span v-for="tag in feature.tags" :key="tag">{{ tag }}</span></div>
            <span class="feature-watermark" aria-hidden="true">{{ feature.number.slice(0, 2) }}</span>
          </article>
        </div>
      </section>

      <section class="privacy-band section-wrap" v-reveal>
        <span class="privacy-symbol" aria-hidden="true">⌑</span>
        <div><p class="section-eyebrow">TRANSPARENT BY DESIGN</p><h2>权限与数据，清楚、可控。</h2></div>
        <p>FinderX 的核心能力在本机运行。AI 命名由你主动触发；局域网分享也只在你创建分享时启动。</p>
        <a href="/projects/finderx/privacy.html">查看权限与数据说明 <span>→</span></a>
      </section>

      <section class="download-cta section-wrap" v-reveal>
        <img src="/assets/finderx-icon.png" alt="" class="cta-icon">
        <div><p class="section-eyebrow">FINDERX FOR MAC</p><h2>让 Finder 工作流更顺一点。</h2><p data-release-summary>首个公开版本准备中</p></div>
        <a class="button button-forest" href="/projects/finderx/download.html">查看下载 <span>→</span></a>
      </section>
    </main>
    <SiteFooter note="FinderX · 一个持续打磨的 macOS 工具" />
  </div>
</template>
