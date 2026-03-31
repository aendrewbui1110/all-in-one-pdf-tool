import './dashboard.css';
import { navigate } from '../../router.js';
import { renderOrbital } from './widgets/orbital-command.js';

/* ═══════════════════════════════════════════════════
   Mock Data — realistic Perth Steel Patios scenarios
   ═══════════════════════════════════════════════════ */

const STAGES = {
  new_leads:  { label: 'New Leads',  color: '#3B82F6' },
  quoting:    { label: 'Quoting',    color: '#F7941D' },
  accepted:   { label: 'Accepted',   color: '#22C55E' },
  council:    { label: 'Council',    color: '#8B5CF6' },
  scheduled:  { label: 'Scheduled',  color: '#06B6D4' },
  building:   { label: 'Building',   color: '#EAB308' },
  closing:    { label: 'Closing',    color: '#10B981' },
};

const MOCK_JOBS = [
  { client: 'James Wilson',   style: 'Skillion',     stage: 'council',   subStage: 'Waiting on Council',  value: 12500, daysInStage: 8 },
  { client: 'Sarah Chen',     style: 'Gable',        stage: 'quoting',   subStage: 'Quote Sent',          value: 9800,  daysInStage: 3 },
  { client: 'Mike Thompson',  style: 'Flat',         stage: 'building',  subStage: 'In Progress',         value: 15200, daysInStage: 2 },
  { client: 'Lisa Park',      style: 'Dutch Gable',  stage: 'accepted',  subStage: 'Deposit Received',    value: 11000, daysInStage: 1 },
  { client: 'David Brown',    style: 'Carport',      stage: 'new_leads', subStage: 'First Contact',       value: 7500,  daysInStage: 0 },
  { client: 'Karen Mitchell', style: 'Skillion',     stage: 'scheduled', subStage: 'Install Next Week',   value: 13400, daysInStage: 4 },
  { client: 'Tom Nguyen',     style: 'Gable',        stage: 'closing',   subStage: 'Final Invoice Sent',  value: 10200, daysInStage: 1 },
  { client: 'Rachel Adams',   style: 'Flat',         stage: 'new_leads', subStage: 'Marketplace Enquiry', value: 8900,  daysInStage: 0 },
];

const MOCK_PIPELINE = {
  new_leads: 2,
  quoting:   1,
  accepted:  1,
  council:   1,
  scheduled: 1,
  building:  1,
  closing:   1,
};

const MOCK_TASKS = [
  { type: 'call',     desc: 'Follow up on quote',               client: 'Sarah Chen',     date: 'Tomorrow',  urgent: false },
  { type: 'council',  desc: 'Council approval expected',         client: 'James Wilson',   date: 'Wed 2 Apr', urgent: true },
  { type: 'install',  desc: 'Scheduled installation',            client: 'Karen Mitchell', date: 'Mon 7 Apr', urgent: false },
  { type: 'call',     desc: 'Chase deposit payment',             client: 'Lisa Park',      date: 'Thu 3 Apr', urgent: false },
  { type: 'invoice',  desc: 'Send final invoice',                client: 'Tom Nguyen',     date: 'Today',     urgent: true },
  { type: 'site',     desc: 'Site inspection booked',            client: 'Rachel Adams',   date: 'Fri 4 Apr', urgent: false },
];

const MOCK_ACTIVITY = [
  { type: 'document_created', desc: 'Quote <strong>PSP-Q-0014</strong> created for Sarah Chen',         time: '2 hours ago',  color: '#F7941D' },
  { type: 'client_added',     desc: 'New client <strong>Rachel Adams</strong> added from Marketplace',  time: '3 hours ago',  color: '#3B82F6' },
  { type: 'quote_sent',       desc: 'Quote emailed to <strong>David Brown</strong>',                    time: '5 hours ago',  color: '#22C55E' },
  { type: 'deposit_received', desc: 'Deposit received from <strong>Lisa Park</strong> - $3,300',        time: 'Yesterday',    color: '#10B981' },
  { type: 'council_submitted',desc: 'Council application lodged for <strong>James Wilson</strong>',     time: 'Yesterday',    color: '#8B5CF6' },
  { type: 'document_created', desc: 'Contract <strong>PSP-C-0012</strong> signed by Karen Mitchell',    time: '2 days ago',   color: '#06B6D4' },
  { type: 'job_completed',    desc: 'Installation completed for <strong>Greg Foster</strong>',          time: '3 days ago',   color: '#EAB308' },
  { type: 'payment_received', desc: 'Final payment received from <strong>Amy Zhang</strong> - $11,400', time: '4 days ago',   color: '#10B981' },
];

/* ═══ Helpers ═══ */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function currency(n) {
  return '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function totalPipelineValue() {
  return MOCK_JOBS.reduce((sum, j) => sum + j.value, 0);
}

function daysLabel(d) {
  if (d === 0) return 'Today';
  if (d === 1) return '1 day';
  return d + ' days';
}

function daysClass(d) {
  if (d >= 7) return 'job-days-danger';
  if (d >= 4) return 'job-days-warn';
  return '';
}

/* ═══ SVG Icons ═══ */

const ICONS = {
  pipeline: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="10" y1="4" x2="10" y2="20"/></svg>',
  quote: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
  client: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  jobs: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  tasks: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  activity: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  call: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  council: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>',
  install: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  invoice: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  site: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
};

const TASK_COLORS = {
  call:    '#3B82F6',
  council: '#8B5CF6',
  install: '#06B6D4',
  invoice: '#EAB308',
  site:    '#22C55E',
};

/* ═══ Renderers ═══ */

function renderWelcome() {
  const activeJobs = MOCK_JOBS.length;
  return `
    <section class="dash-welcome dash-card">
      <div class="dash-welcome-left">
        <h2 class="dash-welcome-greeting">${getGreeting()}, <span>Andrew</span></h2>
        <p class="dash-welcome-date">${formatDate()}</p>
      </div>
      <div class="dash-welcome-right">
        <span class="dash-welcome-stat">Active Jobs <strong>${activeJobs}</strong></span>
        <span class="dash-welcome-stat">Pipeline Value <strong>${currency(totalPipelineValue())}</strong></span>
      </div>
    </section>
  `;
}

function renderPipeline() {
  const total = Object.values(MOCK_PIPELINE).reduce((a, b) => a + b, 0);
  const segments = Object.entries(STAGES).map(([key, s]) => {
    const count = MOCK_PIPELINE[key] || 0;
    if (count === 0) return '';
    const pct = (count / total) * 100;
    return `
      <div class="pipeline-segment" style="flex:${pct};background:${s.color}" title="${s.label}: ${count}">
        <div class="pipeline-segment-inner">
          <span class="pipeline-segment-count">${count}</span>
          <span class="pipeline-segment-label">${s.label}</span>
        </div>
      </div>
    `;
  }).join('');

  const legend = Object.entries(STAGES).map(([key, s]) => {
    const count = MOCK_PIPELINE[key] || 0;
    return `
      <span class="pipeline-legend-item">
        <span class="pipeline-legend-dot" style="background:${s.color}"></span>
        ${s.label} <span class="pipeline-legend-count">${count}</span>
      </span>
    `;
  }).join('');

  return `
    <section class="dash-pipeline dash-card">
      <div class="pipeline-header">
        <h3 class="dash-card-title">${ICONS.pipeline} Pipeline</h3>
        <div>
          <span class="pipeline-total-label">Total Pipeline Value</span>
          <span class="pipeline-total">${currency(totalPipelineValue())}</span>
        </div>
      </div>
      <div class="pipeline-bar-wrap">${segments}</div>
      <div class="pipeline-legend">${legend}</div>
    </section>
  `;
}

function renderQuickActions() {
  return `
    <section class="dash-actions dash-card">
      <h3 class="dash-card-title">${ICONS.tasks} Quick Actions</h3>
      <div class="dash-actions-grid">
        <button class="dash-action-btn" data-action="new-quote">
          <div class="dash-action-icon">${ICONS.quote}</div>
          <span class="dash-action-label">New Quote</span>
          <span class="dash-action-sub">Create document</span>
        </button>
        <button class="dash-action-btn" data-action="new-client">
          <div class="dash-action-icon">${ICONS.client}</div>
          <span class="dash-action-label">New Client</span>
          <span class="dash-action-sub">Add to database</span>
        </button>
      </div>
    </section>
  `;
}

function renderActivityFeed() {
  const items = MOCK_ACTIVITY.map(a => `
    <li class="activity-item">
      <div class="activity-dot-wrap">
        <span class="activity-dot" style="color:${a.color};background:${a.color}"></span>
        <span class="activity-line"></span>
      </div>
      <div class="activity-body">
        <p class="activity-desc">${a.desc}</p>
        <span class="activity-time">${a.time}</span>
      </div>
    </li>
  `).join('');

  return `
    <section class="dash-activity dash-card">
      <h3 class="dash-card-title">${ICONS.activity} Recent Activity</h3>
      <ul class="activity-list">${items}</ul>
    </section>
  `;
}

function renderActiveJobs() {
  const cards = MOCK_JOBS.map(j => {
    const s = STAGES[j.stage];
    const dc = daysClass(j.daysInStage);
    return `
      <div class="job-card" style="--job-color:${s.color}">
        <div class="job-header">
          <span class="job-client">${j.client}</span>
          <span class="job-stage-badge" style="background:${s.color}">${j.subStage}</span>
        </div>
        <div class="job-meta">
          <div class="job-meta-row">
            <span class="job-meta-label">Style</span>
            <span class="job-meta-value">${j.style}</span>
          </div>
          <div class="job-meta-row">
            <span class="job-meta-label">Stage</span>
            <span class="job-meta-value">${s.label}</span>
          </div>
        </div>
        <div class="job-value">${currency(j.value)}</div>
        <div class="job-days ${dc}">${daysLabel(j.daysInStage)} in stage</div>
      </div>
    `;
  }).join('');

  return `
    <section class="dash-jobs dash-card">
      <h3 class="dash-card-title">${ICONS.jobs} Active Jobs</h3>
      <div class="jobs-scroll">${cards}</div>
    </section>
  `;
}

function renderUpcomingTasks() {
  const items = MOCK_TASKS.map(t => {
    const iconSvg = ICONS[t.type] || ICONS.call;
    const col = TASK_COLORS[t.type] || '#F7941D';
    const dateClass = t.date === 'Today' ? 'task-date-overdue' : (t.urgent ? 'task-date-urgent' : '');
    return `
      <li class="task-item">
        <div class="task-icon" style="background:${col}">${iconSvg}</div>
        <div class="task-body">
          <p class="task-desc">${t.desc}</p>
          <span class="task-client">${t.client}</span>
        </div>
        <span class="task-date ${dateClass}">${t.date}</span>
      </li>
    `;
  }).join('');

  return `
    <section class="dash-tasks dash-card">
      <h3 class="dash-card-title">${ICONS.tasks} Upcoming Tasks</h3>
      <ul class="tasks-list">${items}</ul>
    </section>
  `;
}

/* ═══ Mount / Unmount ═══ */

export function mount() {
  const container = document.getElementById('page-dashboard');
  if (!container || container.dataset.mounted) return;
  container.dataset.mounted = 'true';

  container.innerHTML = `
    <div class="dash">
      ${renderWelcome()}
      ${renderPipeline()}
      ${renderQuickActions()}
      <section class="dash-orbital dash-card">
        <div class="dash-card-header">
          <span class="dash-card-icon">${ICONS.pipeline}</span>
          <h3>Orbital Command</h3>
        </div>
        <div id="orbital-mount"></div>
      </section>
      ${renderActivityFeed()}
      ${renderActiveJobs()}
      ${renderUpcomingTasks()}
    </div>
  `;

  // Mount orbital widget
  const orbitalMount = container.querySelector('#orbital-mount');
  if (orbitalMount) renderOrbital(orbitalMount);

  // Wire quick action buttons
  container.querySelector('[data-action="new-quote"]')?.addEventListener('click', () => {
    navigate('documents');
  });

  container.querySelector('[data-action="new-client"]')?.addEventListener('click', () => {
    navigate('clients');
  });
}

export function unmount() {}
