# Level Design

A bespoke dining table studio based in Melbourne, Australia. Level Design crafts solid timber dining tables made to order — every piece designed around the client's space, style, and how they live.

**Live site:** [leveldesign.com.au](https://leveldesign.com.au)

---

## What it does

This is the marketing and enquiry website for Level Design. It showcases the table collection, explains the custom order process, and handles inbound enquiries via Netlify Forms.

Key pages:
- `/tables` — full collection with individual product detail pages
- `/custom` — bespoke commission process and brief form
- `/about` — studio story and trade enquiry
- `/contact` — general contact form
- `/melbourne-custom-dining-tables` — local SEO landing page

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Astro 5](https://astro.build) (static site) |
| UI components | React 18 (islands architecture) |
| Styling | Tailwind CSS v4 |
| Forms | Netlify Forms (no backend required) |
| Analytics | Google Analytics 4 |
| Hosting | Netlify |
| 3D model | `<model-viewer>` web component (Pillar table) |

---

## Local development

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # production build → dist/
npm run preview   # preview the build
```

Requires Node 20+.

---

## Deployment

Deployed automatically via Netlify on push to `main`. Build command and publish directory are configured in [`netlify.toml`](netlify.toml).
