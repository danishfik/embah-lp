# Embah - Landing Page

Landing page for **Embah**, a homestyle food business offering daily lunch &
dinner orders, event packages, and catering. Built with Vite + TypeScript and
animated with [GSAP ScrollTrigger](https://gsap.com/scroll/).

## Development

```bash
npm install
npm run dev       # local dev server with hot reload
npm run build     # production build -> dist/
npm run preview   # preview the production build locally
```

## Placeholders to replace before launch

- **WhatsApp number**: currently `+60 17-448 8027` (`wa.me/60174488027`) with a
  prefilled Malay order-request message - search the codebase for
  `60174488027` in [index.html](index.html) (nav CTA, hero, services, CTA
  section, footer) if the number changes.
- **Address**: footer currently shows `Ipoh, Perak, Malaysia` - update to the
  real location.
- **Photos**: the dashed gold-pattern tiles in the About, Services and Menu
  sections (`.pattern-card`) are stand-ins. Swap the `<div class="pattern-card">`
  blocks for `<img>` tags once real food/event photos are available.
- **Menu items & prices**: sample dishes in the `#menu` section - update names,
  descriptions and RM prices to match the real menu.
- **Instagram / Facebook links**: footer social icons currently point to `#`.

## Deploying

### Vercel

Import the repo in Vercel - it auto-detects Vite (`npm run build`, output
`dist`). No extra config needed.

### GitHub Pages

A workflow at [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
builds and deploys `dist/` to GitHub Pages automatically on every push to
`main`. In the repo settings, set **Settings → Pages → Source** to
**GitHub Actions** once, and pushes will deploy automatically.
