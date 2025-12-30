# Contributing to Budget Calculators

Questions? Contact Dennis: **[budgetsteward@gmail.com](mailto:budgetsteward@gmail.com)**

## What's in this repo

### Site entry points
- `/index.html` – Home
- `/calculators.html` – Calculator list
- `/stories.html` – Story list (grouped by category)
- `/news.html` + `/news-archive.html` – Newsletter pages

### Key folders
- `/calculators/<calculator-slug>/` – A calculator (HTML/JS/CSS)
- `/news/<YYYY-MM-DD>/` – A newsletter edition (self-contained)
- `/news/<YYYY-MM-DD>/stories/` – Stories for that edition (HTML + PDF + images)
- `/stories/` – Story viewer (renders story HTML inline; PDF fallback)
- `/templates/` – Starter templates for calculators + newsletter editions
- `/assets/data/` – Data "contracts" the site runs on (JSON)

For the canonical tree, see: `docs/site-structure.md`.

---

## "Data contracts" (the files that drive the site)

These JSON files are the backbone of the site:
- `assets/data/site-alert.json` – site-wide alert content (bell + popover on home)
- `assets/data/categories.json` – story categories shown on `/stories.html`
- `assets/data/news.json` – newsletter edition metadata + section layouts
- `assets/data/stories.json` – story metadata + where each story's HTML/PDF lives
- `assets/data/calculator-stories.json` – mapping of calculators → related stories

If something "mysteriously" doesn't show up on the site, it's usually one of these files is missing something or has the wrong value.

---

## How to update the Site Alert (home page bell)

**File:** `assets/data/site-alert.json`

**Purpose:** Controls whether the alert bell icon on the home page is "lit", and when pressed, what alert message is delivered.

### Structure elements
- `postedAt` (ISO string)
- `heading`
- `title`
- `message`

### Instructions
- Site-alerts are "right-now" messages to deliver notifications to users next time they enter the site. This is mostly used to deliver an informational message (such as an alert to new stories, calculators, newsletters, etc.).
- Set `postedAt` to current date/time (UTC date). Setting a date to the future will keep the alert icon on until that date/time has passed.
- Once the reader reads the alert, localStorage is updates to indicate the date/time alert was read (which controls whether to highlight the bell icon), and then turns the bell icon "off" (assuming `postedAt` is not a future date)
- Keep the message short enough to read easily in the popover.

---

## How to update Story categories (categories list)

**File:** `assets/data/categories.json`

**Purpose:** Allows organization of stories in the `/stories` page by category. Stories can belong to one or more categories.

### Structure elements
An array of:
- `id` (unique, referenced in stories.json)
- `label` (description, used in stories.html)

### Instructions
- Use the `id` to associate a story to a category in `stories.json`.
- Use `/stories.html` to review stories and layout before they appear in a published newsletter.
- Although not directly referenced, the Smart Budget Percentages calculator and Envelope Budget calculator reference many of these categories. Any adjustments you make to categories, you should consider whether any adjustment is desired for these two calculators (optional).

---

## How to Add a New Story

Individual stories are the foundation of a newsletter edition. As a story is written and submitted, it may not yet be known which upcoming edition the story will reside in. The system provides a holding area (`/news/upcoming/stories`) for new stories. Stories can be anything from recent financial news of interest, new Super.com products or features, new customer testimonials, or new or improved calculators or tools available on this site.

This is the "story pipeline" most people follow:

### 1) Register the story

**File:** `assets/data/stories.json`

**Purpose:** Defines the title, description, categories, and names of HTML and PDF documents associated with the story.

#### Structure elements
An array of:
- `id`: story id, serves also as name of story (unique)
- `title`: title of story
- `subtitle`: story sub-title
- `description`: description of story
- `issueId`: date of issue (YYYY-MM-DD) if known, or "upcoming" if unknown
- `categories`: an array of categories this story is related to
- `pdf`: path to story in PDF: `/news/2026-01-05/stories/<story-id>.pdf`
- `html`: path to story: `/news/2026-01-05/stories/<story-id>.html`

#### Instructions
- Add a new entry for the story in the json file. You'll use the elements in following steps. Id must be unique (search to make sure it doesn't exist).
- Use "pending" as folder (instead of YYY-MM-DD) is issueId is unknown.

---

### 2) Write story using Google Docs

Recommend starting from this Google Doc Story Template for consistent delivery format. Use a consistent header area. Keep formatting simple.
- Headings (H1/H2)
- Short paragraphs
- Bullets

---

### 3) Create story images (WEBP + JPG)

Once you've written your story, look for strategic places to place your images. Once you've decided where to locate them within your story, generate the image using your favorite tool. AI generated images can be large. Once generated, ask AI to convert images to either WEBP or JPG format - preferably under 100K per image to keep size of PDF and HTML down (for performance reasons). Insert images into Google Doc as desired.

---

### 4) Export Google Doc to PDF

Place the PDF here:
- `news/YYYY-MM-DD/stories/<story-id>.pdf` (if edition is known)
- `news/upcoming/stories/<story-id>.pdf` (if edition is unknown)

---

### 5) Convert Google Doc to HTML

Use ChatGPT or another tool to convert your Google Doc to HTML. If using ChatGPT, it will extract images into separate files that you can copy. Provide ChatGPT with an existing story HTML file, along with your Google doc and ask it to pattern the generated HTML after the other HTML file (so you get required meta tags, structure, etc.)

Place the HTML here:
- `news/YYYY-MM-DD/stories/<story-id>.html` (if edition is known)
- `news/upcoming/stories/<story-id>.html` (if edition is unknown)

#### Note
- Verify html contains `<article class="card">...</article>` so the story-viewer can inject it cleanly.
- Use relative paths for story-local images like `images/...` (the viewer rewrites them correctly).

The story viewer supports:
- HTML-first rendering (inline, no iframe) for better iOS scrolling
- PDF fallback if HTML fails or doesn't exist

#### Images
Images (for HTML) should be saved in the common images folder for the newsletter:
- `news/YYYY-MM-DD/stories/images/` (story images)
- `news/YYYY-MM-DD/images/` (newsletter/edition hero + thumbnails)

Recommended naming convention for images (to easily identify and move from "upcoming" as needed:
- `story-id-hero.webp`
- `story-id-inline-1.webp`
- `story-id-thumbnail.webp`

---

## How to add a story to the `/stories` page

The `/stories.html` is an editorial feature for now (not accessible via menu options).

Purpose is to be able to organize and eventually filter stories by category, and allow story creators to view how their stories will appear within the story reader.

The `/stories.html` page is built from:
- `assets/data/categories.json` (category ordering + labels)
- `assets/data/stories.json` (story metadata)

### To make a story appear under a category
1. Add the category id to the story's categories array in `stories.json`
2. Confirm the category exists in `categories.json`

---

## How to publish a new newsletter edition

A newsletter edition is a self-contained folder that contains the list of stories to be shared.

`/news/YYYY-MM-DD/`
- `index.html`
- `template.js`
- `template.css`
- `images/`
- `stories/` (HTML + PDF + story images)

Reference structure: `docs/site-structure.md`.

### Step-by-step workflow

1. Confirm the newsletter issue date (`issueId`)
   - Each newsletter is identified by the date it was published `YYYY-MM-DD`.
   - Confirm the desired publish date and create your base folder inside of news: `news/YYYY-MM-DD/`

2. Copy template files to your new folder
   - Copy: `templates/news/` → `news/YYYY-MM-DD/`
   - Once copied, rename `template.html` to `index.html`

3. Register the newsletter
   - **File:** `assets/data/news.json`
   - **Purpose:** Defines the title, tags, and stories associated with this newsletter.
   - **Structure elements:** Recommend copying structure of an existing newsletter.

4. Add the stories for this edition
   - Put story files here (and make sure each story registered in stories.json):
     - `news/YYYY-MM-DD/stories/<story-id>.html`
     - `news/YYYY-MM-DD/stories/<story-id>.pdf`
     - `news/YYYY-MM-DD/stories/images/*` (jpg/webp)

5. Add story cards to the newsletter layout
   - In `assets/data/news.json`, place the story in the desired section/column.
   - Each card references `storyId` and includes its headline/subhead/snippet (and optional photo).

---

## How to associate stories to calculators ("Related Stories")

Not all stories need to be related to a calculator. But when desired, the "Related Stories" block inside calculators is driven by:
- `assets/data/calculator-stories.json` (mapping)
- `assets/data/stories.json` (titles/subtitles/descriptions)

### To add related stories to a calculator
1. Find the calculator slug from its folder name:
   - Example: `calculators/smart-budget/` → slug is `smart-budget`

2. Update `assets/data/calculator-stories.json`:
   - Add entries under that slug.
   - Each entry should include:
     - `storyId` (required)

3. Make sure the story exists in `stories.json`

---

## How to create a new calculator

### 1) Copy the calculator template
Copy:
- `templates/calculator/` → `calculators/<new-slug>/`

### 2) Update calculator HTML
Keep these consistent:
- Header + nav structure
- Link to global CSS: `../../css/base.css`
- Include shared JS if used
- Keep a stable root container for the calculator logic

### 3) Add to calculators list + sitemap
- Add a card/entry in `/calculators.html`
- Add the calculator path to `sitemap.xml`

### 4) (Optional) Add "Related Stories" section
If your calculator layout includes the related stories container (typically `id="related-stories"`), then:
- Add mappings in `assets/data/calculator-stories.json`

---

## Local Development

### Quick Start
```bash
# Clone the repository
git clone https://github.com/budgetsteward/budget-calculators.git
cd budget-calculators

# Start local server
npm start
# or
python -m http.server 8000

# Open in browser
# http://localhost:8000
```

### Technology Stack
- **Vanilla JavaScript** - No frameworks or build tools
- **CSS** - Modern CSS with custom properties
- **JSON** - Data-driven architecture
- **Python HTTP Server** - For local development

### Code Conventions
- **No inline JavaScript** - All JavaScript auto-initializes via `-init.js` files
- **Auto-initialization** - Scripts load and run on DOMContentLoaded
- **Shared utilities** - Use `js/utils.js` for common formatting/parsing
- **Consistent naming** - Calculator files follow `{name}.js`, `{name}-init.js`, `{name}.css`

---

## Styling & UI conventions
- Global styling lives in `css/base.css` (colors, typography, layout, components)
- Prefer reusing existing classes (cards, buttons, etc.)
- Keep buttons consistent:
  - `.btn-primary`
  - `.btn-secondary`

---

## If Something Doesn't Show Up

Quick Troubleshooting check-list:
- Is it registered in the correct JSON file?
- Is the path correct and relative?
- Does the category ID exist?
- Is the issueId correct?
- Did you commit the file?

---

## Questions?

Contact Dennis: **[budgetsteward@gmail.com](mailto:budgetsteward@gmail.com)**
