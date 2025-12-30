# Budget Calculators

A collection of personal finance calculators and budgeting tools with curated financial literacy content.

**Live Site:** [budgetsteward.github.io/budget-calculators](https://budgetsteward.github.io/budget-calculators/)

---

## What is This?

Budget Calculators is a data-driven static site that provides:
- **Interactive Calculators** - Debt payoff, loan calculations, budget planning tools
- **Financial Stories** - Curated articles and guides on budgeting and personal finance
- **Newsletter Editions** - Organized content delivered in newsletter format

Built with vanilla JavaScript, no frameworks or build tools required.

---

## Features

- **6 Financial Calculators**
  - Accelerated Debt Payoff
  - Debt Payoff Goal
  - Envelope Budget
  - Missing Loan Term
  - Simple Loan
  - Smart Budget Percentages

- **Data-Driven Architecture**
  - JSON-based content management
  - Related stories linking
  - Story categorization
  - Newsletter edition management

- **Modern User Experience**
  - Responsive design
  - Accessible UI patterns
  - PDF + HTML story rendering
  - No inline JavaScript

---

## Technology Stack

- **Frontend:** Vanilla JavaScript, modern CSS
- **Data:** JSON files for content management
- **Hosting:** GitHub Pages
- **Development:** Python HTTP server (no build process)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/budgetsteward/budget-calculators.git
cd budget-calculators

# Start local server
npm start
# or
python -m http.server 8000

# Open in browser
http://localhost:8000
```

---

## Project Structure

```
/calculators/          # Interactive financial calculators
/news/                 # Newsletter editions (YYYY-MM-DD folders)
/stories/              # Story viewer/reader
/assets/data/          # JSON data files driving the site
/templates/            # Templates for calculators and newsletters
/css/                  # Global stylesheets
/js/                   # Shared JavaScript utilities
```

See [docs/site-structure.md](docs/site-structure.md) for the complete structure.

---

## Contributing

We welcome contributions! Whether you want to:
- Add a new calculator
- Write a financial literacy story
- Publish a newsletter edition
- Fix a bug or improve documentation

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to contribute to this project.

---

## Data Files

The site is driven by JSON configuration files in `assets/data/`:
- `stories.json` - Story metadata and file paths
- `news.json` - Newsletter edition structure
- `calculator-stories.json` - Related stories mapping
- `categories.json` - Story categorization
- `site-alert.json` - Homepage notification system

---

## Code Conventions

- **No inline JavaScript** - All scripts auto-initialize
- **Consistent naming** - Calculator files follow `{name}.js`, `{name}-init.js`, `{name}.css`
- **Shared utilities** - Use `js/utils.js` for common functions
- **Relative paths** - All assets use workspace-relative paths

---

## License

MIT License

---

## Contact

Questions? Contact Dennis: **[budgetsteward@gmail.com](mailto:budgetsteward@gmail.com)**
