import * as store from './store.js';

const pages = {};
let currentPage = null;

export function registerPage(name, { mount, unmount }) {
  pages[name] = { mount, unmount, mounted: false };
}

export function navigate(viewName) {
  if (!pages[viewName]) {
    console.warn(`Unknown page: ${viewName}`);
    return;
  }

  if (currentPage === viewName) return;

  // Unmount current
  if (currentPage && pages[currentPage]) {
    const prevContainer = document.getElementById(`page-${currentPage}`);
    if (prevContainer) prevContainer.classList.remove('active');
    if (pages[currentPage].unmount) pages[currentPage].unmount();
  }

  // Update store and hash
  store.set({ currentView: viewName });
  if (location.hash !== `#/${viewName}`) {
    history.replaceState(null, '', `#/${viewName}`);
  }

  // Mount new
  currentPage = viewName;
  const container = document.getElementById(`page-${viewName}`);
  if (container) {
    // Small delay for CSS transition
    requestAnimationFrame(() => {
      container.classList.add('active');
    });
  }

  if (pages[viewName].mount && !pages[viewName].mounted) {
    pages[viewName].mount();
    pages[viewName].mounted = true;
  }

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === viewName);
  });
}

export function initRouter() {
  // Read initial hash
  const hash = location.hash.replace('#/', '') || 'dashboard';
  const initialView = pages[hash] ? hash : 'dashboard';

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    const view = location.hash.replace('#/', '') || 'dashboard';
    if (pages[view]) navigate(view);
  });

  // Navigate to initial view
  navigate(initialView);
}
