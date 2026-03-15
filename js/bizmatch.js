/**
 * DecodBiz — BizMatch Recommendation Engine
 *
 * Scoring parameters (max 100 pts):
 *   Investment Range Match   → 30 pts
 *   Domain Match             → 25 pts
 *   Risk Level Match         → 15 pts
 *   City Tier Compatibility  → 15 pts
 *   Part-Time Compatibility  → 10 pts
 *   Team Size Match          →  5 pts
 *   Shark Deal Bonus         → +3 pts (capped at 100)
 */

/* ── Investment tier helpers ──────────────────────────────────────────────── */
const INVESTMENT_TIER_MAP = {
  'under-10':  'low',
  '10-50':     'low',
  '50-200':    'medium',
  '2cr-plus':  'high',
};

/* ── Domain synonym groups ────────────────────────────────────────────────── */
const DOMAIN_GROUPS = {
  food:        ['Food & Beverage'],
  fashion:     ['Fashion & Beauty', 'Lifestyle & Home'],
  tech:        ['Technology & SaaS', 'Business Services'],
  health:      ['Health & Wellness', 'Fitness & Sports'],
  education:   ['Education & Kids'],
  fitness:     ['Fitness & Sports'],
  ev:          ['CleanTech & EV', 'Automotive & EV'],
  home:        ['Lifestyle & Home'],
  electronics: ['Electronics'],
  pets:        ['Pet Products'],
  media:       ['Media & Entertainment'],
  services:    ['Business Services'],
  agri:        ['AgriTech'],
  manufacturing: ['Manufacturing'],
  any:         null, // matches everything
};

/**
 * Score a single startup against user preferences.
 * @param {Object} startup — startup object from STARTUPS_DB
 * @param {Object} prefs   — form values
 * @returns {{ score: number, reasons: string[] }}
 */
function scoreStartup(startup, prefs) {
  let score = 0;
  const reasons = [];

  // ── 1. Investment Match (30 pts) ─────────────────────────────────────────
  const userTier = INVESTMENT_TIER_MAP[prefs.investment] || 'medium';
  const startupRange = startup.investment_range || 'medium';
  const tierOrder = ['low', 'medium', 'high'];
  const tierDiff = Math.abs(tierOrder.indexOf(userTier) - tierOrder.indexOf(startupRange));

  if (tierDiff === 0) {
    score += 30;
    reasons.push('Investment range is a perfect match');
  } else if (tierDiff === 1) {
    score += 14;
    reasons.push('Investment range is compatible');
  }
  // diff > 1 → 0 pts

  // ── 2. Domain Match (25 pts) ─────────────────────────────────────────────
  const userDomain = prefs.domain;
  const startupDomain = (startup.domain || '').toLowerCase();
  const startupTags = (startup.tags || []).join(' ').toLowerCase();

  if (userDomain === 'any') {
    score += 12; // partial for open preferences
  } else {
    const matchDomains = DOMAIN_GROUPS[userDomain] || [];
    const exactMatch = matchDomains.some(m =>
      startup.domain === m || startupDomain.includes(m.toLowerCase())
    );
    const tagMatch = !exactMatch && startupTags.includes(userDomain);

    if (exactMatch) {
      score += 25;
      reasons.push(`Domain matches your interest in ${userDomain}`);
    } else if (tagMatch) {
      score += 14;
      reasons.push('Domain tags align with your interest');
    }
    // no match → 0 pts
  }

  // ── 3. Risk Level (15 pts) ───────────────────────────────────────────────
  const userRisk = prefs.risk;
  const startupRisk = startup.risk_level || 'medium';
  const riskOrder = ['low', 'medium', 'high'];
  const riskDiff = Math.abs(riskOrder.indexOf(userRisk) - riskOrder.indexOf(startupRisk));

  if (riskDiff === 0) {
    score += 15;
    reasons.push(`${startupRisk}-risk profile matches your appetite`);
  } else if (riskDiff === 1) {
    score += 7;
    reasons.push('Risk level is within your comfort range');
  } else {
    score += 1; // always give 1 pt minimum
  }

  // ── 4. City Tier (15 pts) ────────────────────────────────────────────────
  const userTierCity = prefs.cityTier;
  const suitableTiers = Array.isArray(startup.city_tier_suitable)
    ? startup.city_tier_suitable
    : ['tier1', 'tier2'];

  if (suitableTiers.includes(userTierCity)) {
    score += 15;
    reasons.push(`Business model suits ${userTierCity.replace('tier', 'Tier ')} cities`);
  } else if (suitableTiers.length >= 3) {
    score += 10; // works everywhere
    reasons.push('Business works across all city tiers');
  }

  // ── 5. Part-Time Compatibility (10 pts) ─────────────────────────────────
  const wantsPT = prefs.workStyle === 'part-time';
  const isPT = Boolean(startup.part_time_possible);

  if (wantsPT === isPT) {
    score += 10;
    reasons.push(`Suitable for ${wantsPT ? 'part-time' : 'full-time'} commitment`);
  } else if (!wantsPT && isPT) {
    score += 6; // full-time person can do part-time biz too
    reasons.push('Flexible — can be run full-time or part-time');
  } else {
    score += 1;
  }

  // ── 6. Team Size (5 pts) ─────────────────────────────────────────────────
  const userTeam = prefs.teamSize;
  const startupTeam = startup.team_size || 'small';

  if (userTeam === 'any' || userTeam === startupTeam) {
    score += 5;
    if (userTeam === startupTeam) {
      reasons.push(`Team size (${startupTeam}) matches your plan`);
    }
  } else {
    score += 2; // partial
  }

  // ── Bonus: Shark Tank deal ────────────────────────────────────────────────
  if (startup.deal_accepted) {
    score = Math.min(score + 3, 100);
    reasons.push('Shark Tank investor-validated business');
  }

  return { score: Math.min(score, 100), reasons: reasons.slice(0, 4) };
}

/**
 * Generate a human-readable why-match explanation.
 */
function generateWhyMatch(startup, prefs, reasons) {
  const name = startup.startup_name || 'This startup';
  const domain = startup.domain || 'this space';
  const cityLabel = (prefs.cityTier || 'tier1').replace('tier', 'Tier ');
  const workLabel = prefs.workStyle === 'part-time' ? 'part-time' : 'full-time';

  let msg = reasons[0] ? `${name} is recommended because ${reasons[0].toLowerCase()}. ` : '';
  msg += `The ${domain.toLowerCase()} space has strong demand in ${cityLabel} markets `;
  msg += `and is proven viable for a ${workLabel} entrepreneur at your investment level.`;
  if (startup.deal_accepted && startup.sharks && startup.sharks.length > 0) {
    msg += ` Backed by ${startup.sharks.slice(0, 2).join(' & ')} on Shark Tank.`;
  }
  return msg;
}

/**
 * Main BizMatch function.
 * Scores all startups, returns top N with metadata.
 * @param {Object} prefs   — form preferences
 * @param {number} topN    — how many results to return (default 4)
 * @returns {Array}        — scored startups sorted desc
 */
function runBizMatch(prefs, topN = 4) {
  if (!window.STARTUPS_DB || !window.STARTUPS_DB.length) {
    console.error('BizMatch: STARTUPS_DB not loaded');
    return [];
  }

  const scored = window.STARTUPS_DB.map(startup => {
    const { score, reasons } = scoreStartup(startup, prefs);
    const whyMatch = generateWhyMatch(startup, prefs, reasons);
    return {
      ...startup,
      match_score: score,
      match_reasons: reasons,
      why_match: whyMatch,
    };
  });

  // Sort: score desc, then revenue desc as tiebreaker
  scored.sort((a, b) => {
    if (b.match_score !== a.match_score) return b.match_score - a.match_score;
    return (b.yearly_revenue_raw || 0) - (a.yearly_revenue_raw || 0);
  });

  return scored.slice(0, topN);
}

/* ── Government scheme relevance ──────────────────────────────────────────── */
const SCHEMES_DATA = [
  {
    id: 1, icon: '🚀', name: 'Startup India', short: 'Startup India',
    amount: 'Up to ₹10 Crore', applyLink: 'https://www.startupindia.gov.in/',
    desc: 'DPIIT initiative offering 3-year tax exemption, fast-track patents, and ₹10,000 Crore Fund of Funds.',
    eligibility: 'DPIIT-recognized startup, under 10 years old, turnover under ₹100 Crore',
    benefits: ['3-year income tax exemption', '80% patent fee rebate', 'Self-certification compliance', 'Easy winding up'],
    domains: ['all'],
  },
  {
    id: 2, icon: '💰', name: 'Pradhan Mantri MUDRA Yojana', short: 'MUDRA Loan',
    amount: '₹50,000 to ₹10 Lakhs', applyLink: 'https://www.mudra.org.in/',
    desc: 'Micro-credit with 3 tiers: Shishu (₹50K), Kishore (₹5L), Tarun (₹10L). No collateral required.',
    eligibility: 'Non-corporate small businesses, traders, artisans across India',
    benefits: ['No collateral needed', 'Low interest rates', 'Flexible repayment', 'Available at all banks'],
    domains: ['food', 'retail', 'service', 'manufacturing', 'all'],
  },
  {
    id: 3, icon: '🏭', name: 'PMEGP Scheme', short: 'PMEGP',
    amount: 'Up to ₹25 Lakhs (mfg)', applyLink: 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
    desc: "PM's Employment Generation Programme — credit-linked subsidy for new micro-enterprises.",
    eligibility: 'Above 18 years, 8th pass for projects above ₹10L',
    benefits: ['15–35% cost subsidy', 'Rural & urban coverage', 'Skill training provided', 'No income limit'],
    domains: ['food', 'manufacturing', 'handicraft', 'service'],
  },
  {
    id: 4, icon: '🤝', name: 'Stand-Up India', short: 'Standup India',
    amount: '₹10 Lakhs to ₹1 Crore', applyLink: 'https://www.standupmitra.in/',
    desc: 'Bank loans for SC/ST and women entrepreneurs for greenfield enterprises.',
    eligibility: 'SC/ST and/or women entrepreneurs above 18, new greenfield project',
    benefits: ['Composite loan', 'Repayment up to 7 years', '18-month moratorium', '75% project cost'],
    domains: ['all'],
  },
  {
    id: 5, icon: '🛡️', name: 'MSME Credit Guarantee (CGTMSE)', short: 'CGTMSE',
    amount: 'Up to ₹2 Crore', applyLink: 'https://www.cgtmse.in/',
    desc: 'Collateral-free credit for micro and small enterprises — 85% government guarantee.',
    eligibility: 'New and existing micro/small enterprises in manufacturing and service',
    benefits: ['No collateral required', '85% guarantee cover', 'Term + working capital', 'All banks & NBFCs'],
    domains: ['manufacturing', 'service', 'trade'],
  },
  {
    id: 6, icon: '💡', name: 'Atal Innovation Mission', short: 'AIM',
    amount: 'Up to ₹10 Crore (grant)', applyLink: 'https://aim.gov.in/',
    desc: 'NITI Aayog initiative for deep-tech and social innovation via incubation centres.',
    eligibility: 'Innovative startups with tech solutions, apply via AIC network',
    benefits: ['Incubation support', 'Expert mentorship', 'Infrastructure access', 'Govt credibility'],
    domains: ['tech', 'innovation', 'deep tech'],
  },
];

/**
 * Get 2-3 most relevant schemes for a startup.
 */
function getSchemesForStartup(startup) {
  const domain = (startup.domain || '').toLowerCase();
  const tags = (startup.tags || []).join(' ').toLowerCase();

  const relevant = [];
  for (const scheme of SCHEMES_DATA) {
    if (relevant.length >= 3) break;
    if (scheme.domains.includes('all')) {
      relevant.push(scheme);
    } else if (scheme.domains.some(d => domain.includes(d) || tags.includes(d))) {
      relevant.push(scheme);
    }
  }

  // Ensure at least 2
  for (const scheme of SCHEMES_DATA) {
    if (relevant.length >= 2) break;
    if (!relevant.find(r => r.id === scheme.id)) relevant.push(scheme);
  }

  // Deduplicate
  const seen = new Set();
  return relevant.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; }).slice(0, 3);
}

/* ── Render a compact scheme card ─────────────────────────────────────────── */
function renderSchemeCardCompact(scheme) {
  return `
    <div class="scheme-card-compact">
      <div class="scc-header">
        <div class="scc-icon">${scheme.icon}</div>
        <div>
          <div class="scc-name">${scheme.name}</div>
          <div class="scc-amount">${scheme.amount}</div>
        </div>
      </div>
      <div class="scc-desc">${scheme.desc}</div>
      <a href="${scheme.applyLink}" target="_blank" class="btn btn-primary btn-sm" style="width:100%;justify-content:center">Apply Now →</a>
    </div>`;
}

/* ── Render full result card ──────────────────────────────────────────────── */
function renderResultCard(startup, index) {
  const schemes = getSchemesForStartup(startup);
  const schemeId = `scheme-panel-${index}`;

  const sharksHtml = (startup.sharks || []).map(s =>
    `<span class="shark-chip">🦈 ${s}</span>`
  ).join('');

  const reasonsHtml = (startup.match_reasons || []).map(r =>
    `<span class="rc-reason"><span>✓</span> ${r}</span>`
  ).join('');

  return `
    <div class="result-card reveal" style="animation-delay:${index * 80}ms">
      <!-- Header -->
      <div class="result-card-header">
        <div class="result-card-info">
          ${renderLogo(startup.startup_name, startup.domain, 64)}
          <div>
            <div class="rc-name">${startup.startup_name || 'Unnamed'}</div>
            <div class="rc-sub">${startup.city || 'India'} · Season ${startup.season} · Episode ${startup.episode}</div>
            <div class="rc-badges">
              <span class="badge badge-ghost">${startup.domain || 'N/A'}</span>
              <span class="badge badge-${startup.risk_level || 'medium'}">${startup.risk_level || 'medium'} risk</span>
              ${startup.deal_accepted
                ? '<span class="badge" style="background:rgba(5,150,105,.2);color:#6ee7b7;border-color:rgba(5,150,105,.3)">Deal ✓</span>'
                : '<span class="badge" style="background:rgba(220,38,38,.2);color:#fca5a5;border-color:rgba(220,38,38,.25)">No Deal</span>'}
            </div>
          </div>
        </div>
        ${renderScoreRing(startup.match_score || 0)}
      </div>

      <!-- Body -->
      <div class="result-card-body">
        <!-- Data grid -->
        <div class="rc-data-grid">
          <div><div class="rc-data-label">Asked</div><div class="rc-data-value">${startup.investment_asked || 'N/A'}</div></div>
          <div><div class="rc-data-label">Received</div><div class="rc-data-value">${startup.investment_received || 'N/A'}</div></div>
          <div><div class="rc-data-label">Equity</div><div class="rc-data-value">${startup.equity || 'N/A'}</div></div>
          <div><div class="rc-data-label">Valuation</div><div class="rc-data-value">${startup.valuation || 'N/A'}</div></div>
          <div><div class="rc-data-label">Revenue</div><div class="rc-data-value">${startup.gross_sales || 'N/A'}</div></div>
          <div><div class="rc-data-label">Monthly</div><div class="rc-data-value">${startup.net_revenue || 'N/A'}</div></div>
        </div>

        <!-- Sharks -->
        ${sharksHtml ? `<div class="rc-sharks"><span style="font-size:.78rem;color:var(--slate-400);font-weight:600;margin-right:4px">Sharks:</span>${sharksHtml}</div>` : ''}

        <!-- Description -->
        <p class="rc-desc">${truncate(startup.description, 200)}</p>

        <!-- Why match -->
        ${startup.why_match ? `
        <div class="rc-why">
          <div class="rc-why-title">🎯 Why this matches you</div>
          <div class="rc-why-text">${startup.why_match}</div>
        </div>` : ''}

        <!-- Match reasons -->
        ${reasonsHtml ? `<div class="rc-reasons">${reasonsHtml}</div>` : ''}

        <!-- Government Schemes toggle -->
        <div class="rc-schemes-toggle" onclick="toggleSchemes('${schemeId}', this)">
          <span class="rc-schemes-toggle-title">🏛️ Relevant Government Schemes (${schemes.length})</span>
          <span id="${schemeId}-arrow">▼</span>
        </div>
        <div class="rc-schemes-panel" id="${schemeId}">
          <div class="rc-schemes-grid">
            ${schemes.map(s => renderSchemeCardCompact(s)).join('')}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="result-card-footer">
        <a href="${startup.youtube_link || '#'}" target="_blank" class="btn btn-navy">▶ Watch Pitch</a>
        <button class="btn btn-outline" onclick="saveStartup('${startup.id}')">🔖 Save</button>
        ${startup.company_website && startup.company_website !== 'N/A'
          ? `<a href="${startup.company_website}" target="_blank" class="btn btn-outline">Website ↗</a>`
          : ''}
      </div>
    </div>`;
}

/* ── Toggle scheme panel ─────────────────────────────────────────────────── */
function toggleSchemes(panelId, toggleEl) {
  const panel = document.getElementById(panelId);
  const arrow = document.getElementById(panelId + '-arrow');
  if (!panel) return;
  const isHidden = panel.style.display === 'none';
  panel.style.display = isHidden ? 'block' : 'none';
  if (arrow) arrow.textContent = isHidden ? '▲' : '▼';
}

/* ── BizMatch page handler ────────────────────────────────────────────────── */
function initBizMatchPage() {
  const form = document.getElementById('bizmatch-form');
  if (!form) return;

  const resultsSection = document.getElementById('results-section');
  const resultsContainer = document.getElementById('results-container');
  const resultsCount = document.getElementById('results-count');

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const prefs = {
      investment: form.investment.value,
      domain:     form.domain.value,
      risk:       form.risk.value,
      cityTier:   form.cityTier.value,
      workStyle:  form.workStyle.value,
      teamSize:   form.teamSize.value,
      roi:        form.roi.value,
      mode:       form.mode.value,
    };

    // Validate required fields
    const required = ['investment', 'domain', 'risk', 'cityTier', 'workStyle'];
    for (const key of required) {
      if (!prefs[key]) {
        showToast(`Please select ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
        return;
      }
    }

    // Show loading
    const btn = form.querySelector('.btn-submit');
    const originalText = btn.textContent;
    btn.textContent = '🔄 Analysing 2,236 startups…';
    btn.disabled = true;

    // Simulate brief analysis delay for UX
    setTimeout(() => {
      const results = runBizMatch(prefs, 4);

      btn.textContent = originalText;
      btn.disabled = false;

      if (!results.length) {
        resultsContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">No matches found</div><div class="empty-text">Try adjusting your preferences.</div></div>`;
      } else {
        resultsContainer.innerHTML = results.map((r, i) => renderResultCard(r, i)).join('');
        if (resultsCount) resultsCount.textContent = `Top ${results.length} matches from ${window.TOTAL_STARTUPS?.toLocaleString('en-IN') || '2,236'} startups`;
        observeNewReveal();
      }

      resultsSection.style.display = 'block';
      setTimeout(() => resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }, 700);
  });
}
