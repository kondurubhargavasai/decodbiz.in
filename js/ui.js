/**
 * DecodBiz — UI Utilities
 * Navbar, animations, helpers, shared rendering functions
 */

/* ── Domain color map ──────────────────────────────────────────────────────── */
const DOMAIN_COLORS = {
  'Food & Beverage':      '#0f3460',
  'Fashion & Beauty':     '#7c3aed',
  'Lifestyle & Home':     '#be185d',
  'Technology & SaaS':    '#1d4ed8',
  'Health & Wellness':    '#065f46',
  'Fitness & Sports':     '#047857',
  'Education & Kids':     '#b45309',
  'CleanTech & EV':       '#0e7490',
  'Automotive & EV':      '#0c4a6e',
  'Electronics':          '#1e3a5f',
  'Pet Products':         '#92400e',
  'Business Services':    '#374151',
  'Media & Entertainment':'#6d28d9',
  'Manufacturing':        '#44403c',
  'AgriTech':             '#14532d',
  'Other':                '#475569',
};
const DEFAULT_COLOR = '#0A2540';

function getDomainColor(domain) {
  return DOMAIN_COLORS[domain] || DEFAULT_COLOR;
}

/* ── Initials from startup name ─────────────────────────────────────────────── */
function getInitials(name) {
  if (!name) return 'ST';
  return name.split(/[\s_\-\/]+/)
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase() || 'ST';
}

/* ── Risk badge class ────────────────────────────────────────────────────────── */
function getRiskClass(risk) {
  const map = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
  return map[risk] || 'badge-medium';
}

/* ── Score color ─────────────────────────────────────────────────────────────── */
function getScoreColor(score) {
  if (score >= 70) return '#14b8a6';
  if (score >= 45) return '#3b82f6';
  return '#94a3b8';
}

/* ── Render startup logo avatar ──────────────────────────────────────────────── */
function renderLogo(name, domain, size = 48) {
  const color = getDomainColor(domain);
  const fontSize = size * 0.32;
  return `<div class="startup-logo" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,${color},${color}cc);font-size:${fontSize}px">${getInitials(name)}</div>`;
}

/* ── Render score ring ───────────────────────────────────────────────────────── */
function renderScoreRing(score, size = 76) {
  const color = getScoreColor(score);
  const deg = (score / 100) * 360;
  const inner = size - 12;
  const fontSize = size === 76 ? 16 : 13;
  return `
    <div class="score-ring" style="width:${size}px;height:${size}px;background:conic-gradient(${color} ${deg}deg,rgba(255,255,255,.1) ${deg}deg)">
      <div class="score-ring-inner" style="width:${inner}px;height:${inner}px">
        <span class="score-value" style="font-size:${fontSize}px">${score}%</span>
        <span class="score-label">Match</span>
      </div>
    </div>`;
}

/* ── Render tag chips ────────────────────────────────────────────────────────── */
function renderTags(tags) {
  if (!tags || !tags.length) return '';
  return tags.slice(0, 4).map(t =>
    `<span class="sc-tag">${t}</span>`
  ).join('');
}

/* ── Format currency ─────────────────────────────────────────────────────────── */
function fmtCurrency(raw, formatted) {
  if (formatted && formatted !== 'N/A' && formatted !== 'No Deal') return formatted;
  if (!raw || raw === 0) return 'N/A';
  if (raw >= 100) return `₹${(raw / 100).toFixed(1)}Cr`;
  return `₹${raw.toFixed(0)}L`;
}

/* ── Truncate text ───────────────────────────────────────────────────────────── */
function truncate(str, len = 100) {
  if (!str || str === 'N/A') return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

/* ── Render a library startup card ──────────────────────────────────────────── */
function renderStartupCard(s, delay = 0) {
  const riskClass = getRiskClass(s.risk_level);
  const dealBadge = s.deal_accepted
    ? '<span class="badge badge-deal">Deal ✓</span>'
    : '<span class="badge badge-nodeal">No Deal</span>';
  const source = s.source === 'shark_tank_india' ? 'Shark Tank 🇮🇳' : 'Global DB';

  return `
    <div class="startup-card reveal" style="animation-delay:${delay}ms">
      <div class="sc-body">
        <div class="sc-header">
          ${renderLogo(s.startup_name, s.domain)}
          <div class="sc-meta">
            <div class="sc-name" title="${s.startup_name}">${s.startup_name || 'Unnamed'}</div>
            <div class="sc-city">${s.city || 'India'} · S${s.season} E${s.episode}</div>
            <div class="sc-badges">
              <span class="badge badge-domain">${s.domain || 'N/A'}</span>
              <span class="badge ${riskClass}">${s.risk_level || 'medium'} risk</span>
              ${dealBadge}
            </div>
          </div>
        </div>
        <p class="sc-desc">${truncate(s.description, 110)}</p>
        <div class="sc-data-grid">
          <div>
            <div class="sc-data-item-label">Asked</div>
            <div class="sc-data-item-value">${s.investment_asked || 'N/A'}</div>
          </div>
          <div>
            <div class="sc-data-item-label">Revenue</div>
            <div class="sc-data-item-value">${s.gross_sales || 'N/A'}</div>
          </div>
          <div class="col-span-2" style="grid-column:span 2">
            <div class="sc-data-item-label">Domain</div>
            <div class="sc-data-item-value">${s.domain || 'N/A'}</div>
          </div>
        </div>
        <div class="sc-tags">${renderTags(s.tags)}</div>
      </div>
      <div class="sc-footer">
        <a href="${s.youtube_link || '#'}" target="_blank" class="btn btn-navy btn-sm">▶ Watch Pitch</a>
        ${s.company_website && s.company_website !== 'N/A'
          ? `<a href="${s.company_website}" target="_blank" class="btn btn-outline btn-sm">Website ↗</a>`
          : `<span class="badge" style="align-self:center;font-size:.7rem;background:var(--slate-100);color:var(--slate-400)">${source}</span>`}
      </div>
    </div>`;
}

/* ── Render skeleton card ────────────────────────────────────────────────────── */
function renderSkeletonCard() {
  return `
    <div class="startup-card">
      <div class="sc-body">
        <div class="sc-header">
          <div class="skeleton" style="width:48px;height:48px;border-radius:10px;flex-shrink:0"></div>
          <div style="flex:1">
            <div class="skeleton" style="height:16px;width:70%;margin-bottom:8px"></div>
            <div class="skeleton" style="height:12px;width:45%"></div>
          </div>
        </div>
        <div class="skeleton" style="height:48px;margin-bottom:14px"></div>
        <div class="skeleton" style="height:56px;border-radius:12px;margin-bottom:12px"></div>
      </div>
      <div class="sc-footer">
        <div class="skeleton" style="height:36px;flex:1;border-radius:10px"></div>
        <div class="skeleton" style="height:36px;width:80px;border-radius:10px"></div>
      </div>
    </div>`;
}

/* ── Navbar setup ─────────────────────────────────────────────────────────────── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  // Scroll effect
  const handleScroll = () => {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile hamburger
  const hamburger = nav.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  // Active link detection
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ── Scroll reveal animations ────────────────────────────────────────────────── */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Re-observe when new content added
  window._revealObserver = observer;
}

/* ── Re-apply reveal to newly added elements ──────────────────────────────────── */
function observeNewReveal() {
  if (!window._revealObserver) return;
  document.querySelectorAll('.reveal:not(.observed)').forEach(el => {
    el.classList.add('observed');
    window._revealObserver.observe(el);
  });
}

/* ── Loading screen ──────────────────────────────────────────────────────────── */
function hideLoader() {
  const loader = document.getElementById('loading-overlay');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 500);
  }
}

/* ── Toast notification ──────────────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  const existing = document.getElementById('db-toast');
  if (existing) existing.remove();

  const colors = { success: '#14b8a6', error: '#dc2626', info: '#3b82f6' };
  const toast = document.createElement('div');
  toast.id = 'db-toast';
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999',
    background: '#0A2540', color: '#fff', padding: '12px 20px',
    borderRadius: '10px', fontSize: '0.875rem', fontWeight: '500',
    boxShadow: '0 8px 32px rgba(0,0,0,.25)',
    borderLeft: `3px solid ${colors[type] || colors.success}`,
    maxWidth: '300px', lineHeight: '1.5',
    transform: 'translateY(8px)', opacity: '0',
    transition: 'all .25s ease',
  });
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ── Save startup to localStorage ────────────────────────────────────────────── */
function saveStartup(id) {
  const saved = JSON.parse(localStorage.getItem('db_saved') || '[]');
  if (!saved.includes(id)) {
    saved.push(id);
    localStorage.setItem('db_saved', JSON.stringify(saved));
    showToast('Startup saved! ✓');
  } else {
    showToast('Already saved', 'info');
  }
}

/* ── Animated counter ──────────────────────────────────────────────────────────── */
function animateCounter(el, end, suffix = '') {
  const duration = 1600;
  const step = 14;
  const increment = end / (duration / step);
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + increment, end);
    el.textContent = Math.floor(current).toLocaleString('en-IN') + suffix;
    if (current >= end) clearInterval(timer);
  }, step);
}

/* ── Init page ───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
});
