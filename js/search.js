/**
 * DecodBiz — Startup Library Search & Filter Engine
 * Handles 2,236+ records with pagination, search, and multi-filter
 */

const PAGE_SIZE = 24; // cards per page

let _filtered = [];  // current filtered result set
let _page = 1;       // current page number

/* ── Populate domain filter options ─────────────────────────────────────── */
function populateDomainFilter(selectEl) {
  if (!selectEl || !window.STARTUPS_DB) return;
  const domains = [...new Set(window.STARTUPS_DB.map(s => s.domain).filter(Boolean))].sort();
  domains.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    selectEl.appendChild(opt);
  });
}

/* ── Populate season filter ─────────────────────────────────────────────── */
function populateSeasonFilter(selectEl) {
  if (!selectEl || !window.STARTUPS_DB) return;
  const seasons = [...new Set(window.STARTUPS_DB.map(s => s.season).filter(Boolean))].sort((a, b) => a - b);
  seasons.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = `Season ${s}`;
    selectEl.appendChild(opt);
  });
}

/* ── Main filter + search function ──────────────────────────────────────── */
function applyFilters() {
  const searchEl   = document.getElementById('search-input');
  const domainEl   = document.getElementById('filter-domain');
  const riskEl     = document.getElementById('filter-risk');
  const dealEl     = document.getElementById('filter-deal');
  const seasonEl   = document.getElementById('filter-season');
  const sourceEl   = document.getElementById('filter-source');

  const q      = (searchEl?.value || '').toLowerCase().trim();
  const domain = domainEl?.value || '';
  const risk   = riskEl?.value || '';
  const deal   = dealEl?.value || '';
  const season = seasonEl?.value || '';
  const source = sourceEl?.value || '';

  _filtered = (window.STARTUPS_DB || []).filter(s => {
    // Text search
    if (q) {
      const hay = [
        s.startup_name, s.domain, s.description,
        s.city, s.founder, (s.tags || []).join(' '),
        (s.sharks || []).join(' ')
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (domain && s.domain !== domain) return false;
    if (risk && s.risk_level !== risk) return false;
    if (deal === 'yes' && !s.deal_accepted) return false;
    if (deal === 'no' && s.deal_accepted) return false;
    if (season && String(s.season) !== season) return false;
    if (source && s.source !== source) return false;
    return true;
  });

  _page = 1;
  renderPage();
  renderPagination();
  updateResultsCount();
}

/* ── Render current page of cards ────────────────────────────────────────── */
function renderPage() {
  const grid = document.getElementById('startups-grid');
  if (!grid) return;

  const start = (_page - 1) * PAGE_SIZE;
  const end   = start + PAGE_SIZE;
  const slice = _filtered.slice(start, end);

  if (!slice.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No startups found</div>
        <div class="empty-text">Try a different search term or clear your filters.</div>
      </div>`;
    return;
  }

  // Render cards
  grid.innerHTML = slice.map((s, i) => renderStartupCard(s, i * 25)).join('');

  // Scroll to top of grid (not page top) when paginating
  grid.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Trigger reveal animations
  observeNewReveal();
}

/* ── Render pagination controls ──────────────────────────────────────────── */
function renderPagination() {
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  const totalPages = Math.ceil(_filtered.length / PAGE_SIZE);
  if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

  let html = '';

  // Prev button
  html += `<button class="page-btn ${_page === 1 ? 'disabled' : ''}" onclick="goToPage(${_page - 1})">‹</button>`;

  // Page numbers (show window of 7 around current)
  const startPage = Math.max(1, _page - 3);
  const endPage   = Math.min(totalPages, _page + 3);

  if (startPage > 1) {
    html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) html += `<span class="page-btn" style="pointer-events:none;border:none;color:var(--slate-400)">…</span>`;
  }

  for (let p = startPage; p <= endPage; p++) {
    html += `<button class="page-btn ${p === _page ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="page-btn" style="pointer-events:none;border:none;color:var(--slate-400)">…</span>`;
    html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  // Next button
  html += `<button class="page-btn ${_page === totalPages ? 'disabled' : ''}" onclick="goToPage(${_page + 1})">›</button>`;

  paginationEl.innerHTML = html;
}

/* ── Navigate to page ─────────────────────────────────────────────────────── */
function goToPage(p) {
  const totalPages = Math.ceil(_filtered.length / PAGE_SIZE);
  if (p < 1 || p > totalPages) return;
  _page = p;
  renderPage();
  renderPagination();
}

/* ── Update result count text ─────────────────────────────────────────────── */
function updateResultsCount() {
  const el = document.getElementById('results-count-label');
  if (!el) return;
  const total = window.STARTUPS_DB?.length || 0;
  if (_filtered.length === total) {
    el.textContent = `${total.toLocaleString('en-IN')} startups`;
  } else {
    el.textContent = `${_filtered.length.toLocaleString('en-IN')} of ${total.toLocaleString('en-IN')} startups`;
  }
}

/* ── Init the library page ────────────────────────────────────────────────── */
function initLibraryPage() {
  // Show skeleton loading state first
  const grid = document.getElementById('startups-grid');
  if (grid) {
    grid.innerHTML = Array(8).fill(renderSkeletonCard()).join('');
  }

  // Wait for data to be available (polled, since all_startups.js might still be parsing)
  const tryInit = () => {
    if (!window.STARTUPS_DB || !window.STARTUPS_DB.length) {
      setTimeout(tryInit, 100);
      return;
    }

    // Populate filter dropdowns
    populateDomainFilter(document.getElementById('filter-domain'));
    populateSeasonFilter(document.getElementById('filter-season'));

    // Wire up filter events
    ['search-input', 'filter-domain', 'filter-risk', 'filter-deal', 'filter-season', 'filter-source']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const event = el.tagName === 'INPUT' ? 'input' : 'change';
          el.addEventListener(event, applyFilters);
        }
      });

    // Clear filters button
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.getElementById('search-input').value = '';
        ['filter-domain', 'filter-risk', 'filter-deal', 'filter-season', 'filter-source']
          .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        applyFilters();
      });
    }

    // Initial render
    _filtered = [...window.STARTUPS_DB];
    renderPage();
    renderPagination();
    updateResultsCount();

    hideLoader();
  };

  tryInit();
}
