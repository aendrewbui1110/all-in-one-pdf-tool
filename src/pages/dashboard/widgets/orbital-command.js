/* ═══════════════════════════════════════════════════
   Orbital Command Widget
   Visual centrepiece — 14 AI agents orbiting TOBY
   ═══════════════════════════════════════════════════ */

import './orbital-command.css';

// ── Agent definitions ──────────────────────────────

const AGENTS = [
  // Hub
  { id: 'toby',      name: 'TOBY',      role: 'CEO / Command',     colour: '#F7941D', ring: 'hub',   active: true,  lastAction: 'Delegated site inspection to STEEL',     uptime: '99.8%' },
  // Inner ring (core)
  { id: 'steel',     name: 'STEEL',     role: 'Sales',             colour: '#3B82F6', ring: 'inner', active: true,  lastAction: 'Responded to Facebook lead #47',         uptime: '98.2%' },
  { id: 'quote',     name: 'QUOTE',     role: 'Estimation',        colour: '#22C55E', ring: 'inner', active: false, lastAction: 'Generated quote PSP-Q-0012',             uptime: '95.1%' },
  { id: 'ledger',    name: 'LEDGER',    role: 'Finance',           colour: '#EAB308', ring: 'inner', active: true,  lastAction: 'Reconciled 3 payments',                  uptime: '99.5%' },
  { id: 'forge',     name: 'FORGE',     role: 'Projects',          colour: '#EF4444', ring: 'inner', active: false, lastAction: 'Updated pipeline for Henderson job',      uptime: '97.3%' },
  // Outer ring (support)
  { id: 'signal',    name: 'SIGNAL',    role: 'Marketing',         colour: '#8B5CF6', ring: 'outer', active: false, lastAction: 'Drafted blog post on patio styles',       uptime: '92.0%' },
  { id: 'anchor',    name: 'ANCHOR',    role: 'Compliance',        colour: '#06B6D4', ring: 'outer', active: false, lastAction: 'Checked council submission status',       uptime: '99.0%' },
  { id: 'sentinel',  name: 'SENTINEL',  role: 'Security',          colour: '#F43F5E', ring: 'outer', active: false, lastAction: 'Rotated API keys',                        uptime: '99.9%' },
  { id: 'oracle',    name: 'ORACLE',    role: 'Intelligence',      colour: '#A855F7', ring: 'outer', active: false, lastAction: 'Scraped competitor pricing updates',      uptime: '94.5%' },
  { id: 'echo',      name: 'ECHO',      role: 'Learning',          colour: '#14B8A6', ring: 'outer', active: false, lastAction: 'Indexed 12 new SOPs',                     uptime: '96.8%' },
  { id: 'janitor',   name: 'JANITOR',   role: 'System',            colour: '#6B7280', ring: 'outer', active: false, lastAction: 'Cleared temp files, freed 2.1 GB',        uptime: '99.7%' },
  { id: 'scout',     name: 'SCOUT',     role: 'Discovery',         colour: '#F97316', ring: 'outer', active: false, lastAction: 'Found 3 new AI tools for review',         uptime: '91.2%' },
  { id: 'chronicle', name: 'CHRONICLE', role: 'Progress Tracking', colour: '#2563EB', ring: 'outer', active: false, lastAction: 'Generated weekly progress report',        uptime: '98.0%' },
  { id: 'life',      name: 'LIFE',      role: 'Personal',          colour: '#10B981', ring: 'outer', active: false, lastAction: 'Logged gym session and macros',            uptime: '97.5%' },
];

const INNER_AGENTS = AGENTS.filter(a => a.ring === 'inner');
const OUTER_AGENTS = AGENTS.filter(a => a.ring === 'outer');
const HUB_AGENT    = AGENTS.find(a => a.ring === 'hub');

// Orbit config
const INNER_RADIUS  = 120;
const OUTER_RADIUS  = 200;
const INNER_PERIOD  = 60;   // seconds for full rotation
const OUTER_PERIOD  = 90;
const SYSTEM_SIZE   = 420;

// ── Utility: parse hex to r,g,b ────────────────────

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// ── State ──────────────────────────────────────────

let animFrameId   = null;
let isPaused      = false;
let startTime     = 0;
let pausedElapsed = 0;
let selectedAgent = null;
let rootEl        = null;

// ── Build DOM ──────────────────────────────────────

function buildWidget() {
  const wrap = document.createElement('div');
  wrap.className = 'orbital-widget';
  wrap.innerHTML = `
    <div class="orbital-widget__header">
      <div>
        <div class="orbital-widget__title">Orbital Command</div>
        <div class="orbital-widget__subtitle">${AGENTS.length} agents &middot; ${AGENTS.filter(a => a.active).length} active</div>
      </div>
    </div>
    <div class="orbital-system" data-orbital-system>
      <div class="orbital-hub__glow"></div>
      <div class="orbital-ring orbital-ring--inner"></div>
      <div class="orbital-ring orbital-ring--outer"></div>
    </div>
    <div class="orbital-mobile" data-orbital-mobile></div>
    <div class="orbital-detail" data-orbital-detail></div>
  `;

  return wrap;
}

function buildHub(system) {
  const hub = document.createElement('div');
  hub.className = 'orbital-hub';
  hub.dataset.agentId = HUB_AGENT.id;
  hub.innerHTML = `<span class="orbital-hub__letter">${HUB_AGENT.name[0]}</span>`;
  hub.addEventListener('click', (e) => {
    e.stopPropagation();
    selectAgent(HUB_AGENT);
  });
  system.appendChild(hub);
}

function buildNodes(system) {
  const allOrbiters = [...INNER_AGENTS, ...OUTER_AGENTS];
  allOrbiters.forEach(agent => {
    const node = document.createElement('div');
    node.className = 'orbital-node' + (agent.active ? ' orbital-node--active' : ' orbital-node--inactive');
    node.dataset.agentId = agent.id;
    node.style.color = agent.colour;

    // Set CSS custom properties for glow animation
    const rgb = hexToRgb(agent.colour);
    node.style.setProperty('--node-r', rgb.r);
    node.style.setProperty('--node-g', rgb.g);
    node.style.setProperty('--node-b', rgb.b);

    node.innerHTML = `
      <span class="orbital-node__letter">${agent.name[0]}</span>
      <span class="orbital-node__tooltip">${agent.name}</span>
    `;

    node.addEventListener('click', (e) => {
      e.stopPropagation();
      selectAgent(agent);
    });

    system.appendChild(node);
  });
}

function buildMobileCards(mobileContainer) {
  AGENTS.forEach(agent => {
    const card = document.createElement('div');
    card.className = 'orbital-mobile-card';
    card.dataset.agentId = agent.id;
    card.style.color = agent.colour;
    card.innerHTML = `
      <div class="orbital-mobile-card__icon">
        <span class="orbital-mobile-card__letter">${agent.name[0]}</span>
      </div>
      <div class="orbital-mobile-card__info">
        <span class="orbital-mobile-card__name">${agent.name}</span>
        <span class="orbital-mobile-card__status">
          <span class="orbital-mobile-card__dot ${agent.active ? 'orbital-mobile-card__dot--active' : 'orbital-mobile-card__dot--inactive'}"></span>
          ${agent.active ? 'Active' : 'Standby'}
        </span>
      </div>
    `;
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      selectAgent(agent);
    });
    mobileContainer.appendChild(card);
  });
}

// ── Detail Panel ───────────────────────────────────

function showDetail(agent) {
  const panel = rootEl.querySelector('[data-orbital-detail]');
  if (!panel) return;

  const statusClass = agent.active ? 'active' : 'standby';
  const statusLabel = agent.active ? 'Active' : 'Standby';

  panel.innerHTML = `
    <button class="orbital-detail__close" data-close-detail aria-label="Close">&times;</button>
    <div class="orbital-detail__icon" style="color: ${agent.colour}; border-color: ${agent.colour};">
      <span class="orbital-detail__icon-letter">${agent.name[0]}</span>
    </div>
    <div class="orbital-detail__name">${agent.name}</div>
    <div class="orbital-detail__role">${agent.role}</div>
    <div class="orbital-detail__row">
      <span class="orbital-detail__label">Status</span>
      <span class="orbital-detail__status orbital-detail__status--${statusClass}">
        <span class="orbital-detail__status-dot"></span>
        ${statusLabel}
      </span>
    </div>
    <div class="orbital-detail__row">
      <span class="orbital-detail__label">Last Action</span>
      <span class="orbital-detail__value">${agent.lastAction}</span>
    </div>
    <div class="orbital-detail__row">
      <span class="orbital-detail__label">Uptime</span>
      <span class="orbital-detail__value">${agent.uptime}</span>
    </div>
  `;

  panel.classList.add('orbital-detail--visible');

  panel.querySelector('[data-close-detail]').addEventListener('click', (e) => {
    e.stopPropagation();
    dismissDetail();
  });
}

function dismissDetail() {
  const panel = rootEl.querySelector('[data-orbital-detail]');
  if (panel) panel.classList.remove('orbital-detail--visible');

  // Deselect node
  if (selectedAgent) {
    const node = rootEl.querySelector(`[data-agent-id="${selectedAgent.id}"]`);
    if (node) node.classList.remove('orbital-node--selected');
    selectedAgent = null;
  }

  // Resume rotation
  resumeRotation();
}

function selectAgent(agent) {
  // Deselect previous
  if (selectedAgent) {
    const prev = rootEl.querySelector(`[data-agent-id="${selectedAgent.id}"]`);
    if (prev) prev.classList.remove('orbital-node--selected');
  }

  selectedAgent = agent;

  // Highlight selected
  const node = rootEl.querySelector(`[data-agent-id="${agent.id}"]`);
  if (node && !node.classList.contains('orbital-hub')) {
    node.classList.add('orbital-node--selected');
  }

  // Pause rotation
  pauseRotation();

  // Show detail
  showDetail(agent);
}

// ── Animation Loop ─────────────────────────────────

function getElapsed() {
  if (isPaused) return pausedElapsed;
  return (performance.now() - startTime) / 1000;
}

function positionNodes() {
  const elapsed = getElapsed();
  const cx = SYSTEM_SIZE / 2;
  const cy = SYSTEM_SIZE / 2;

  // Inner ring
  const innerAngleStep = (2 * Math.PI) / INNER_AGENTS.length;
  const innerRotation  = (elapsed / INNER_PERIOD) * 2 * Math.PI;

  INNER_AGENTS.forEach((agent, i) => {
    const angle = innerRotation + (i * innerAngleStep);
    const x = cx + Math.cos(angle) * INNER_RADIUS;
    const y = cy + Math.sin(angle) * INNER_RADIUS;

    const node = rootEl.querySelector(`.orbital-system [data-agent-id="${agent.id}"]`);
    if (node) {
      node.style.left = x + 'px';
      node.style.top  = y + 'px';
      // Counter-rotate the node content so text stays upright
      // The node itself rotates with the ring, so we undo that
      node.style.transform = `rotate(${-angle}rad)`;
    }
  });

  // Outer ring (counter-rotation: negative direction)
  const outerAngleStep = (2 * Math.PI) / OUTER_AGENTS.length;
  const outerRotation  = -(elapsed / OUTER_PERIOD) * 2 * Math.PI;

  OUTER_AGENTS.forEach((agent, i) => {
    const angle = outerRotation + (i * outerAngleStep);
    const x = cx + Math.cos(angle) * OUTER_RADIUS;
    const y = cy + Math.sin(angle) * OUTER_RADIUS;

    const node = rootEl.querySelector(`.orbital-system [data-agent-id="${agent.id}"]`);
    if (node) {
      node.style.left = x + 'px';
      node.style.top  = y + 'px';
      node.style.transform = `rotate(${-angle}rad)`;
    }
  });
}

function tick() {
  positionNodes();
  animFrameId = requestAnimationFrame(tick);
}

function startAnimation() {
  startTime = performance.now();
  pausedElapsed = 0;
  isPaused = false;
  tick();
}

function pauseRotation() {
  if (isPaused) return;
  pausedElapsed = getElapsed();
  isPaused = true;
}

function resumeRotation() {
  if (!isPaused) return;
  // Adjust start time so elapsed stays continuous
  startTime = performance.now() - (pausedElapsed * 1000);
  isPaused = false;
}

function stopAnimation() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

// ── Event Handlers ─────────────────────────────────

function onSystemMouseEnter() {
  if (!selectedAgent) pauseRotation();
}

function onSystemMouseLeave() {
  if (!selectedAgent) resumeRotation();
}

function onDocumentClick(e) {
  // Dismiss detail if clicking outside the orbital system and detail panel
  if (!selectedAgent) return;
  const detail = rootEl.querySelector('[data-orbital-detail]');
  const system = rootEl.querySelector('[data-orbital-system]');
  const mobile = rootEl.querySelector('[data-orbital-mobile]');

  if (detail && detail.contains(e.target)) return;
  if (system && system.contains(e.target)) return;
  if (mobile && mobile.contains(e.target)) return;

  dismissDetail();
}

// ── Public API ─────────────────────────────────────

export function renderOrbital(container) {
  // Build widget
  rootEl = buildWidget();
  container.appendChild(rootEl);

  const system = rootEl.querySelector('[data-orbital-system]');
  const mobile = rootEl.querySelector('[data-orbital-mobile]');

  // Build components
  buildHub(system);
  buildNodes(system);
  buildMobileCards(mobile);

  // Hover pause/resume on orbital system
  system.addEventListener('mouseenter', onSystemMouseEnter);
  system.addEventListener('mouseleave', onSystemMouseLeave);

  // Click outside to dismiss
  document.addEventListener('click', onDocumentClick);

  // Start animation
  startAnimation();
  // Position immediately on first frame
  positionNodes();

  // Return cleanup function
  return function destroy() {
    stopAnimation();
    system.removeEventListener('mouseenter', onSystemMouseEnter);
    system.removeEventListener('mouseleave', onSystemMouseLeave);
    document.removeEventListener('click', onDocumentClick);
    rootEl.remove();
    rootEl = null;
  };
}
