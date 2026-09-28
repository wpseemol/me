# wpseemol.site — Seemol Chakroborti Portfolio

Developer portfolio for **Seemol Chakroborti (wpseemol)** — full-stack web developer.
Built with Next.js 15 (App Router), TypeScript, **Tailwind CSS v4**, GSAP 3.15 and a
hand-written canvas renderer.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Other commands:

```bash
npm run build      # production build
npm start          # serve the production build
```

Requires Node 18.18+ (Node 20 or 22 recommended).

---

## Deploy to Vercel

### Option A — from the dashboard (easiest)

1. Push this folder to a new GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import that repository.
3. Vercel auto-detects Next.js. Leave every build setting as-is.
4. Add the environment variables below, then click **Deploy**.

### Option B — from the CLI

```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production deploy
```

### Connect the domain

1. In Vercel: **Project → Settings → Domains → Add** → `wpseemol.site`.
2. Add `www.wpseemol.site` too and set it to redirect to the apex domain.
3. At your domain registrar, point DNS at Vercel:
    - `A` record, host `@` → `76.76.21.21`
    - `CNAME` record, host `www` → `cname.vercel-dns.com`
4. Wait for DNS to propagate. Vercel issues the SSL certificate automatically.

> Vercel shows the exact records to use on the Domains screen — if they differ from
> the values above, trust Vercel's.

### Environment variables

Set these under **Project → Settings → Environment Variables**:

| Variable                               | Required    | Purpose                                                                                                |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                 | Recommended | Canonical origin, e.g. `https://wpseemol.site`. Falls back to `data/seo.json`.                         |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional    | Google Search Console HTML-tag verification code.                                                      |
| `RESEND_API_KEY`                       | Optional    | Enables real contact-form delivery. Without it the form falls back to opening the visitor's email app. |
| `CONTACT_TO_EMAIL`                     | Optional    | Where enquiries are sent. Defaults to `wpseemol@gmail.com`.                                            |
| `CONTACT_FROM_EMAIL`                   | Optional    | Verified Resend sender, e.g. `Portfolio <hello@wpseemol.site>`.                                        |

**To turn the contact form into real email delivery:** create a free account at
[resend.com](https://resend.com), verify `wpseemol.site` as a sending domain, create an
API key, and set `RESEND_API_KEY` + `CONTACT_FROM_EMAIL`. Nothing else needs to change.

---

## Editing content

All copy and data lives in two JSON files. **You never need to touch a component to
update the site's content.**

### `data/site.json`

| Key           | What it controls                                               |
| ------------- | -------------------------------------------------------------- |
| `profile`     | Name, role, bio, availability, location, email, portrait paths |
| `stats`       | The three counters (years, projects, clients)                  |
| `socials`     | GitHub / LinkedIn / Facebook / email links                     |
| `codeSnippet` | The self-typing code card in the hero                          |
| `services`    | The four service offerings and their deliverables              |
| `stack`       | Technology list and skill-bar percentages                      |
| `projects`    | Portfolio projects and their build notes                       |
| `process`     | The five-stage "how a project runs" timeline                   |
| `faq`         | FAQ entries — these also feed the FAQ rich result on Google    |

### `data/seo.json`

Everything search-related, in one place:

- `site` — domain, title template, default title/description, theme colours, verification codes
- `keywords` — `primary`, `secondary` and `developer` keyword groups (all merged automatically)
- `pages` — per-page title, description, keywords, sitemap priority and change frequency
- `openGraph` — social share image and dimensions
- `person` — structured-data facts (job title, skills, social profiles)
- `aiSearch` — the summary and crawler allow-list used for AI assistants

Change a value here and it propagates to `<head>`, `sitemap.xml`, `robots.txt`,
the web manifest and all JSON-LD structured data on the next build.

### Replacing photos

Drop new files into `public/images/` using the same filenames, or update the
`portrait` / `portraitMono` paths in `data/site.json`. Square images (1:1) work best.

---

## SEO — what's already set up

**On-page**

- Per-page `<title>`, meta description, keywords and canonical URL
- Open Graph + Twitter Card tags with a 1200×630 share image
- Semantic heading hierarchy, one `<h1>` per page
- Keyword-rich, descriptive `alt` text on every image
- `sitemap.xml` including image entries and `hreflang` alternates
- `robots.txt` with `max-image-preview: large` (needed for large image thumbnails in Google)

**Structured data (JSON-LD)** — validate at [search.google.com/test/rich-results](https://search.google.com/test/rich-results)

- `Person` with `alternateName` (so "wpseemol", "seemol" and the full name all resolve to you)
- `ImageObject` with licence and credit fields — this is what associates your photo with your name in Google Images
- `WebSite`, `ProfilePage`, `AboutPage`, `ContactPage`, `CollectionPage`
- `WebPage` per route with `speakable` (voice assistants read the headline and lede,
  never the navigation)
- `Service` × 4 with offer catalogues
- `ItemList` of projects as `SoftwareSourceCode`
- `FAQPage` (eligible for the FAQ rich result)
- `BreadcrumbList` on every page including home

> Site-wide entities (`Person`, `WebSite`) are emitted once in `layout.tsx`.
> Page-level nodes live in each route, so their `@id`s stay unique and a crawler is
> never told that `/contact` is also the profile page.

**AI search (ChatGPT, Gemini, Claude, Perplexity, DeepSeek)**

- `public/llms.txt` — a plain-language summary of who you are and what you do, written for LLM crawlers
- `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, DeepSeekBot and ~20 others
- The `aiSearch.summary` field in `seo.json` is the canonical description these tools should reuse

### After you deploy — do these four things

1. **Google Search Console** → add `wpseemol.site`, verify, submit `https://wpseemol.site/sitemap.xml`.
2. **Bing Webmaster Tools** → same, and import from Search Console to save time.
3. **Rich Results Test** → paste your URL, confirm Person + FAQ are detected.
4. **Backlinks matter more than markup.** Put `wpseemol.site` in your GitHub profile,
   LinkedIn, Facebook, and any dev community profiles. Use the same photo everywhere —
   that consistency is a large part of how Google connects an image to a person.

> Ranking for your own name usually takes 2–6 weeks after indexing. Competitive
> terms like "next js developer" take much longer and depend on backlinks, not tags.

---

## Project structure

```
├── data/
│   ├── seo.json              ← all SEO config
│   └── site.json             ← all site content
├── public/
│   ├── images/               ← portraits + OG image
│   ├── llms.txt              ← AI crawler summary
│   ├── favicon.ico           ← + icon-192/512, apple-touch, maskable
├── src/
│   ├── app/
│   │   ├── layout.tsx        ← metadata, JSON-LD graph, providers
│   │   ├── page.tsx          ← home
│   │   ├── about|services|projects|contact/page.tsx
│   │   ├── api/contact/route.ts
│   │   ├── sitemap.ts | robots.ts | manifest.ts | not-found.tsx
│   │   └── globals.css       ← design tokens, theme, animations
│   ├── components/
│   │   ├── Logo.tsx              ← the >_wpseemol lockup
│   │   ├── CanvasField.tsx       ← push/pull glyph field (the signature)
│   │   ├── SmoothScroll.tsx      ← Lenis wired into the GSAP ticker
│   │   ├── Intro.tsx             ← boot sequence + shutter reveal
│   │   ├── Cursor.tsx            ← two-part cursor
│   │   ├── Magnetic.tsx          ← magnetic hover wrapper
│   │   ├── Reveal.tsx            ← SplitText / masked / load-in reveals
│   │   ├── ThemeProvider.tsx     ← dark/light + no-flash script
│   │   ├── ThemeToggle.tsx       ← animated sun/moon switch
│   │   ├── Hero.tsx | Nav.tsx | Footer.tsx | Blocks.tsx
│   │   ├── ContactForm.tsx | Section.tsx | Icons.tsx
│   ├── lib/
│   │   ├── seo.ts            ← metadata + JSON-LD generators
│   │   └── intro.ts          ← the "intro finished" gate
├── scripts/
│   └── generate-brand-assets.py  ← regenerates icons + OG card
└── vercel.json               ← redirects for old URLs
```

> There is no `tailwind.config.ts`. Tailwind v4 is configured in CSS — see the
> `@theme` blocks at the top of `src/app/globals.css`.

---

## Design notes

### The logo

`>_wpseemol` — the handle is a shell prompt, so the logo is a shell prompt.

- The chevron is drawn as **SVG**, not typed as a `>` glyph, so its weight and angle
  are identical at 16px and at 512px and never depend on a font loading.
- The underscore is a real block caret that blinks on a `step-end` curve, the way a
  terminal cursor actually behaves. It stops blinking on hover, like a focused input.
- Hovering resolves `wpseemol` out of glyph noise. The animated text is
  `aria-hidden`; the real word sits next to it in a `sr-only` span so screen readers
  never hear the scramble.

Icons and the OG card are generated from the same mark:

```bash
python3 scripts/generate-brand-assets.py   # needs Pillow
```

### Colour

**Signal Blue** `#1B63FF` is the primary — deliberately _not_ Tailwind's default
`#3B82F6`, which is the single most recognisable blue on the web. Phosphor cyan
`#43E4FF` is the only secondary; green is reserved for "available" and never used as
decoration; errors get their own red so they can't be mistaken for brand.

**To change the blue, edit one line.** In `src/app/globals.css`:

```css
--brand-500: #1b63ff; /* ← this one */
```

Everything downstream re-tints: logo, gradients, glow, focus rings, scrollbar,
selection colour and the canvas particles. If you swap the whole ramp, keep
`themeColorLight` / `themeColorDark` in `data/seo.json` in step with `--c-bg`.

One constraint worth knowing: `--grad` runs blue → cyan and is used for _display_
type and graphics. Buttons use `--grad-solid`, which stays inside the blue range,
because white text on the cyan end lands at about 1.9:1 contrast.

### Type

Bricolage Grotesque (display), Manrope (body), JetBrains Mono (labels and code).

### Structure

Sections are labelled as API routes (`GET /services`, `POST /contact`) rather than
generic `01 / 02 / 03` numbering — it fits a backend developer, and the verb encodes
what the section _does_ instead of decorating it.

---

## Motion

Everything runs through **one GSAP ticker**. Lenis, ScrollTrigger and the canvas all
advance inside the same frame in a fixed order, so a scroll-linked animation can
never lag a frame behind the scrollbar driving it.

| Piece         | What it does                                                             |
| ------------- | ------------------------------------------------------------------------ |
| `CanvasField` | Glyph field the cursor **pushes** away and, held down, **pulls** back in |
| `Intro`       | Boot counter `000 → 100`, then three panels shear away on a stagger      |
| `SplitReveal` | Masked line/word reveals via GSAP SplitText                              |
| `MaskReveal`  | Single-block masked reveal, for gradient type                            |
| `Magnetic`    | Buttons lean toward the cursor and spring back                           |
| `Cursor`      | Ring grows over anything clickable, collapses while held                 |
| `TechMarquee` | Speed and direction follow scroll velocity; reverses on scroll-up        |
| `ProcessList` | Spine draws itself as you read; markers light on arrival                 |

**The canvas is the signature.** A few notes on why it's built the way it is:

- Glyphs are **pre-rendered once into a sprite atlas** and blitted with `drawImage`.
  Calling `fillText` several hundred times a frame is what makes canvas text fields
  drop frames; blitting cached bitmaps doesn't.
- Pointer easing uses `gsap.quickTo`, which reuses one tween per axis instead of
  allocating a new one on every `pointermove`.
- Density scales with viewport area but is **capped**, so a 4K monitor doesn't do
  three times the work for the same visual result. DPR is capped at 2.
- The light theme gets the darker half of the colour ramp at roughly half opacity —
  on a pale background the light tints vanish and the mid tints turn into speckle.
- It re-tints on theme change via a `MutationObserver` rather than being rebuilt, and
  stops entirely when the tab is hidden.

The hero tells people the background is interactive, because an interaction nobody
discovers may as well not exist.

### Accessibility & performance

- `prefers-reduced-motion` is respected everywhere — reveals, the canvas, Lenis, the
  theme wipe and the typing effect all become instant or static. Lenis is not even
  instantiated; you get native scrolling.
- Content is hidden for animation **only when JavaScript is running**, so a failed
  script or a no-JS crawler still sees every word.
- The custom cursor never hides the native one, and only activates for
  `(hover: hover) and (pointer: fine)` — a pointer-precision check, not a width check.
- Keyboard focus rings, skip-to-content link, ARIA labelling on the nav, FAQ
  accordion and form.
- Horizontal reveals fall back to vertical below `sm`, because parking an element
  44px off-axis below the fold widens the scroll area on a phone all session.
- All pages are statically prerendered; shared JS is ~103 kB. Removing three.js took
  a large dependency out of the bundle entirely.

---

## Known follow-up

Fonts load from the Google Fonts CDN via a `<link>` in `<head>` (not a CSS `@import`,
which serialises two round trips onto the critical path). Moving to `next/font/google`
would self-host them and remove the third-party connection entirely — a genuine Core
Web Vitals win, and roughly a ten-line change in `layout.tsx`. It needs network access
to `fonts.gstatic.com` at build time, so it was left as a deliberate next step.

---

## Licence

Content and images © Seemol Chakroborti. Code MIT.

bg remove

need rebuild
