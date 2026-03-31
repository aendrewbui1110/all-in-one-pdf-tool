export function mount() {
  const container = document.getElementById('page-pipeline');
  if (!container || container.dataset.mounted) return;
  container.dataset.mounted = 'true';

  container.innerHTML = `
    <div class="page-placeholder">
      <h2>Job Pipeline</h2>
      <p>Kanban board coming in Phase 2.</p>
    </div>
  `;
}

export function unmount() {}
