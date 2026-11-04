<script setup>
import { onMounted, ref } from 'vue';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

const repo = 'nymlc/nymlc.github.io';
const releasesUrl = `https://github.com/${repo}/releases`;
const release = ref(null);
const loading = ref(true);
const error = ref(false);

const releaseTitle = () => release.value?.name || release.value?.tag_name || '';
const asset = () => release.value?.assets?.find((item) => item.name.toLowerCase() === 'finderx.dmg');
const releaseDate = () => {
  const date = release.value?.published_at;
  return date ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date)) : '';
};
const assetSize = () => asset.value() ? `${(asset.value().size / (1024 * 1024)).toFixed(1)} MB` : '';

onMounted(async () => {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    const releases = await response.json();
    release.value = releases
      .filter((item) => !item.draft && !item.prerelease && item.tag_name.startsWith('finderx-v'))
      .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at))[0] || null;
    if (release.value?.published_at) release.value.formattedDate = releaseDate();
    document.querySelectorAll('[data-release-summary]').forEach((node) => {
      node.textContent = release.value ? `${releaseTitle()} · 已发布` : '首个公开版本准备中';
    });
  } catch (cause) {
    console.warn('Unable to load FinderX releases:', cause);
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <SiteHeader />
    <main class="download-page section-wrap">
      <a class="back-link" href="/projects/finderx/">← <span>返回 FinderX</span></a>
      <div class="page-heading" v-reveal>
        <p class="section-eyebrow">DOWNLOAD / 获取应用</p>
        <h1>下载 FinderX</h1>
        <p>获取正式发行版，并查看每个版本的更新说明。</p>
      </div>

      <section class="release-card" aria-live="polite" v-reveal>
        <div class="release-main">
          <img src="/assets/finderx-icon.png" alt="" class="release-icon">
          <div class="release-copy">
            <p>FinderX for macOS</p>
            <h2>{{ loading ? '正在检查最新版本…' : releaseTitle() || (error ? '暂时无法读取版本状态' : '首个公开版本准备中') }}</h2>
            <span v-if="asset()">{{ [release.formattedDate || releaseDate(), assetSize(), 'DMG'].filter(Boolean).join(' · ') }}</span>
            <span v-else-if="release">此版本暂未附加 FinderX.dmg</span>
            <span v-else>{{ error ? '可以前往 GitHub Releases 查看已发布版本。' : '公开安装包发布后会显示在这里。' }}</span>
          </div>
          <span class="release-badge"><i></i> 官方发布</span>
        </div>
        <div class="release-actions">
          <a v-if="asset()" class="button button-forest" :href="asset().browser_download_url">下载 FinderX.dmg <span>↓</span></a>
          <a v-else class="button button-forest" :href="releasesUrl" target="_blank" rel="noreferrer">{{ loading ? '正在检查版本' : '查看 GitHub Releases' }} <span>↗</span></a>
          <a class="button button-outline" :href="release?.html_url || releasesUrl" target="_blank" rel="noreferrer">查看版本说明 <span>↗</span></a>
        </div>
        <p class="release-note">{{ release?.body?.trim() ? release.body.trim().replace(/[#*_`]/g, '').slice(0, 260) : 'FinderX 应用源码与本介绍页分开管理；正式发行包会单独附在版本说明中。' }}</p>
      </section>

      <div class="download-columns">
        <section class="download-info" v-reveal>
          <div class="info-heading"><span>01</span><h2>系统要求</h2></div>
          <ul class="requirements-list">
            <li><span>操作系统</span><b>macOS 11 或更新版本</b></li>
            <li><span>芯片架构</span><b>Apple Silicon</b></li>
            <li><span>安装格式</span><b>DMG 磁盘映像</b></li>
          </ul>
          <p class="subtle-note">目前提供 Apple Silicon 版本；Intel Mac 暂不支持。</p>
        </section>
        <section class="download-info" v-reveal="80">
          <div class="info-heading"><span>02</span><h2>安装步骤</h2></div>
          <ol class="install-steps">
            <li><i>1</i><p>下载并打开 <b>FinderX.dmg</b>。</p></li>
            <li><i>2</i><p>将 FinderX 拖入 <b>Applications</b> 文件夹。</p></li>
            <li><i>3</i><p>首次启动时，按提示在系统设置中授权所需权限。</p></li>
          </ol>
        </section>
      </div>
      <section class="download-help" v-reveal>
        <div><span>?</span><div><b>遇到安装或权限问题？</b><p>先看看项目介绍与使用说明，也可以在 GitHub 提交反馈。</p></div></div>
        <a href="/projects/finderx/privacy.html">权限与数据说明 <span>→</span></a>
      </section>
    </main>
    <SiteFooter note="正式版本请只从此页面或 GitHub Releases 获取" />
  </div>
</template>
