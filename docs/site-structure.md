# Site Structure

/
├── index.html
├── calculators.html
├── stories.html             ← displays story categories and links
├── news.html
├── news-archive.html
├── README.md
│
├── calculators/
│   ├── smart-budget/
│   │   ├── index.html
│   │   ├── smart-budget.js
│   │   └── smart-budget.css
│   │
│   ├── envelope-budget/
│   │   ├── index.html
│   │   ├── envelope-budget.js
│   │   └── envelope-budget.css
│   │
│   ├── missing-loan-term/
│   │   ├── index.html
│   │   ├── missing-loan-term.js
│   │   └── missing-loan-term.css
│   │
│   ├── simple-loan/
│   │   ├── index.html
│   │   ├── simple-loan.js
│   │   └── simple-loan.css
│   │
│   ├── accelerated-debt-payoff/
│   │   ├── index.html
│   │   ├── accelerated-debt-payoff.js
│   │   ├── accelerated-debt-payoff.css
│   │   └── accelerated-debt-payoff-init.js
│   │
│   └── debt-payoff-goal/
│       ├── index.html
│       ├── debt-payoff-goal.js
│       ├── debt-payoff-goal.css
│       └── debt-payoff-goal-init.js
│
├── stories/
│   └── index.html               ← story viewer page (displays individual stories)
│
├── news/                        ← newsletter/edition structure
│   ├── 2025-12-22/
│   │   └── index.html
│   │
│   └── 2026-01-05/             ← latest newsletter edition
│       ├── index.html
│       ├── template.js         ← newsletter-specific scripts
│       ├── template.css        ← newsletter-specific styles
│       ├── images/             ← newsletter images (hero, thumbnails, etc.)
│       │
│       └── stories/            ← stories bundled with this newsletter edition
│           ├── getting-started-with-your-budget.html
│           ├── getting-started-with-your-budget.pdf
│           ├── zero-based-budgeting.html
│           ├── zero-based-budgeting.pdf
│           ├── reduce-bills.html
│           ├── reduce-bills.pdf
│           ├── why-budgets-fail.html
│           ├── why-budgets-fail.pdf
│           ├── budgeting-for-your-first-apartment.html
│           ├── budgeting-for-your-first-apartment.pdf
│           └── images/         ← all story images (jpg and webp)
│
├── templates/
│   ├── calculator/
│   │   ├── template.html
│   │   ├── template.js
│   │   └── template.css
│   │
│   ├── news/
│   │   ├── template.html
│   │   ├── template.js
│   │   ├── template.css
│   │   └── images/
│   │
│   └── story/
│       └── (story templates)
│
├── css/
│   ├── base.css          ← global typography, layout, colors, accessibility
│   ├── layout.css        ← layout helpers
│   └── components.css    ← shared UI components
│
├── js/
│   ├── utils.js          ← shared formatting, math helpers, a11y helpers
│   ├── stories.js        ← builds story cards on stories.html from categories.json
│   ├── story-viewer.js   ← handles story viewer functionality
│   ├── related-stories.js ← displays related stories on calculator pages
│   ├── a11y.js           ← reusable accessibility patterns (tooltips, focus mgmt)
│   ├── analytics.js      ← event tracking
│   ├── home.js           ← home page functionality
│   ├── home-alert.js     ← site alert banner
│   ├── news.js           ← news page functionality
│   └── news-archive.js   ← news archive functionality
│
├── assets/
│   ├── icons/
│   ├── images/
│   │   └── calculators/  ← calculator thumbnails (webp format)
│   │
│   └── data/
│       ├── categories.json        ← story category definitions
│       ├── stories.json           ← story metadata and links
│       ├── calculator-stories.json ← maps calculators to related stories
│       ├── news.json              ← news/newsletter metadata
│       └── site-alert.json        ← site-wide alert configuration
│
├── legacy/
│   └── (old calculator HTML files)
│
└── docs/
    └── site-structure.md ← this document

## Key Structural Changes

### Stories Architecture
Stories are now integrated into the newsletter structure:
- Stories live within newsletter editions at `/news/{edition}/stories/`
- Each story has both HTML and PDF versions for accessibility
- Story images are co-located with the stories in `/news/{edition}/stories/images/`
- The `/stories.html` page displays categories and links to stories
- Story metadata is managed via `categories.json` and `stories.json`

### Newsletter Structure
- Each newsletter edition (e.g., `2026-01-05/`) is self-contained
- Editions include their own stories, images, and edition-specific CSS/JS
- Newsletter metadata is managed via `news.json`
