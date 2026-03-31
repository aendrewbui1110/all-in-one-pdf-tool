import * as store from '../store.js';
import { navigate } from '../router.js';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="10" y1="4" x2="10" y2="20"/></svg>`,
  },
];

export function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const collapsed = localStorage.getItem('psp-sidebar-collapsed') === 'true';

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <img src="/logo.svg" alt="PSP" class="sidebar-logo" />
      <span class="sidebar-title">Perth Steel Patios</span>
    </div>
    <nav class="sidebar-nav">
      ${NAV_ITEMS.map(item => `
        <button class="nav-item" data-page="${item.id}" title="${item.label}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <button class="nav-item sidebar-toggle" title="Toggle sidebar">
        <span class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
        </span>
        <span class="nav-label">Collapse</span>
      </button>
      <span class="sidebar-version">v2.0</span>
    </div>
  `;

  // Nav click handlers
  sidebar.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Collapse toggle
  const toggle = sidebar.querySelector('.sidebar-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const shell = document.getElementById('app-shell');
      shell.classList.toggle('sidebar-collapsed');
      const isCollapsed = shell.classList.contains('sidebar-collapsed');
      localStorage.setItem('psp-sidebar-collapsed', isCollapsed);
    });
  }

  // Restore collapsed state
  if (collapsed) {
    document.getElementById('app-shell').classList.add('sidebar-collapsed');
  }
}
