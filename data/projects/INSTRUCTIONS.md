# How to add a project

`data/projects/` is **JSON storage for your portfolio cards** — not a CMS.
WordPress / Shopify / Laravel Filament would be what a *product* was built with;
those values go **inside** each project JSON (`framework`, `cms`, `stack`).

The site reads these files at **build time** (static export).

Ignore `INSTRUCTIONS.md` and any file that does not end in `.json` (except `_config.json`).

---

## 1. Create a file

Name it after the project slug:

```
data/projects/my-project.json
```

Minimal example (GitHub only — no live site yet):

```json
{
  "slug": "my-project",
  "name": "My Project",
  "repo": "https://github.com/wpseemol/my-project",
  "github": "https://github.com/wpseemol/my-project",
  "homepage": "",
  "description": "One short sentence for the card.",
  "detail": "Longer note about what you built and why it matters.",
  "screenshot": "/images/projects/my-project.png",
  "framework": "Next.js",
  "cms": "Custom (no CMS)",
  "stack": {
    "frontend": "Next.js · React · TypeScript",
    "backend": "Express · Prisma · MySQL",
    "dashboard": "Vite · React",
    "infra": "Docker"
  },
  "technologies": ["Next.js", "React", "Express", "Prisma", "MySQL"],
  "language": "TypeScript",
  "languages": ["TypeScript", "React"],
  "stars": 0,
  "created": "2026-01-15",
  "updated": "2026-10-29",
  "status": "repo",
  "featured": true
}
```

---

## 2. Field reference

| Field | Required | Notes |
| --- | --- | --- |
| `slug` | yes | Filename without `.json`. Used as React key. |
| `name` | yes | Display title on the card. |
| `repo` / `github` | yes | GitHub URL (either or both). |
| `homepage` | no | Live URL. Leave `""` if not live yet. |
| `description` | yes | Short card blurb. |
| `detail` | no | Longer body (projects page / SEO). |
| `screenshot` | yes* | Path under `public/`, e.g. `/images/projects/slug.png`. |
| `framework` | yes | App framework(s), e.g. `Next.js`, `Next.js + Laravel`. |
| `cms` | yes | `Custom (no CMS)`, `WordPress`, `Shopify`, `Strapi`, etc. |
| `stack` | no | `{ frontend, backend, dashboard, infra }` short strings. |
| `technologies` | yes | Chip list on the card (preferred over `languages`). |
| `language` | yes | Primary language label. |
| `languages` | no | Fallback chips / GitHub language mix. |
| `stars` | no | GitHub stars (number). |
| `created` / `updated` | no | `YYYY-MM-DD` — sorts newest first by `updated`. |
| `status` | no | `"live"` if `homepage` set, else `"repo"`. |
| `featured` | no | `true` = show on home “Recent working projects”. |

\*If the project is not live, you **still provide a screenshot** yourself (see below).

---

## 3. Screenshot (required for the card preview)

1. Put the image here:

   ```
   public/images/projects/<slug>.png
   ```

   (`.webp` or `.jpg` is fine — keep the path in JSON matching the file.)

2. Set in JSON:

   ```json
   "screenshot": "/images/projects/<slug>.png"
   ```

3. **No live link?** Still add the screenshot. Leave `homepage` empty and set `"status": "repo"`. The card links to GitHub; hover still auto-scrolls your screenshot.

4. Prefer a **tall full-page** capture so hover auto-scroll looks good (roughly 1280px wide, several thousand px tall).

---

## 4. Optional: sync from GitHub

If the repo already has an About description / homepage:

```bash
npm run sync:projects -- https://github.com/wpseemol/retail-market
```

This creates/updates `data/projects/<repo-name>.json` from the GitHub API.
You can then rename the file/slug (e.g. to `niyenin.json`) and fill `screenshot` + nicer `name` / `detail` by hand.

Refresh every project that already has a JSON file:

```bash
npm run sync:projects
```

Sync will **not** overwrite a screenshot path you already set, and it will not delete your `detail` text if present.

---

## 5. Pagination (projects page)

- **Home** shows featured projects (all with `"featured": true`), newest first — no pager.
- **`/projects`** paginates the full JSON list.

Change page size in `data/projects/_config.json`:

```json
{
  "pageSize": 4,
  "homeLimit": 4
}
```

- `pageSize` — cards per page on `/projects` (default `4` = 2×2 grid).
- `homeLimit` — max cards on the home “Recent working projects” section (`0` = no limit).

---

## 6. After you add or edit

```bash
npm run build
```

Or just refresh `npm run dev` — Next picks up new JSON on reload.

---

## Checklist for a new project

1. [ ] Add `data/projects/<slug>.json`
2. [ ] Add `public/images/projects/<slug>.png` (your screenshot)
3. [ ] Set `homepage` if live, else `""` + `"status": "repo"`
4. [ ] Set `"featured": true` if it should appear on the home page
5. [ ] Run `npm run build` (or refresh dev)
