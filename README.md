# wpseemol.site — Seemol Chakroborti Portfolio

Developer portfolio for **Seemol Chakroborti (wpseemol)** — full-stack web developer.
Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, GSAP and three.js.

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

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical origin, e.g. `https://wpseemol.site`. Falls back to `data/seo.json`. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional | Google Search Console HTML-tag verification code. |
| `RESEND_API_KEY` | Optional | Enables real contact-form delivery. Without it the form falls back to opening the visitor's email app. |
| `CONTACT_TO_EMAIL` | Optional | Where enquiries are sent. Defaults to `wpseemol@gmail.com`. |
| `CONTACT_FROM_EMAIL` | Optional | Verified Resend sender, e.g. `Portfolio <hello@wpseemol.site>`. |

**To turn the contact form into real email delivery:** create a free account at
[resend.com](https://resend.com), verify `wpseemol.site` as a sending domain, create an
API key, and set `RESEND_API_KEY` + `CONTACT_FROM_EMAIL`. Nothing else needs to change.

---

## Editing content

All copy and data lives in two JSON files. **You never need to touch a component to
update the site's content.**

### `data/site.json`

| Key | What it controls |
|---|---|
| `profile` | Name, role, bio, availability, location, email, portrait paths |
| `stats` | The three counters (years, projects, clients) |
| `socials` | GitHub / LinkedIn / Facebook / email links |
| `codeSnippet` | The self-typing code card in the hero |
| `services` | The four service offerings and their deliverables |
| `stack` | Technology list and skill-bar percentages |
| `projects` | Portfolio projects and their build notes |
| `process` | The five-stage "how a project runs" timeline |
| `faq` | FAQ entries — these also feed the FAQ rich result on Google |

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
- `Service` × 4 with offer catalogues
- `ItemList` of projects as `SoftwareSourceCode`
- `FAQPage` (eligible for the FAQ rich result)
- `BreadcrumbList` on every subpage

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
│   │   ├── ThreeBackground.tsx   ← scroll-reactive 3D lattice
│   │   ├── ThemeProvider.tsx     ← dark/light + no-flash script
│   │   ├── ThemeToggle.tsx       ← animated sun/moon switch
│   │   ├── Reveal.tsx            ← GSAP scroll animations
│   │   ├── Hero.tsx | Nav.tsx | Footer.tsx | Blocks.tsx
│   │   ├── ContactForm.tsx | Section.tsx | Icons.tsx
│   └── lib/seo.ts            ← metadata + JSON-LD generators
└── vercel.json               ← redirects for old URLs
```

---

## Design notes

- **Palette:** violet `#6C4CF5` → magenta `#E5468B`, on near-black `#0A0912` (dark) or cool lavender `#EFEDF5` (light).
- **Type:** Bricolage Grotesque (display), Manrope (body), JetBrains Mono (labels and code).
- **Structure:** sections are labelled as API routes (`GET /services`, `POST /contact`) rather than generic numbering — it fits a backend developer and encodes what each section does.
- **Signature:** the three.js lattice — a wireframe icosahedron core wrapped in an orbiting node field that disperses and shifts hue as you scroll, with pointer parallax.

### Accessibility & performance

- `prefers-reduced-motion` is respected everywhere — GSAP reveals, the 3D scene, the theme wipe and the typing effect all become instant.
- Content is hidden for animation **only when JavaScript is running**, so a failed script or a no-JS crawler still sees every word.
- Keyboard focus rings, skip-to-content link, ARIA labelling on the nav, FAQ accordion and form.
- The 3D scene pauses when the tab is hidden, halves its node count on mobile, and falls back to a CSS gradient if WebGL is unavailable.
- All pages are statically prerendered; shared JS is ~103 kB.

---

## Licence

Content and images © Seemol Chakroborti. Code MIT.
