import { createApp } from 'vue';
import './styles/main.css';
import HomePage from './pages/HomePage.vue';
import FinderXPage from './pages/FinderXPage.vue';
import DownloadPage from './pages/DownloadPage.vue';
import PrivacyPage from './pages/PrivacyPage.vue';
import { loadLatestFinderXRelease, FINDERX_RELEASES_URL } from './data/releases.js';

const pages = {
  home: HomePage,
  finderx: FinderXPage,
  download: DownloadPage,
  privacy: PrivacyPage,
};

const root = document.querySelector('#app');
const page = root?.dataset.page || 'home';
const app = createApp(pages[page] || HomePage);

app.directive('reveal', {
  mounted(element, binding) {
    const delay = Number(binding.value || 0);
    element.style.setProperty('--reveal-delay', `${Math.min(delay, 350)}ms`);

    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      element.classList.add('is-visible');
      return;
    }

    element.classList.add('reveal-ready');
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    observer.observe(element);
  },
});

app.mount(root);

if (document.querySelector('[data-release-summary]')) {
  loadLatestFinderXRelease()
    .then((release) => {
      const summary = release ? `${release.name || release.tag_name} · 已发布` : '首个公开版本准备中';
      document.querySelectorAll('[data-release-summary]').forEach((element) => {
        element.textContent = summary;
      });
    })
    .catch((error) => {
      console.warn('Unable to load FinderX release summary:', error);
      document.querySelectorAll('[data-release-summary]').forEach((element) => {
        element.innerHTML = `查看 <a href="${FINDERX_RELEASES_URL}" target="_blank" rel="noreferrer">GitHub Releases</a>`;
      });
    });
}
