# Site Structure

/
├── index.html
├── calculators.html
├── stories.html
│
├── calculators/
│   ├── smart-budget/
│   │   ├── index.html
│   │   ├── smart-budget.js
│   │   ├── smart-budget.css
│   │   └── assets/ (optional)
│   │
│   ├── missing-loan-term/
│   │   ├── index.html
│   │   ├── missing-loan-term.js
│   │   ├── missing-loan-term.css
│   │   └── assets/
│   │
│   ├── simple-loan/ *(future)*
│   │   ├── index.html
│   │   ├── simple-loan.js
│   │   ├── simple-loan.css
│   │   └── assets/
│   │
│   └── ...(future calculators)
│
├── stories/
│   ├── getting-started/
│   │   ├── index.html
│   │   ├── getting-started.css
│   │   └── assets/
│   │
│   └── ...(future stories)
│
├── templates/
│   ├── calculator/
│   │   ├── template.html
│   │   ├── template.js
│   │   └── template.css
│   │
│   ├── story/
│   │   ├── template.html
│   │   ├── template.js   *(optional — if stories need JS)*
│   │   └── template.css
│   │
│   └── ...(future template types)
│
├── css/
│   ├── base.css          ← global typography, layout, colors, accessibility
│   ├── layout.css        ← optional additional layout helpers
│   └── components.css    ← optional shared UI components
│
├── js/
│   ├── utils.js          ← shared formatting, math helpers, a11y helpers
│   ├── a11y.js           ← reusable accessibility patterns (tooltips, focus mgmt)
│   └── analytics.js      ← optional future event tracking
│
├── assets/
│   ├── icons/
│   ├── images/
│   └── data/
│
└── docs/
    ├── site-structure.md ← this document
    ├── i18n-guidelines.md *(future)*
    ├── accessibility-standards.md *(future)*
    └── seo-notes.md *(future)*
