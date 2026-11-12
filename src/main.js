import { createApp } from 'vue';
import './styles/main.css';
import HomePage from './pages/HomePage.vue';
import FinderXPage from './pages/FinderXPage.vue';
import PrivacyPage from './pages/PrivacyPage.vue';

const pages = {
  home: HomePage,
  finderx: FinderXPage,
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
    element._revealObserver = observer;
    observer.observe(element);
  },
  unmounted(element) {
    element._revealObserver?.disconnect();
    delete element._revealObserver;
  },
});

app.mount(root);
