# Squirrel Designer Products

Internal product catalog and pricing tool for Squirrel Designer. Single-page web app
that manages area hierarchy, projects, products, and pricing rules. All data is
persisted in the browser via `localStorage`; the JSON snapshot in this repo is a
reference export.

## Features

- **Area / Project hierarchy** — sidebar with collapsible areas, drag-reorder
- **Product table** — bilingual (EN / 中文), search, filter, batch edit / delete
- **Pricing** — unit / high-end / dealer / cost / design / install fields
- **Cost adjustment** — `Cost1 × (1 + Percent%)` formula preview
- **Special calculation rules** — per-unit / SQM / LM with W × H × D restrictions
- **Import / Export** — JSON or Excel (via SheetJS)
- **Bilingual UI** — 中文 / English toggle

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Single-page app (all CSS / JS inlined) |
| `products.json` | Sample data snapshot (exported from localStorage) |
| `import_excel.py` | One-off Python script: load Excel into the JSON schema |
| `import_excel_new.py` | Newer variant of the importer |

## Local dev

No build step. Open `index.html` directly in a browser, or serve it:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Data

- User data is stored in `localStorage` under `pm_products`, `pm_areas`, `pm_areasOrder`, `pm_projectsOrder`.
- Use **Export JSON** in the app to download a backup; **Import JSON** to restore.
- Use **Save Local** to snapshot current state to `localStorage`.
