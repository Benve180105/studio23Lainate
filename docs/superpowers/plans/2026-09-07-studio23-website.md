# Studio23 Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Studio23 one-page marketing site (Astro + Tailwind, content editable via Decap CMS, deployed on Netlify) as specified in the design doc.

**Architecture:** Astro static site with Content Collections as the single source of truth for editable text (hero, servizi, team, contatti). Decap CMS writes to those same collection files via Netlify Identity + Git Gateway, so no separate database or API layer exists — every edit is a Git commit. Presentational components are pure/no-JS where possible; the only client-side JS is scroll-spy, scroll-reveal, and the mobile menu toggle, each isolated in small testable modules.

**Tech Stack:** Astro (static output), Tailwind CSS, Vitest (for pure-logic unit tests), Decap CMS (`git-gateway` backend), Netlify Forms (contact form), Netlify hosting.

**Spec:** [docs/superpowers/specs/2026-09-07-studio23-website-design.md](../specs/2026-09-07-studio23-website-design.md)

## Global Constraints

- One-page site only: Home/Hero, Servizi, Team, Contatti — no blog, no multi-page routing, no booking system (out of scope per spec).
- Animations: subtle scroll-reveal + micro-interactions only, no parallax; must respect `prefers-reduced-motion`.
- CMS-editable content lives ONLY in `src/content/**` — components must read from content collections, never hardcode copy that the client needs to edit (hero headline, service text, team bios, contact info/hours).
- Brand palette is a **placeholder approximation** (exact hex/logo not yet available from the client) — defined once as CSS variables / Tailwind theme tokens in Task 3, referenced everywhere else, so swapping to real brand colors later is a one-file change.
- Images are **placeholders**: `picsum.photos` (seeded, so they're stable across reloads) for photos, hand-written inline SVG for icons — no binary image assets committed to the repo yet.
- Contact form uses **Netlify Forms** (`data-netlify="true"`), no custom backend.
- Node/npm project; package manager is npm.

---

## File Structure

```
package.json
astro.config.mjs
tailwind.config.mjs
netlify.toml
vitest.config.ts
src/
  content/
    config.ts                  # zod schemas for all collections
    hero/hero.md
    contatti/info.md
    servizi/fisioterapia.md
    servizi/nutrizione.md
    team/alessandro-lanza.md
    team/vanessa-bernardo.md
  lib/
    opening-hours.ts            # isStudioOpen() pure function
    opening-hours.test.ts
    scroll-utils.ts              # getActiveSection() pure function
    scroll-utils.test.ts
  content.test.ts                # frontmatter validation for all collections
  layouts/
    BaseLayout.astro
  styles/
    global.css                  # design tokens, prefers-reduced-motion rules
  scripts/
    scroll-reveal.ts             # IntersectionObserver reveal-on-scroll
    navbar.ts                    # mobile menu + scroll-spy wiring (uses scroll-utils)
  components/
    Navbar.astro
    Hero.astro
    ServiceCard.astro
    ServicesSection.astro
    TeamMember.astro
    TeamSection.astro
    ContactSection.astro
    Footer.astro
    icons/
      PhysioIcon.astro
      NutritionIcon.astro
  pages/
    index.astro
public/
  admin/
    index.html
    config.yml
```

---

### Task 1: Project scaffold — Astro + Tailwind + Vitest

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tailwind.config.mjs`, `vitest.config.ts`, `.gitignore`, `src/pages/index.astro` (placeholder), `src/styles/global.css`

**Interfaces:**
- Produces: a working `npm run dev` / `npm run build` / `npm run test` pipeline that every later task builds on.

- [ ] **Step 1: Scaffold Astro**

```bash
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git --yes
```

- [ ] **Step 2: Add Tailwind integration**

```bash
npm install
npx astro add tailwind --yes
```

- [ ] **Step 3: Add Vitest**

```bash
npm install -D vitest
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

Add to `package.json` scripts:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "test": "vitest run"
}
```

- [ ] **Step 4: Verify the pipeline works**

Run: `npm run build`
Expected: build succeeds, `dist/` is generated, no errors.

Run: `npm run test`
Expected: "No test files found" (fine — no tests written yet) but the command exits 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tailwind.config.mjs vitest.config.ts .gitignore src
git commit -m "chore: scaffold Astro + Tailwind + Vitest project"
```

---

### Task 2: Content collections — schema + seed content

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/hero/hero.md`, `src/content/contatti/info.md`, `src/content/servizi/fisioterapia.md`, `src/content/servizi/nutrizione.md`, `src/content/team/alessandro-lanza.md`, `src/content/team/vanessa-bernardo.md`
- Test: `src/content.test.ts`

**Interfaces:**
- Produces: `heroCollection`, `contattiCollection`, `serviziCollection`, `teamCollection` schemas — every later component reads via `getCollection('servizi')`, `getEntry('hero', 'hero')`, etc., with the field names defined here.

- [ ] **Step 1: Write the failing test**

```ts
// src/content.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

function readFrontmatter(relPath: string) {
  const full = path.join(process.cwd(), relPath);
  const raw = fs.readFileSync(full, 'utf-8');
  return matter(raw).data;
}

describe('content frontmatter', () => {
  it('hero has headline, subtitle, cta_text', () => {
    const fm = readFrontmatter('src/content/hero/hero.md');
    expect(fm.headline).toBeTypeOf('string');
    expect(fm.subtitle).toBeTypeOf('string');
    expect(fm.cta_text).toBeTypeOf('string');
  });

  it('contatti has address, phones, email, hours', () => {
    const fm = readFrontmatter('src/content/contatti/info.md');
    expect(fm.address).toBeTypeOf('string');
    expect(fm.email).toBeTypeOf('string');
    expect(Array.isArray(fm.phones)).toBe(true);
    expect(Array.isArray(fm.hours)).toBe(true);
    expect(fm.hours[0]).toHaveProperty('days');
    expect(fm.hours[0]).toHaveProperty('time');
  });

  it.each(['fisioterapia', 'nutrizione'])('servizio %s has title, description, order', (slug) => {
    const fm = readFrontmatter(`src/content/servizi/${slug}.md`);
    expect(fm.title).toBeTypeOf('string');
    expect(fm.description).toBeTypeOf('string');
    expect(fm.order).toBeTypeOf('number');
  });

  it.each(['alessandro-lanza', 'vanessa-bernardo'])('team member %s has name, role, bio, order', (slug) => {
    const fm = readFrontmatter(`src/content/team/${slug}.md`);
    expect(fm.name).toBeTypeOf('string');
    expect(fm.role).toBeTypeOf('string');
    expect(fm.bio).toBeTypeOf('string');
    expect(fm.order).toBeTypeOf('number');
  });
});
```

- [ ] **Step 2: Install gray-matter and run the test to verify it fails**

```bash
npm install -D gray-matter
npm run test
```

Expected: FAIL — content files don't exist yet.

- [ ] **Step 3: Write the content collection schema**

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const hero = defineCollection({
  type: 'content',
  schema: z.object({
    headline: z.string(),
    subtitle: z.string(),
    cta_text: z.string(),
  }),
});

const contatti = defineCollection({
  type: 'content',
  schema: z.object({
    address: z.string(),
    phones: z.array(z.string()),
    email: z.string().email(),
    hours: z.array(z.object({ days: z.string(), time: z.string() })),
  }),
});

const servizi = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
  }),
});

const team = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    order: z.number(),
  }),
});

export const collections = { hero, contatti, servizi, team };
```

- [ ] **Step 4: Write the seed content**

```md
<!-- src/content/hero/hero.md -->
---
headline: "Trova la soluzione vera al tuo problema"
subtitle: "Fisioterapia, osteopatia e nutrizione a Lainate: un percorso su misura per stare meglio, senza perdere altro tempo."
cta_text: "Prenota una visita"
---
```

```md
<!-- src/content/contatti/info.md -->
---
address: "Via Prima Strada 23/B, Lainate (MI)"
email: "info@studio23lainate.it"
phones:
  - "347 339 3314"
  - "333 219 7073"
hours:
  - days: "Lunedì - Venerdì"
    time: "16:00 - 20:00"
  - days: "Sabato"
    time: "08:00 - 12:00"
---
```

```md
<!-- src/content/servizi/fisioterapia.md -->
---
title: "Fisioterapia & Osteopatia"
description: "Trattamenti mirati per il recupero muscolo-scheletrico, manipolazioni vertebrali e riabilitazione personalizzata."
order: 1
---
```

```md
<!-- src/content/servizi/nutrizione.md -->
---
title: "Dietetica & Nutrizione"
description: "Percorsi nutrizionali su misura, con particolare attenzione ai disturbi digestivi e al benessere a lungo termine."
order: 2
---
```

```md
<!-- src/content/team/alessandro-lanza.md -->
---
name: "Dr. Alessandro Lanza"
role: "Fisioterapista"
bio: "Specializzato in manipolazioni vertebrali e riabilitazione muscolo-scheletrica."
order: 1
---
```

```md
<!-- src/content/team/vanessa-bernardo.md -->
---
name: "Dr. Vanessa Bernardo"
role: "Dietista"
bio: "Specializzata in percorsi nutrizionali per disturbi digestivi e benessere generale."
order: 2
---
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npm run test
```

Expected: all frontmatter tests PASS.

- [ ] **Step 6: Verify Astro's own schema validation**

```bash
npm run build
```

Expected: build succeeds (Astro validates the same frontmatter against the zod schema at build time — this is the second, stricter layer of validation).

- [ ] **Step 7: Commit**

```bash
git add src/content src/content.test.ts package.json package-lock.json
git commit -m "feat: add content collections schema and seed content"
```

---

### Task 3: Design tokens & global styles

**Files:**
- Modify: `tailwind.config.mjs`
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: Tailwind theme colors `brand-primary`, `brand-primary-dark`, `brand-accent`, `brand-bg`, `brand-ink` — every component in later tasks uses these token names instead of raw hex values.

- [ ] **Step 1: Extend Tailwind theme with placeholder brand tokens**

```js
// tailwind.config.mjs
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./src/**/*.{astro,html,js,ts}'],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#0F766E',
        'brand-primary-dark': '#0B5A54',
        'brand-accent': '#F4A261',
        'brand-bg': '#FAFAF9',
        'brand-ink': '#1F2937',
      },
      fontFamily: {
        sans: ['"Inter"', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Global styles + reduced-motion baseline**

```css
/* src/styles/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-brand-bg text-brand-ink font-sans antialiased;
}

.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 400ms ease-out, transform 400ms ease-out;
}

.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 3: Verify build still passes**

```bash
npm run build
```

Expected: build succeeds, no Tailwind/CSS errors.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.mjs src/styles/global.css
git commit -m "feat: add placeholder brand design tokens and reduced-motion base styles"
```

---

### Task 4: Opening-hours logic (`isStudioOpen`)

**Files:**
- Create: `src/lib/opening-hours.ts`
- Test: `src/lib/opening-hours.test.ts`

**Interfaces:**
- Consumes: `hours: {days: string, time: string}[]` (shape produced by the `contatti` collection in Task 2).
- Produces: `isStudioOpen(hours, now: Date): boolean` — used by `ContactSection.astro` in Task 10 to render the "aperto ora" badge.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/opening-hours.test.ts
import { describe, it, expect } from 'vitest';
import { isStudioOpen } from './opening-hours';

const hours = [
  { days: 'Lunedì - Venerdì', time: '16:00 - 20:00' },
  { days: 'Sabato', time: '08:00 - 12:00' },
];

describe('isStudioOpen', () => {
  it('is open on a weekday afternoon within range', () => {
    const wed5pm = new Date('2026-09-09T17:00:00'); // Wednesday
    expect(isStudioOpen(hours, wed5pm)).toBe(true);
  });

  it('is closed on a weekday morning', () => {
    const wed10am = new Date('2026-09-09T10:00:00');
    expect(isStudioOpen(hours, wed10am)).toBe(false);
  });

  it('is open on Saturday morning within range', () => {
    const sat9am = new Date('2026-09-12T09:00:00'); // Saturday
    expect(isStudioOpen(hours, sat9am)).toBe(true);
  });

  it('is closed on Sunday regardless of time', () => {
    const sun5pm = new Date('2026-09-13T17:00:00'); // Sunday
    expect(isStudioOpen(hours, sun5pm)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- opening-hours
```

Expected: FAIL — `isStudioOpen` not defined.

- [ ] **Step 3: Implement**

```ts
// src/lib/opening-hours.ts
type HourRange = { days: string; time: string };

const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

function dayMatches(daysLabel: string, dayName: string): boolean {
  const normalized = daysLabel.toLowerCase();
  if (normalized.includes(' - ')) {
    const [startLabel, endLabel] = normalized.split(' - ').map((s) => s.trim());
    const startIdx = DAY_NAMES.indexOf(startLabel);
    const endIdx = DAY_NAMES.indexOf(endLabel);
    const dayIdx = DAY_NAMES.indexOf(dayName);
    if (startIdx === -1 || endIdx === -1 || dayIdx === -1) return false;
    // Only supports non-wrapping ranges (e.g. lunedì - venerdì), which covers this studio's hours.
    return dayIdx >= startIdx && dayIdx <= endIdx;
  }
  return normalized.includes(dayName);
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function isStudioOpen(hours: HourRange[], now: Date): boolean {
  const dayName = DAY_NAMES[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return hours.some((range) => {
    if (!dayMatches(range.days, dayName)) return false;
    const [startLabel, endLabel] = range.time.split(' - ').map((s) => s.trim());
    const start = timeToMinutes(startLabel);
    const end = timeToMinutes(endLabel);
    return nowMinutes >= start && nowMinutes < end;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- opening-hours
```

Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/opening-hours.ts src/lib/opening-hours.test.ts
git commit -m "feat: add isStudioOpen pure logic with tests"
```

---

### Task 5: Scroll-spy logic (`getActiveSection`)

**Files:**
- Create: `src/lib/scroll-utils.ts`
- Test: `src/lib/scroll-utils.test.ts`

**Interfaces:**
- Consumes: `sections: {id: string, top: number}[]`, `scrollY: number`.
- Produces: `getActiveSection(sections, scrollY): string` — used by `src/scripts/navbar.ts` in Task 6 to highlight the current nav link.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/scroll-utils.test.ts
import { describe, it, expect } from 'vitest';
import { getActiveSection } from './scroll-utils';

const sections = [
  { id: 'home', top: 0 },
  { id: 'servizi', top: 800 },
  { id: 'team', top: 1600 },
  { id: 'contatti', top: 2400 },
];

describe('getActiveSection', () => {
  it('returns the first section at scrollY 0', () => {
    expect(getActiveSection(sections, 0)).toBe('home');
  });

  it('returns the section whose top is the closest one at or before scrollY', () => {
    expect(getActiveSection(sections, 850)).toBe('servizi');
  });

  it('returns the last section when scrolled past all tops', () => {
    expect(getActiveSection(sections, 5000)).toBe('contatti');
  });

  it('returns the first section id when sections list has one entry', () => {
    expect(getActiveSection([{ id: 'only', top: 0 }], 300)).toBe('only');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- scroll-utils
```

Expected: FAIL — `getActiveSection` not defined.

- [ ] **Step 3: Implement**

```ts
// src/lib/scroll-utils.ts
type Section = { id: string; top: number };

export function getActiveSection(sections: Section[], scrollY: number): string {
  const sorted = [...sections].sort((a, b) => a.top - b.top);
  let active = sorted[0].id;
  for (const section of sorted) {
    if (scrollY >= section.top) {
      active = section.id;
    }
  }
  return active;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- scroll-utils
```

Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/scroll-utils.ts src/lib/scroll-utils.test.ts
git commit -m "feat: add getActiveSection pure logic with tests"
```

---

### Task 6: Navbar (sticky, hamburger, scroll-spy, "aperto ora" badge)

**Files:**
- Create: `src/components/Navbar.astro`
- Create: `src/scripts/navbar.ts`

**Interfaces:**
- Consumes: `getActiveSection` (Task 5), `isStudioOpen` (Task 4), `contatti` collection entry (Task 2).
- Produces: `<Navbar />` component consumed by `src/pages/index.astro` in Task 12. Renders `<nav id="site-nav">` with links `#home #servizi #team #contatti` and a `<span id="open-badge">`.

- [ ] **Step 1: Write the component**

```astro
---
// src/components/Navbar.astro
import { getEntry } from 'astro:content';
import { isStudioOpen } from '../lib/opening-hours';

const contatti = await getEntry('contatti', 'info');
const open = isStudioOpen(contatti!.data.hours, new Date());

const links = [
  { id: 'home', label: 'Home' },
  { id: 'servizi', label: 'Servizi' },
  { id: 'team', label: 'Team' },
  { id: 'contatti', label: 'Contatti' },
];
---
<header class="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur transition-shadow" id="site-header">
  <nav id="site-nav" class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
    <a href="#home" class="font-semibold text-brand-primary-dark">Studio23</a>

    <button id="menu-toggle" class="md:hidden" aria-label="Apri menu" aria-expanded="false">
      <span class="block h-0.5 w-6 bg-brand-ink"></span>
      <span class="mt-1 block h-0.5 w-6 bg-brand-ink"></span>
      <span class="mt-1 block h-0.5 w-6 bg-brand-ink"></span>
    </button>

    <ul id="nav-links" class="hidden gap-6 md:flex">
      {links.map((l) => (
        <li>
          <a href={`#${l.id}`} data-nav-link={l.id} class="text-brand-ink hover:text-brand-primary">
            {l.label}
          </a>
        </li>
      ))}
    </ul>

    <span id="open-badge" class:list={[
      'hidden rounded-full px-3 py-1 text-xs font-medium md:inline-block',
      open ? 'bg-brand-primary/10 text-brand-primary-dark' : 'bg-gray-200 text-gray-600',
    ]}>
      {open ? 'Aperto ora' : 'Chiuso ora'}
    </span>
  </nav>

  <ul id="mobile-nav-links" class="hidden flex-col gap-2 bg-brand-bg px-4 pb-4 md:hidden">
    {links.map((l) => (
      <li>
        <a href={`#${l.id}`} data-nav-link={l.id} class="block py-2 text-brand-ink">
          {l.label}
        </a>
      </li>
    ))}
  </ul>
</header>

<script src="../scripts/navbar.ts"></script>
```

- [ ] **Step 2: Write the client script wiring scroll-spy + mobile toggle**

```ts
// src/scripts/navbar.ts
import { getActiveSection } from '../lib/scroll-utils';

const sectionIds = ['home', 'servizi', 'team', 'contatti'];

function updateActiveLink() {
  const sections = sectionIds
    .map((id) => {
      const el = document.getElementById(id);
      return el ? { id, top: el.offsetTop - 80 } : null;
    })
    .filter((s): s is { id: string; top: number } => s !== null);

  if (sections.length === 0) return;

  const activeId = getActiveSection(sections, window.scrollY);
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.classList.toggle('text-brand-primary', link.getAttribute('data-nav-link') === activeId);
  });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });
window.addEventListener('load', updateActiveLink);

const toggle = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('mobile-nav-links');

toggle?.addEventListener('click', () => {
  const isOpen = mobileNav?.classList.toggle('flex');
  mobileNav?.classList.toggle('hidden');
  toggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.add('hidden');
    mobileNav.classList.remove('flex');
    toggle?.setAttribute('aria-expanded', 'false');
  });
});
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`, open the preview, confirm:
- Desktop width (≥768px): horizontal nav links visible, hamburger hidden.
- Mobile width (<768px): hamburger visible, clicking it toggles the link list, clicking a link closes it.
- "Aperto ora"/"Chiuso ora" badge shows a value (not blank).

- [ ] **Step 4: Commit**

```bash
git add src/components/Navbar.astro src/scripts/navbar.ts
git commit -m "feat: add sticky navbar with scroll-spy, mobile menu, and open-now badge"
```

---

### Task 7: Hero section

**Files:**
- Create: `src/components/Hero.astro`

**Interfaces:**
- Consumes: `hero` collection entry (Task 2).
- Produces: `<Hero />` component, exposes `id="home"` as the scroll target used by Navbar/scroll-spy.

- [ ] **Step 1: Write the component**

```astro
---
// src/components/Hero.astro
import { getEntry } from 'astro:content';

const hero = await getEntry('hero', 'hero');
const { headline, subtitle, cta_text } = hero!.data;
---
<section id="home" class="reveal mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-20 text-center md:flex-row md:text-left">
  <div class="flex-1">
    <h1 class="text-3xl font-bold text-brand-primary-dark md:text-5xl">{headline}</h1>
    <p class="mt-4 text-lg text-brand-ink/80">{subtitle}</p>
    <a
      href="#contatti"
      class="mt-8 inline-block rounded-full bg-brand-primary px-6 py-3 font-medium text-white transition-transform hover:scale-105 hover:bg-brand-primary-dark"
    >
      {cta_text}
    </a>
  </div>
  <img
    src="https://picsum.photos/seed/studio23-hero/600/450"
    alt="Ambiente Studio23"
    class="flex-1 rounded-2xl object-cover shadow-lg"
    width="600"
    height="450"
    loading="eager"
  />
</section>
```

- [ ] **Step 2: Verify in the browser**

Run: `npm run dev`, confirm the hero renders headline/subtitle/CTA from content, image loads, layout stacks vertically on mobile width and side-by-side on desktop width.

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: add hero section reading from content collection"
```

---

### Task 8: Servizi section

**Files:**
- Create: `src/components/icons/PhysioIcon.astro`, `src/components/icons/NutritionIcon.astro`
- Create: `src/components/ServiceCard.astro`, `src/components/ServicesSection.astro`

**Interfaces:**
- Consumes: `servizi` collection (Task 2).
- Produces: `<ServicesSection />` with `id="servizi"`, consumed by `index.astro` in Task 12.

- [ ] **Step 1: Icons**

```astro
---
// src/components/icons/PhysioIcon.astro
---
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-10 w-10 text-brand-primary">
  <path stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0Zm8-4v4l3 3" />
</svg>
```

```astro
---
// src/components/icons/NutritionIcon.astro
---
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-10 w-10 text-brand-primary">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c-2 3-2 6 0 9m-5 3h10M8 21c0-3 1.5-5 4-5s4 2 4 5" />
</svg>
```

- [ ] **Step 2: ServiceCard**

```astro
---
// src/components/ServiceCard.astro
import PhysioIcon from './icons/PhysioIcon.astro';
import NutritionIcon from './icons/NutritionIcon.astro';

interface Props {
  title: string;
  description: string;
  icon: 'physio' | 'nutrition';
}

const { title, description, icon } = Astro.props;
---
<div class="reveal rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
  {icon === 'physio' ? <PhysioIcon /> : <NutritionIcon />}
  <h3 class="mt-4 text-xl font-semibold text-brand-primary-dark">{title}</h3>
  <p class="mt-2 text-brand-ink/80">{description}</p>
</div>
```

- [ ] **Step 3: ServicesSection**

```astro
---
// src/components/ServicesSection.astro
import { getCollection } from 'astro:content';
import ServiceCard from './ServiceCard.astro';

const servizi = (await getCollection('servizi')).sort((a, b) => a.data.order - b.data.order);
const iconFor = (slug: string) => (slug.includes('fisio') ? 'physio' : 'nutrition') as const;
---
<section id="servizi" class="mx-auto max-w-5xl px-4 py-20">
  <h2 class="reveal text-center text-3xl font-bold text-brand-primary-dark">I nostri servizi</h2>
  <div class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
    {servizi.map((s) => (
      <ServiceCard title={s.data.title} description={s.data.description} icon={iconFor(s.slug)} />
    ))}
  </div>
</section>
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`, confirm both service cards render with correct icon, title, description; grid is 2 columns on desktop and 1 column on mobile width.

- [ ] **Step 5: Commit**

```bash
git add src/components/ServiceCard.astro src/components/ServicesSection.astro src/components/icons
git commit -m "feat: add services section with icon cards from content collection"
```

---

### Task 9: Team section

**Files:**
- Create: `src/components/TeamMember.astro`, `src/components/TeamSection.astro`

**Interfaces:**
- Consumes: `team` collection (Task 2).
- Produces: `<TeamSection />` with `id="team"`, consumed by `index.astro` in Task 12.

- [ ] **Step 1: TeamMember**

```astro
---
// src/components/TeamMember.astro
interface Props {
  name: string;
  role: string;
  bio: string;
  seed: string;
}
const { name, role, bio, seed } = Astro.props;
---
<div class="reveal flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm">
  <img
    src={`https://picsum.photos/seed/studio23-${seed}/240/240`}
    alt={name}
    width="120"
    height="120"
    class="h-30 w-30 rounded-full object-cover"
  />
  <h3 class="mt-4 text-lg font-semibold text-brand-primary-dark">{name}</h3>
  <p class="text-sm font-medium text-brand-primary">{role}</p>
  <p class="mt-2 text-brand-ink/80">{bio}</p>
</div>
```

- [ ] **Step 2: TeamSection**

```astro
---
// src/components/TeamSection.astro
import { getCollection } from 'astro:content';
import TeamMember from './TeamMember.astro';

const team = (await getCollection('team')).sort((a, b) => a.data.order - b.data.order);
---
<section id="team" class="mx-auto max-w-5xl px-4 py-20">
  <h2 class="reveal text-center text-3xl font-bold text-brand-primary-dark">Il team</h2>
  <div class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
    {team.map((member) => (
      <TeamMember
        name={member.data.name}
        role={member.data.role}
        bio={member.data.bio}
        seed={member.slug}
      />
    ))}
  </div>
</section>
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`, confirm both team members render with photo, name, role, bio; layout responsive as above.

- [ ] **Step 4: Commit**

```bash
git add src/components/TeamMember.astro src/components/TeamSection.astro
git commit -m "feat: add team section from content collection"
```

---

### Task 10: Contatti section (Netlify form + map + hours + badge)

**Files:**
- Create: `src/components/ContactSection.astro`

**Interfaces:**
- Consumes: `contatti` collection entry (Task 2), `isStudioOpen` (Task 4).
- Produces: `<ContactSection />` with `id="contatti"`, consumed by `index.astro` in Task 12.

- [ ] **Step 1: Write the component**

```astro
---
// src/components/ContactSection.astro
import { getEntry } from 'astro:content';
import { isStudioOpen } from '../lib/opening-hours';

const contatti = await getEntry('contatti', 'info');
const { address, phones, email, hours } = contatti!.data;
const open = isStudioOpen(hours, new Date());
const mapQuery = encodeURIComponent(address);
---
<section id="contatti" class="mx-auto max-w-5xl px-4 py-20">
  <h2 class="reveal text-center text-3xl font-bold text-brand-primary-dark">Contatti</h2>

  <div class="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
    <div class="reveal space-y-4">
      <p class="flex items-center gap-2">
        <span class:list={['rounded-full px-3 py-1 text-xs font-medium', open ? 'bg-brand-primary/10 text-brand-primary-dark' : 'bg-gray-200 text-gray-600']}>
          {open ? 'Aperto ora' : 'Chiuso ora'}
        </span>
      </p>
      <p><strong>Indirizzo:</strong> {address}</p>
      <p><strong>Email:</strong> <a href={`mailto:${email}`} class="text-brand-primary hover:underline">{email}</a></p>
      <p><strong>Telefono:</strong> {phones.join(' · ')}</p>
      <ul>
        {hours.map((h) => (
          <li>{h.days}: {h.time}</li>
        ))}
      </ul>
      <iframe
        title="Mappa Studio23"
        src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
        class="h-64 w-full rounded-2xl border-0"
        loading="lazy"
      ></iframe>
    </div>

    <form name="contatto" method="POST" data-netlify="true" class="reveal space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <input type="hidden" name="form-name" value="contatto" />
      <div>
        <label for="name" class="block text-sm font-medium">Nome</label>
        <input id="name" name="name" type="text" required class="mt-1 w-full rounded-lg border border-gray-300 p-2" />
      </div>
      <div>
        <label for="email" class="block text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" required class="mt-1 w-full rounded-lg border border-gray-300 p-2" />
      </div>
      <div>
        <label for="message" class="block text-sm font-medium">Messaggio</label>
        <textarea id="message" name="message" rows="4" required class="mt-1 w-full rounded-lg border border-gray-300 p-2"></textarea>
      </div>
      <button type="submit" class="w-full rounded-full bg-brand-primary px-6 py-3 font-medium text-white transition-transform hover:scale-105 hover:bg-brand-primary-dark">
        Invia richiesta
      </button>
    </form>
  </div>
</section>
```

- [ ] **Step 2: Verify in the browser**

Run: `npm run dev`, confirm address/email/phones/hours render from content, map iframe loads, form fields are present and required validation triggers on empty submit.

- [ ] **Step 3: Commit**

```bash
git add src/components/ContactSection.astro
git commit -m "feat: add contact section with Netlify form, map, hours, and open-now badge"
```

---

### Task 11: Scroll-reveal wiring + reduced-motion QA

**Files:**
- Create: `src/scripts/scroll-reveal.ts`
- Modify: `src/layouts/BaseLayout.astro` (import the script)

**Interfaces:**
- Consumes: `.reveal` CSS class defined in Task 3.
- Produces: adds `.is-visible` to any `.reveal` element that enters the viewport — used by every section built in Tasks 7-10.

- [ ] **Step 1: Implement the observer**

```ts
// src/scripts/scroll-reveal.ts
const elements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && elements.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach((el) => observer.observe(el));
} else {
  // No IntersectionObserver support: show everything immediately.
  elements.forEach((el) => el.classList.add('is-visible'));
}
```

- [ ] **Step 2: Wire into the base layout**

```astro
---
// src/layouts/BaseLayout.astro
import '../styles/global.css';

interface Props {
  title: string;
}
const { title } = Astro.props;
---
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
    <script src="../scripts/scroll-reveal.ts"></script>
  </body>
</html>
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`. Scroll the page and confirm each `.reveal` section fades/slides in once, on first entry into view (not repeatedly).

- [ ] **Step 4: Verify reduced-motion behavior**

In Chrome DevTools, open the "Rendering" tab, set "Emulate CSS media feature prefers-reduced-motion" to `reduce`, reload the page.
Expected: all `.reveal` sections are visible immediately with no animation (per the CSS rule from Task 3).

- [ ] **Step 5: Commit**

```bash
git add src/scripts/scroll-reveal.ts src/layouts/BaseLayout.astro
git commit -m "feat: add scroll-reveal system with prefers-reduced-motion support"
```

---

### Task 12: Homepage assembly + Footer + responsive QA pass

**Files:**
- Create: `src/components/Footer.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `BaseLayout` (Task 11), `Navbar`, `Hero`, `ServicesSection`, `TeamSection`, `ContactSection` (Tasks 6-10).

- [ ] **Step 1: Footer**

```astro
---
// src/components/Footer.astro
import { getEntry } from 'astro:content';
const contatti = await getEntry('contatti', 'info');
---
<footer class="border-t border-gray-200 px-4 py-8 text-center text-sm text-brand-ink/60">
  <p>&copy; {new Date().getFullYear()} Studio23 &mdash; {contatti!.data.address}</p>
</footer>
```

- [ ] **Step 2: Assemble the homepage**

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Navbar from '../components/Navbar.astro';
import Hero from '../components/Hero.astro';
import ServicesSection from '../components/ServicesSection.astro';
import TeamSection from '../components/TeamSection.astro';
import ContactSection from '../components/ContactSection.astro';
import Footer from '../components/Footer.astro';
---
<BaseLayout title="Studio23 — Fisioterapia, Osteopatia e Nutrizione a Lainate">
  <Navbar />
  <Hero />
  <ServicesSection />
  <TeamSection />
  <ContactSection />
  <Footer />
</BaseLayout>
```

- [ ] **Step 3: Full build check**

```bash
npm run build && npm run test
```

Expected: build succeeds, all Vitest suites pass.

- [ ] **Step 4: Responsive visual QA in the browser**

Run: `npm run dev`, then in the Browser pane:
- Resize to 375×812 (mobile): confirm hamburger menu, single-column cards, hero stacked, no horizontal scrollbar.
- Resize to 768×1024 (tablet): confirm layout doesn't break at the breakpoint edge.
- Resize to 1440×900 (desktop): confirm horizontal nav, 2-column grids, hero side-by-side.
- Click each nav link and confirm it scrolls to the right section and the scroll-spy highlight updates.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.astro src/pages/index.astro
git commit -m "feat: assemble homepage from all sections"
```

---

### Task 13: Decap CMS admin panel

**Files:**
- Create: `public/admin/index.html`, `public/admin/config.yml`

**Interfaces:**
- Consumes: the exact collection folder/file paths from Task 2 (`src/content/hero/hero.md`, `src/content/contatti/info.md`, `src/content/servizi/`, `src/content/team/`).
- Produces: an editable admin UI at `/admin` that writes back to those same files.

- [ ] **Step 1: Admin entry page**

```html
<!-- public/admin/index.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Studio23 — Pannello contenuti</title>
  </head>
  <body>
    <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
  </body>
</html>
```

- [ ] **Step 2: CMS config**

```yaml
# public/admin/config.yml
backend:
  name: git-gateway
  branch: main

local_backend: true

media_folder: "public/images/uploads"
public_folder: "/images/uploads"

collections:
  - name: "hero"
    label: "Home"
    files:
      - file: "src/content/hero/hero.md"
        name: "hero"
        label: "Sezione Home"
        fields:
          - { label: "Titolo", name: "headline", widget: "string" }
          - { label: "Sottotitolo", name: "subtitle", widget: "text" }
          - { label: "Testo pulsante", name: "cta_text", widget: "string" }

  - name: "servizi"
    label: "Servizi"
    folder: "src/content/servizi"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "Titolo", name: "title", widget: "string" }
      - { label: "Descrizione", name: "description", widget: "text" }
      - { label: "Ordine", name: "order", widget: "number", default: 1 }

  - name: "team"
    label: "Team"
    folder: "src/content/team"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "Nome", name: "name", widget: "string" }
      - { label: "Ruolo", name: "role", widget: "string" }
      - { label: "Bio", name: "bio", widget: "text" }
      - { label: "Ordine", name: "order", widget: "number", default: 1 }

  - name: "contatti"
    label: "Contatti"
    files:
      - file: "src/content/contatti/info.md"
        name: "contatti"
        label: "Informazioni di contatto"
        fields:
          - { label: "Indirizzo", name: "address", widget: "string" }
          - { label: "Email", name: "email", widget: "string" }
          - label: "Telefoni"
            name: "phones"
            widget: "list"
            field: { label: "Numero", name: "phone", widget: "string" }
          - label: "Orari"
            name: "hours"
            widget: "list"
            fields:
              - { label: "Giorni", name: "days", widget: "string" }
              - { label: "Orario", name: "time", widget: "string" }
```

- [ ] **Step 3: Verify locally with the Decap local backend**

```bash
npx decap-server &
npm run dev
```

Open `http://localhost:4321/admin/` in the browser. Confirm the CMS UI loads (using `local_backend: true`, no Netlify Identity login needed locally), and that editing the hero headline and saving updates `src/content/hero/hero.md` on disk.

- [ ] **Step 4: Remove `local_backend: true` for production**

`local_backend: true` is a dev-only convenience — leave it in `config.yml` since Decap ignores it when not running against `decap-server`, but note it explicitly here so it isn't mistaken for a bug: production auth is Netlify Identity + Git Gateway (configured in Task 14 outside the repo).

- [ ] **Step 5: Commit**

```bash
git add public/admin
git commit -m "feat: add Decap CMS admin panel wired to content collections"
```

---

### Task 14: Netlify build config + manual dashboard setup

**Files:**
- Create: `netlify.toml`

**Interfaces:**
- Produces: the build command/publish directory Netlify's dashboard reads on first connect.

- [ ] **Step 1: Write Netlify build config**

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 404
```

- [ ] **Step 2: Commit**

```bash
git add netlify.toml
git commit -m "chore: add Netlify build configuration"
```

- [ ] **Step 3: Manual steps (require the client's/your own Netlify account — not something an agent can do from the repo)**

Document these for whoever has Netlify access; they are not automatable from this codebase:
1. Push this repo to GitHub.
2. In Netlify: "Add new site" → "Import from Git" → select the repo → build settings are picked up automatically from `netlify.toml`.
3. Enable **Identity** (Site settings → Identity → Enable Identity) and set registration to "Invite only".
4. Enable **Git Gateway** (Site settings → Identity → Services → Git Gateway).
5. Invite the client's email as an Identity user so they can log into `/admin`.
6. (Later, when ready) point the `studio23lainate.it` domain to this Netlify site — coordinate timing with the client to avoid downtime on the currently-live site.

---

### Task 15: Production build + Lighthouse QA pass

**Files:** none (verification-only task).

- [ ] **Step 1: Full test + build**

```bash
npm run test
npm run build
```

Expected: all unit tests pass, build succeeds with no errors/warnings about missing content fields.

- [ ] **Step 2: Lighthouse audit against the production build**

```bash
npm run preview &
npx lighthouse http://localhost:4321 --output=json --output-path=./lighthouse-report.json --only-categories=performance,accessibility,seo,best-practices --chrome-flags="--headless"
```

Expected: performance, accessibility, and SEO scores at or above 90. If any score is below 90, read `lighthouse-report.json` for the specific failing audit and fix it before moving on (common culprits at this stage: missing `alt` text, color contrast, missing meta description — add a meta description in `BaseLayout.astro` if flagged).

- [ ] **Step 3: Final responsive spot-check**

In the Browser pane, load the production preview and repeat the 375/768/1440 checks from Task 12 Step 4 one more time against the built (not dev-server) output.

- [ ] **Step 4: Commit the Lighthouse report for reference (optional but cheap)**

```bash
git add lighthouse-report.json
git commit -m "chore: add baseline Lighthouse report"
```
