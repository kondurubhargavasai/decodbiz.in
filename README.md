# 🦈 DecodBiz — Startup Recommendation Platform
## Pure HTML · CSS · Vanilla JavaScript · No Frameworks

---

## 🚀 How to Run (Zero Setup Required)

### Option 1 — Simply Open in Browser
```
1. Unzip the folder
2. Double-click   index.html
3. Done — the entire website runs from your filesystem
```

> **Note:** The data is bundled as a JavaScript file (`data/all_startups.js`), so no server or internet connection is needed to browse startups or run BizMatch.

### Option 2 — Local Server (Recommended for best performance)
```bash
# Python (if installed)
cd decodbiz
python -m http.server 8080
# Open: http://localhost:8080

# OR Node.js
npx serve .
# Open: http://localhost:3000

# OR VS Code
Install "Live Server" extension → Right-click index.html → Open with Live Server
```

---

## 📁 Folder Structure

```
decodbiz/
│
├── index.html          ← Homepage (hero, stats, featured startups, schemes)
├── bizmatch.html       ← BizMatch recommendation form + results
├── startups.html       ← Full startup library (2,236 cards, search, filter, pagination)
├── schemes.html        ← 6 Government funding schemes
├── courses.html        ← 6 Entrepreneur courses
├── experts.html        ← 4 Expert advisors with booking
├── vcs.html            ← 6 Top VC firms in India
├── about.html          ← About, FAQ, mission
│
├── css/
│   └── style.css       ← Complete design system (1400+ lines)
│
├── js/
│   ├── ui.js           ← Navbar, animations, card rendering, helpers
│   ├── bizmatch.js     ← Recommendation engine + scheme matching
│   └── search.js       ← Library search, filter, pagination
│
└── data/
    └── all_startups.js ← 2,236 merged startup records (auto-generated)
```

---

## 📊 Dataset

| Source | Records | Description |
|--------|---------|-------------|
| `Shark_Tank_India.csv` | 751 | Real Shark Tank India pitches, all seasons |
| `shark_tank_startups_1485.json` | 1,485 | Extended global startup database |
| **Combined** | **2,236** | One unified JavaScript dataset |

All records include:
- Startup name, domain, season, episode
- Investment asked/received, equity, valuation
- Shark investors (by name)
- Revenue, gross margin, monthly sales
- Risk level, investment range, city tier suitability
- Part-time flag, team size, tags

---

## 🧠 BizMatch Algorithm

**6-parameter weighted scoring (max 100 pts):**

| Parameter | Points | Logic |
|-----------|--------|-------|
| Investment Range | 30 | Low/medium/high tier match |
| Domain | 25 | Exact → tag → partial → none |
| Risk Level | 15 | Exact → adjacent → opposite |
| City Tier | 15 | tier1/2/3 compatibility |
| Work Style | 10 | Part-time / full-time match |
| Team Size | 5 | Solo / small / medium |
| Shark Deal Bonus | +3 | If startup got a Shark Tank deal |

Returns top 4 matches sorted by score.

---

## ✨ Features

- ✅ 2,236 real startup records (merged from 2 files)
- ✅ BizMatch recommendation engine (100% client-side, instant)
- ✅ Full startup library with live search + 5 filters
- ✅ Pagination (24 cards/page)
- ✅ Government schemes (6 official links)
- ✅ Sticky navbar with scroll effect
- ✅ Mobile-responsive hamburger menu
- ✅ Scroll reveal animations
- ✅ Loading spinner
- ✅ Toast notifications
- ✅ Save startups to localStorage
- ✅ Score ring visualization
- ✅ Match explanation ("why this matched you")
- ✅ Related govt schemes per result
- ✅ Works offline (all data bundled)

---

## 🎨 Design System

- **Font:** Sora (display) + DM Sans (body)
- **Colors:** Deep Navy (`#0A2540`) · Teal (`#14b8a6`) · White
- **Inspiration:** Zerodha · Razorpay · Stripe

---

*Not affiliated with Shark Tank India, Sony LIV, or any featured startup. Data sourced from publicly available information.*
