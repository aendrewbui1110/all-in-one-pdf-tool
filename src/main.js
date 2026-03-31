import './style.css';
import './components/sidebar.css';
import * as store from './store.js';
import { registerPage, initRouter } from './router.js';
import { initSidebar } from './components/sidebar.js';

// Page modules
import * as documentsPage from './pages/documents/documents-page.js';

document.addEventListener('DOMContentLoaded', () => {
  // Add currentView to store
  store.set({ currentView: 'dashboard' });

  // Register pages
  registerPage('dashboard', {
    mount() {
      // Lazy-load dashboard
      import('./pages/dashboard/dashboard-page.js').then(m => m.mount());
    },
  });

  registerPage('documents', documentsPage);

  registerPage('clients', {
    mount() {
      import('./pages/clients/clients-page.js').then(m => m.mount());
    },
  });

  registerPage('pipeline', {
    mount() {
      import('./pages/pipeline/pipeline-page.js').then(m => m.mount());
    },
  });

  // Initialize shell
  initSidebar();
  initRouter();
});
