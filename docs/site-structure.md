# Site Structure

Updated: 2025-12-30

/
├── index.html
├── calculators.html
├── stories.html             ← displays story categories and links
├── news.html                ← redirects to latest news issue
├── news-archive.html
├── robots.txt
├── sitemap.xml
├── package.json             ← project metadata and npm scripts
├── README.md                ← visitor-friendly overview
├── CONTRIBUTING.md          ← detailed contribution guidelines
│
├── calculators/
│   ├── smart-budget/
│   │   ├── index.html
│   │   ├── smart-budget.js
│   │   ├── smart-budget-init.js
│   │   ├── smart-budget.css
│   │   ├── budget-category-info.json
│   │   ├── budget-profiles.json
│   │   └── assets/
│   │
│   ├── envelope-budget/
│   │   ├── index.html
│   │   ├── envelope-budget.js
│   │   └── envelope-budget.css
│   │
│   ├── missing-loan-term/
│   │   ├── index.html
│   │   ├── missing-loan-term.js
│   │   ├── missing-loan-term-init.js
│   │   └── missing-loan-term.css
│   │
│   ├── simple-loan/
│   │   ├── index.html
│   │   ├── simple-loan.js
│   │   ├── simple-loan-init.js
│   │   └── simple-loan.css
│   │
│   ├── accelerated-debt-payoff/
│   │   ├── index.html
│   │   ├── accelerated-debt-payoff.js
│   │   ├── accelerated-debt-payoff-init.js
│   │   └── accelerated-debt-payoff.css
│   │
│   └── debt-payoff-goal/
│       ├── index.html
│       ├── debt-payoff-goal.js
│       ├── debt-payoff-goal-init.js
│       └── debt-payoff-goal.css
│
├── stories/
│   └── index.html               ← story viewer page (displays individual stories)
│
├── news/                        ← newsletter/edition structure
│   ├── 2026-01-05/             ← latest newsletter edition
│   │   ├── index.html          ← edition front page (no inline scripts)
│   │   ├── template.js         ← newsletter-specific scripts (auto-initializes)
│   │   ├── template.css        ← newsletter-specific styles
│   │   ├── images/             ← newsletter images (hero, thumbnails, etc.)
│   │   │
│   │   └── stories/            ← stories bundled with this newsletter edition
│   │       ├── getting-started-with-your-budget.html
│   │       ├── getting-started-with-your-budget.pdf
│   │       ├── zero-based-budgeting.html
│   │       ├── zero-based-budgeting.pdf
│   │       ├── reduce-bills.html
│   │       ├── reduce-bills.pdf
│   │       ├── why-budgets-fail.html
│   │       ├── why-budgets-fail.pdf
│   │       ├── budgeting-for-your-first-apartment.html
│   │       ├── budgeting-for-your-first-apartment.pdf
│   │       └── images/         ← all story images (jpg and webp)
│   │
│   └── upcoming/               ← drafts for future editions
│
├── templates/
│   ├── calculator/
│   │   ├── template.html
│   │   ├── template.js
│   │   ├── template-init.js
│   │   └── template.css
│   │
│   └── news/
│       ├── template.html       ← newsletter template (no inline scripts)
│       ├── template.js         ← newsletter template scripts (auto-initializes)
│       ├── template.css
│       └── images/
│
├── css/
│   ├── base.css          ← global typography, layout, colors, accessibility
│   ├── layout.css        ← layout helpers
│   └── components.css    ← shared UI components
│
├── js/
│   ├── utils.js              ← shared formatting, math helpers, a11y helpers
│   ├── stories.js            ← builds story cards on stories.html from categories.json
│   ├── story-viewer.js       ← handles story viewer functionality
│   ├── story-redirect.js     ← redirects story HTML to viewer
│   ├── related-stories.js    ← displays related stories on calculator pages (auto-initializes)
│   ├── a11y.js               ← reusable accessibility patterns (tooltips, focus mgmt)
│   ├── analytics.js          ← event tracking
│   ├── home.js               ← home page functionality
│   ├── home-alert.js         ← site alert banner
│   ├── news.js               ← news page functionality
│   ├── news-latest-redirect.js ← redirects to latest news issue
│   └── news-archive.js       ← news archive functionality
│
├── assets/
│   ├── icons/
│   ├── images/
│   │   └── calculators/  ← calculator thumbnails (webp format)
│   │
│   └── data/
│       ├── categories.json        ← story category definitions
│       ├── stories.json           ← story metadata and links
│       ├── calculator-stories.json ← maps calculators to related stories (storyId only)
│       ├── news.json              ← newsletter metadata (no subtitle, price, or layout properties)
│       └── site-alert.json        ← site-wide alert configuration
│
├── legacy/
│   └── (old calculator HTML files)
│
└── docs/
    └── site-structure.md ← this document

## Key Structural Changes

### Documentation
- **package.json** - Provides project metadata and npm scripts (`npm start` for local server)
- **README.md** - Condensed visitor-friendly overview with quick start guide
- **CONTRIBUTING.md** - Comprehensive maintenance and contribution guidelines

### Stories Architecture
Stories are now integrated into the newsletter structure:
- Stories live within newsletter editions at `/news/{edition}/stories/`
- Each story has both HTML and PDF versions for accessibility
- Story images are co-located with the stories in `/news/{edition}/stories/images/`
- The `/stories.html` page displays categories and links to stories
- The `/stories/` viewer displays individual stories loaded from stories.json
- Story metadata is managed via `categories.json` and `stories.json`

### Newsletter Structure
- Each newsletter edition (e.g., `2026-01-05/`) is self-contained
- Editions include their own stories, images, and edition-specific CSS/JS
- Newsletter template.js auto-initializes (no inline scripts, no console.warn calls)
- Newsletter metadata in news.json includes: id, issueNumber, title, tagline, publishedDate, edition, website, sidebarNote, callout, sections, footerNote
- Removed unused properties: subtitle, price, layout

### Calculator Structure
- All calculators follow a consistent pattern: index.html, {name}.js, {name}-init.js, {name}.css
- Related stories are auto-initialized via shared related-stories.js
- No inline JavaScript in any HTML files
- Calculator-to-story mappings in calculator-stories.json (only requires storyId, no category)

### JavaScript Architecture
- All shared scripts auto-initialize where appropriate (related-stories.js, etc.)
- No inline scripts in HTML files
- Consistent init pattern across calculators using separate -init.js files
