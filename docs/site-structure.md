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
│   │   └── assets/ (optional)
│   │
│   ├── simple-loan/ *(future)*
│   │   ├── index.html
│   │   ├── simple-loan.js
│   │   ├── simple-loan.css
│   │   └── assets/ (optional)
│   │
│   └── ...(future calculators)
│
├── stories/
│   ├── index.html              ← story viewer page (Option B)
│   │
│   ├── learning-budget/
│   │   ├── story1.pdf
│   │   └── story2.pdf
│   │
│   ├── earning-money/
│   │   ├── story1.pdf
│   │   └── story2.pdf
│   │
│   ├── cutting-costs/
│   │   ├── story1.pdf
│   │   └── story2.pdf
│   │
│   ├── dealing-with-debt/
│   │   ├── story1.pdf
│   │   └── story2.pdf
│   │
│   ├── saving-investing/
│   │   ├── story1.pdf
│   │   └── story2.pdf
│   │
│   ├── money-mindset/
│   │   ├── story1.pdf
│   │   └── story2.pdf
│   │
│   └── life-events/
│       ├── story1.pdf
│       └── story2.pdf
│
├── templates/
│   ├── calculator/
│   │   ├── template.html
│   │   ├── template.js
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
│   ├── stories.js        ← builds story cards on stories.html from stories.json
│   ├── a11y.js           ← reusable accessibility patterns (tooltips, focus mgmt)
│   └── analytics.js      ← optional future event tracking
│
├── assets/
│   ├── icons/
│   ├── images/
│   └── data/
│       └── stories.json  ← story metadata consumed by stories.js and story viewer
│
└── docs/
    ├── site-structure.md ← this document
    ├── i18n-guidelines.md *(future)*
    ├── accessibility-standards.md *(future)*
    └── seo-notes.md *(future)*
