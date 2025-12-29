# Budget Calculators (Prototype)

A collection of simple, user-friendly budget calculators and “Budget Daily” newsletter editions (stories in HTML + PDF). This is a work-in-progress prototype.

Questions? Contact Dennis: **[budgetsteward@gmail.com](mailto:budgetsteward@gmail.com)**

## What’s in this repo

### Site entry points

* `/index.html` – Home
* `/calculators.html` – Calculator list
* `/news.html` + `/news-archive.html` – Newsletter pages
* `/stories.html` – Story list (grouped by category) - (future use)

### Key folders

* `/calculators/<calculator-slug>/` – A calculator (HTML/JS/CSS)
* `/news/<YYYY-MM-DD>/` – A newsletter edition (self-contained)
* `/news/<YYYY-MM-DD>/stories/` – Stories for that edition (HTML + PDF + images)
* `/stories/` – Story viewer (renders story HTML inline; PDF fallback)
* `/templates/` – Starter templates for calculators + newsletter editions
* `/assets/data/` – Data “contracts” the site runs on (JSON)

For the canonical tree, see: `docs/site-structure.md`. 

---

## “Data contracts” (the files that drive the site)

These JSON files are the backbone of the site:

* `assets/data/site-alert.json` – site-wide alert content (bell + popover on home) 
* `assets/data/news.json` – newsletter edition metadata + section layouts 
* `assets/data/stories.json` – story metadata + where each story’s HTML/PDF lives 
* `assets/data/categories.json` – story categories shown on `/stories.html` 
* `assets/data/calculator-stories.json` – mapping of calculators → related stories 

If something “mysteriously” doesn’t show up on the site, it’s usually one of these files.

---

## How to update the Site Alert (home page bell)

**File:** `assets/data/site-alert.json` 

Update:

* `postedAt` (ISO string)
* `heading`, `title`, `message`

Notes:

* Changing `postedAt` is a good way to ensure the alert is treated as “new/unread” by the UI logic.
* Keep the message short enough to read easily in the popover.

---

## How to publish a new newsletter edition

A newsletter edition is a self-contained folder:

`/news/YYYY-MM-DD/`

* `index.html`
* `template.js`
* `template.css`
* `images/`
* `stories/` (HTML + PDF + story images)

Reference structure: `docs/site-structure.md`. 

### Step-by-step workflow

1. **Copy the newsletter template**

   * Copy: `templates/news/` → `news/YYYY-MM-DD/`
   * Ensure the folder name uses the edition date.

2. **Add edition metadata**

   * Update: `assets/data/news.json`
   * Add a new item to `issues[]` with:

     * `id` (often the date string)
     * `issueNumber`, `title`, `subtitle`, `publishedDate`
     * sections + items (story cards)
   * Use the existing `2026-01-05` issue as the working example. 

3. **Create the stories for this edition**

   * Put story files here:

     * `news/YYYY-MM-DD/stories/<story-id>.html`
     * `news/YYYY-MM-DD/stories/<story-id>.pdf`
     * `news/YYYY-MM-DD/stories/images/*` (jpg/webp)

4. **Register each story in stories metadata**

   * Update: `assets/data/stories.json`
   * Add a story object:

     * `id`, `title`, `subtitle`, `description`
     * `issueId` (the edition)
     * `categories` (array of category IDs)
     * `pdf` and `html` paths (site-root-relative)
   * Example stories are already in your current `stories.json`. 

5. **Add story cards to the newsletter layout**

   * In `assets/data/news.json`, place the story in the desired section/column.
   * Each card references `storyId` and includes its `headline/subhead/snippet` (and optional `photo`). 

6. **Add the edition to sitemap.xml (and keep it current)**

   * Whenever you add:

     * new calculators
     * new newsletters
     * new story HTML pages
   * Make sure they’re discoverable via sitemap.

---

## How to add a story (Google Doc → images → PDF → HTML)

This is the “story pipeline” most people follow:

### 1) Write in Google Docs

Use a consistent header area (title, subtitle, byline, original date, etc.). Keep formatting simple:

* Headings (H1/H2)
* Short paragraphs
* Bullets

### 2) Create story images (WEBP + JPG)

Where images live:

* `news/YYYY-MM-DD/stories/images/` (story images)
* `news/YYYY-MM-DD/images/` (newsletter/edition hero + thumbnails)

Recommended:

* Use **WEBP** for the site
* Keep **JPG** copies if you want compatibility or reuse elsewhere

Common CLI options (pick what you already have installed):

* `cwebp input.jpg -q 80 -o output.webp`
* ImageMagick: `magick input.png -quality 82 output.jpg`

Naming convention ideas:

* `story-id-hero.webp`
* `story-id-inline-1.webp`
* `story-id-thumbnail.webp`

### 3) Export PDF

Place the PDF here:

* `news/YYYY-MM-DD/stories/<story-id>.pdf`

### 4) Convert to HTML

Currently using ChatGPT for this: keep it consistent with your current story format:

* Use `<article class="card">...</article>` so the story-viewer can inject it cleanly.
* Use relative paths for story-local images like `images/...` (the viewer rewrites them correctly).

Your story viewer supports:

* **HTML-first** rendering (inline, no iframe) for better iOS scrolling
* **PDF fallback** if HTML fails or doesn’t exist 

### 5) Register the story in `assets/data/stories.json`

Make sure:

* `id` matches filename
* `html` path exists
* `pdf` path exists
* `categories` uses valid category IDs from `assets/data/categories.json`  

---

## How to add a story to the Stories page (categories list)

The `/stories.html` page is built from:

* `assets/data/categories.json` (category ordering + labels)
* `assets/data/stories.json` (story metadata) 

To make a story appear under a category:

1. Add the category id to the story’s `categories` array in `stories.json`
2. Confirm the category exists in `categories.json` 

---

## How to associate stories to calculators (“Related Stories”)

The “Related Stories” block inside calculators is driven by:

* `assets/data/calculator-stories.json` (mapping)
* `assets/data/stories.json` (titles/subtitles/descriptions)  

### To add related stories to a calculator

1. Find the calculator slug from its folder name:

   * Example: `calculators/smart-budget/` → slug is `smart-budget`
2. Update `assets/data/calculator-stories.json`:

   * Add entries under that slug.
   * Each entry should include:

     * `storyId` (required)
     * `category` (required by the renderer)
3. Make sure the story exists in `stories.json`

Example mapping file currently contains associations for `smart-budget` and `envelope-budget`. 

---

## How to create a new calculator

### 1) Copy the calculator template

Copy:

* `templates/calculator/` → `calculators/<new-slug>/`

### 2) Update calculator HTML

Keep these consistent:

* Header + nav structure
* Link to global CSS: `../../css/base.css`
* Include shared JS if used
* Keep a stable root container for the calculator logic

### 3) Add to calculators list + sitemap

* Add a card/entry in `/calculators.html`
* Add the calculator path to `sitemap.xml`

### 4) (Optional) Add “Related Stories” section

If your calculator layout includes the related stories container (typically `id="related-stories"`), then:

* Add mappings in `assets/data/calculator-stories.json` 

---

## Newsletter + story “gotchas” (things that commonly break)

### Story viewer URLs

The story viewer supports:

* New: `/stories/?story=<id>`
* Legacy: `/stories/?category=<categoryId>&story=<id>` 

If you ever see redirects to an unexpected viewer URL, verify:

* the viewer links being generated (stories page + related stories)
* the `stories.json` format and story IDs

### `stories.json` shape matters

Your story viewer expects `stories.json` to be a **flat array** of story objects. 

### Relative paths inside story HTML

Story HTML should reference local images like:

* `images/my-image.webp`

The viewer rewrites relative URLs based on the story’s folder automatically. 

---

## Styling & UI conventions

* Global styling lives in `css/base.css` (colors, typography, layout, components) 
* Prefer reusing existing classes (cards, buttons, etc.)
* Keep buttons consistent:

  * `.btn-primary`
  * `.btn-secondary` 

---

## Quick maintenance checklist

When you add or change content, check these:

* **New story**:

  * ✅ `news/YYYY-MM-DD/stories/<id>.html` exists
  * ✅ `news/YYYY-MM-DD/stories/<id>.pdf` exists
  * ✅ `assets/data/stories.json` updated
  * ✅ Category IDs valid in `assets/data/categories.json`
  * ✅ Edition layout updated in `assets/data/news.json` (if story appears in newsletter)

* **New newsletter edition**:

  * ✅ New folder in `/news/YYYY-MM-DD/`
  * ✅ Added to `assets/data/news.json`
  * ✅ Added to sitemap.xml

* **New calculator**:

  * ✅ Folder exists in `/calculators/<slug>/`
  * ✅ Listed on `/calculators.html`
  * ✅ Added to sitemap.xml
  * ✅ (Optional) related stories mapped in `assets/data/calculator-stories.json`
