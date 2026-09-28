---
name: SIICO Portal
description: Operations console for Siigo's accounting automation catalog and operational data views.
colors:
  primary: oklch(0.6 0.17 235)
  primary-foreground: oklch(0.99 0.005 240)
  background: oklch(0.96 0.012 247)
  foreground: oklch(0.205 0.013 256)
  card: oklch(1 0 0)
  card-foreground: oklch(0.205 0.013 256)
  popover: oklch(1 0 0)
  popover-foreground: oklch(0.205 0.013 256)
  secondary: oklch(0.94 0.008 247)
  secondary-foreground: oklch(0.205 0.013 256)
  muted: oklch(0.93 0.008 247)
  muted-foreground: oklch(0.485 0.013 256)
  accent: oklch(0.92 0.012 247)
  accent-foreground: oklch(0.205 0.013 256)
  destructive: oklch(0.555 0.182 27)
  destructive-foreground: oklch(0.985 0.002 95)
  border: oklch(0.88 0.008 247)
  input: oklch(0.88 0.008 247)
  ring: oklch(0.6 0.17 235)
  chart-1: oklch(0.66 0.17 235)
  chart-2: oklch(0.585 0.118 168)
  chart-3: oklch(0.625 0.142 64)
  chart-4: oklch(0.555 0.182 27)
  chart-5: oklch(0.485 0.184 304)
  sidebar-background: oklch(0.6 0.17 235)
  sidebar-foreground: oklch(0.99 0.005 240)
  sidebar-primary: oklch(1 0 0)
  sidebar-primary-foreground: oklch(0.6 0.17 235)
  sidebar-accent: oklch(0.52 0.18 235)
  sidebar-accent-foreground: oklch(0.99 0.005 240)
  sidebar-border: oklch(1 0 0 / 0.14)
  sidebar-ring: oklch(0.78 0.12 235)
typography:
  title:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    fontFeature: "tabular-nums"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    size: "default"
    height: "2.25rem"
    padding: "0 1rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    size: "default"
    height: "2.25rem"
    padding: "0 1rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    size: "default"
    height: "2.25rem"
    padding: "0 1rem"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    size: "default"
    height: "2.25rem"
    padding: "0 1rem"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "2.25rem"
    padding: "0 0.75rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
  badge-success:
    textColor: oklch(0.45 0.13 160)
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.125rem 0.5rem"
  sidebar-menu-button:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.sidebar-accent-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "2rem"
    padding: "0.5rem"
  empty-state:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.lg}"
    padding: "3rem 1.5rem"
---

# Design System: SIICO Portal

## Overview

**Creative North Star: "The Operations Console in Siigo Blue."**

SIICO's portal is a working console for the Siigo accounting team — a place to dispatch automations, audit their outcomes, and operate on tabular data without leaving the browser. The visual language borrows from engineering and accounting tooling (issue trackers, ERP tables, terminal UIs): typography carries weight, borders carry structure, and Siigo blue owns the chrome while a cool gray canvas plus white cards carry the work. Density still wins over breathing room; every pixel should help a counter answer "what is the status of this run?" or "where is this anticipo?" without scrolling for context.

The system is bilingual in form (light/dark themes over the same tokens via Tailwind v4's `@custom-variant dark`) but monolingual in voice (Spanish UI). It runs on Tailwind v4's CSS-first tokens and shadcn/ui's `new-york` primitives, with IBM Plex Sans and IBM Plex Mono as the only typefaces. Light and dark themes are not equals aesthetically — light is the working canvas for daytime data entry, dark is the after-hours and reduced-glare default — but neither is louder than the other.

**Key Characteristics:**

- Sober, professional, dense; information density wins over whitespace
- Three-zone contrast: Siigo blue sidebar chrome / cool gray canvas / white cards. The brand owns the rail; the work owns the well.
- Siigo blue is the single brand accent; chart colors break out only inside data viz
- Type pair is fixed: IBM Plex Sans for prose, IBM Plex Mono for numerics, codes, and the brand mark
- Borders are the primary structural device; shadows appear only on lifted surfaces (cards, dialogs, sheets)
- Operate mode: every screen ships explicit loading, empty, error, and success states

## Colors

The palette is built on three concentric layers of contrast: a Siigo blue sidebar chrome, a cool gray canvas for the content well, and pure white cards that lift off the canvas. The brand voice is Siigo blue (`#009DFF`, encoded in OKLCH). The grays form a tight slate-blue family (hue ≈ 247°) so they sit cohesively against the brand without competing.

### Primary

- **Siigo Blue** (`oklch(0.6 0.17 235)`, ≈ `#0088DA`): The single brand voice. Used for primary buttons, the focus ring, chart slot 1, and KPI tile default-tone chips. Carries the sidebar chrome. In dark mode the role flips to a brighter Siigo blue (`oklch(0.72 0.16 235)`) so contrast inverts against the dark canvas.
- **Siigo Blue (Hi-Key)** (`oklch(0.66 0.17 235)`, ≈ `#009DFF`): Reserved for `chart-1` and decorative tints where the deeper `--primary` would feel heavy. Never used for interactive accents.
- **Siigo Deep** (`oklch(0.52 0.18 235)`, ≈ `#0064B8`): The hover/active wash inside the sidebar. Two steps deeper than `--primary` so the selection state reads on the blue chrome without losing the brand hue.

### Neutral

- **Canvas Gray** (`oklch(0.96 0.012 247)`): The page content background. Cool slate gray, clearly distinct from cards. Pure white (`oklch(1 0 0)`) is reserved for cards so they lift off the canvas as containers. In dark mode the canvas becomes `oklch(0.18 0.014 247)` (deep ink) and cards become `oklch(0.22 0.014 247)`.
- **Muted Gray** (`oklch(0.93 0.008 247)`): Carries `--muted` and dashed empty-state borders. One step deeper than canvas so a hovered row is legible without competing with focus rings.
- **Hairline Border** (`oklch(0.88 0.008 247)`): 1px borders on cards, tables, inputs, and the topbar. Always the same value as `--input`. In dark mode `oklch(0.30 0.014 247)`.
- **Slate Text** (`oklch(0.205 0.013 256)`): Default body and heading text. Same hue family as primary; never used as a background.
- **Quiet Text** (`oklch(0.485 0.013 256)`): Muted descriptions, helper text, table column headers, and the sidebar's group label. Always paired with the bold label typography.

### Status / Destructive

- **Coral** (`oklch(0.555 0.182 27)`): Destructive actions only (Eliminar registro, error toasts). High chroma so it never gets confused with the Siigo blue family. Never used for emphasis or branding.
- **Status Tones** (project-local, not in frontmatter): Emerald (`oklch(0.6 0.16 160)` family), amber (`oklch(0.65 0.15 80)` family), sky (`oklch(0.6 0.12 230)` family), and rose. These tones power the KPI tile chips, status badges in the anticipos table, and overdue-date callouts. They are not theme tokens — they are functional role colors. They sit alongside Tailwind's stock emerald/amber/sky/rose ramps to keep them legible in both light and dark mode.

### Chart

- **Siigo Blue** (`oklch(0.66 0.17 235)`), **Teal** (`oklch(0.585 0.118 168)`), **Amber** (`oklch(0.625 0.142 64)`), **Coral** (`oklch(0.555 0.182 27)`), **Magenta** (`oklch(0.485 0.184 304)`): The five-color categorical palette for future charting. The Siigo blue slot anchors data viz to the brand.

### Sidebar

- **Siigo Blue** (`oklch(0.6 0.17 235)` in light, `oklch(0.26 0.13 235)` in dark): The sidebar background — the brand voice owns the rail. White text and white-tinted dividers give the chrome a clean, on-brand feel without losing readability.
- **Sidebar Primary** (`oklch(1 0 0)` in light, `oklch(0.96 0.005 247)` in dark): Used for the SIICO mark tile in the sidebar header. Inverted relative to sidebar background so the logo reads as a "lifted" surface on the brand blue.
- **Sidebar Accent** (`oklch(0.52 0.18 235)` in light, `oklch(0.34 0.15 235)` in dark): The hover/active wash. Deeper Siigo blue that still sits on the same hue so selection stays clearly inside the brand family.
- **Sidebar Border** (`oklch(1 0 0 / 0.14)` in light, `oklch(1 0 0 / 0.10)` in dark): White-tinted dividers visible against the blue chrome.

### Named Rules

**The Three-Zone Contrast Rule.** Every screen is composed of three concentric layers — Siigo blue sidebar, gray canvas, white cards. Each layer earns its color from its job: brand voice, work surface, container. Don't collapse two layers into the same color.

**The One-Voice Rule.** Siigo blue appears in roughly ≤10% of any given viewport (plus the sidebar, which earns its color from being brand chrome). It speaks for primary actions, the SIICO mark, and focus rings. It never co-occurs with another bright fill on the same screen — a Siigo blue button next to a coral destructive button on the same row breaks the rule.

**The Chart-Only Hue Rule.** Hues other than Siigo blue exist exclusively inside data viz (chart slots 2–5 and KPI tone chips). Emerald/amber/sky/rose tones are status colors, not decorative accents; do not promote them into brand surfaces.

**The Slate-Blue Family Rule.** Neutrals and the primary accent share the cool blue hue family (235°–256°). Coral is the only escape hatch from this family, used solely for destructive intent.

## Typography

**Display Font:** Not used. Per PRODUCT.md, display typography is explicitly excluded.
**Body Font:** IBM Plex Sans (weights 400, 500, 600, 700), loaded via `next/font/google` as the `--font-plex-sans` CSS variable in `src/app/layout.tsx`. Fallback: `ui-sans-serif, system-ui, sans-serif`.
**Label Font:** IBM Plex Sans, semibold, uppercase, tracked.
**Mono Font:** IBM Plex Mono (weights 400, 500, 600), loaded via `next/font/google` as the `--font-plex-mono` CSS variable. Reserved for tabular numerics, codes (requerimiento identifiers), the SIICO brand mark, the 404 marker, and KPI values.

**Character:** Plex Sans reads as engineering documentation — slightly humanist, optically distinct at small sizes, and serious without feeling cold. Plex Mono is its workhorse sibling, used wherever a number or code needs to line up with another number or code. The pairing is intentionally narrow: no third typeface, no display weights, no italic flourishes. `font-feature-settings: "ss01", "cv11"` is enabled globally on `<body>` so the open `4`, `6`, and `9` inktraps stay legible across the data tables.

### Hierarchy

- **Title** (semibold 600, 16px / `1rem`, line-height 1.25, slight negative tracking `-0.005em`): Page titles, card titles, dialog titles. Used at `text-base font-semibold leading-none tracking-tight` in shadcn primitives like `CardTitle`. Never scales up to display sizes — if a surface needs more weight, it adds color or borders instead.
- **Body** (regular 400, 14px / `0.875rem`, line-height 1.5): Default prose. Used for form labels, descriptions, table cells, button text, sidebar menu items.
- **Label** (semibold 600, 11px / `0.6875rem`, line-height 1, letter-spacing `0.06em`, uppercase): Column headers in tables, sidebar group labels (`ÁREAS`), KPI tile labels, dropdown section labels, eyebrow text in the topbar. Always uppercase and tracked; never mixed-case.
- **Mono** (medium 500, 14px / `0.875rem`, tabular-nums): The mono variant is used selectively for tabular numerics (KPI values, dates, requerimiento codes), the SIICO mark in the login card and the 404 marker, and `font-variant-numeric: tabular-nums` on every table cell (set via `[data-slot="table"]` in `globals.css`). Numeric alignment matters more than decoration.

### Named Rules

**The Mono-Number Rule.** Whenever a number is stacked, sorted, or compared in a list, render it in IBM Plex Mono with `tabular-nums`. This includes KPI values, dates in tables, counts in pagination, and percent suffixes.

**The Uppercase-Label Rule.** Any text ≤ 12px that introduces a section, column, or group is uppercase + tracked + semibold. Mixed-case small text is reserved for prose.

## Layout

The portal follows a fixed two-zone chrome (sticky topbar + persistent sidebar) and a single-canvas content well. Every authenticated page renders inside that chassis (`src/components/layout/app-shell.tsx` + `app-sidebar.tsx` + `topbar.tsx`).

**Outer chassis (sourced from `src/components/ui/sidebar.tsx`):**
- `SIDEBAR_WIDTH = "16rem"` persistent on desktop, `SIDEBAR_WIDTH_MOBILE = "18rem"` inside the mobile Sheet, `SIDEBAR_WIDTH_ICON = "3rem"` collapsed.
- Topbar is `h-14` (56px), sticky, with `border-b border-border` + `bg-card` (solid white panel that reads as part of the content well, not as a translucent overlay on the canvas — no `backdrop-blur`).
- Sidebar toggle keyboard shortcut is `Cmd/Ctrl+B`; the open/closed state persists in a 7-day `sidebar_state` cookie.
- The content well uses `max-w-7xl` (1280px) with responsive horizontal padding (`px-4 sm:px-6 lg:px-8`). Vertical rhythm is `py-6 sm:py-8 lg:py-10`.

**Section rhythm inside the content well:**
- Sections stack with `gap-6` (24px) at the page level, `gap-5` (20px) inside a feature surface like anticipos, `gap-3` (12px) between same-rank controls (KPI tiles, filter chips).
- Cards use `p-5` (20px) for headers and content; the KPI tile is tighter at `p-4` (16px) because it packs icon + label + value.
- Form fields stack with `space-y-5` between groups and `space-y-1.5` between label and input. Labels sit above their inputs; helper text and error messages sit directly below.

**Density:**
- Tables use `py-2.5` (10px) on cells, `h-9` (36px) on column headers, and a `Card` shell with `overflow-hidden` and zero internal padding so the table edge meets the card border. Default page size is 5 rows; options expand to 10/20/50/100.
- The anticipos data table renders row numbers in mono, collaborator names in semibold foreground, requerimiento codes in muted mono, dates in muted mono with `tabular-nums`, and statuses as outlined badge pills with a 6px status dot (`size-1.5`).

**Responsive breakpoints (active in the codebase):**
- `md` (768px, via `useMediaQuery("(max-width: 767px)")` in `sidebar.tsx`): the sidebar switches from a Sheet overlay to the persistent offcanvas rail; form surfaces flip from Drawer (bottom sheet) to Dialog (centered modal); KPI grid collapses from `lg:grid-cols-4` → 2 cols.
- `lg` (1024px): the dashboard catalog opens up to two columns of area cards.
- Tailwind v4's default breakpoints (sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536) are inherited; the only project-specific breakpoint is the 768px mobile-detection used inside `app-sidebar` and the anticipos form.

**Container rules:**
- Login surface: `max-w-[420px]` card centered in the viewport.
- Dialog (anticipos create/edit): `max-w-md` (28rem), centered.
- Sheet/Drawer (anticipos mobile form): right edge on desktop (`sm:max-w-sm`), bottom-anchored on mobile.
- 404 page: `max-w-md` centered in the viewport.

### Named Rules

**The Single-Canvas Rule.** Each page renders inside exactly one max-width container (`max-w-7xl`). Nested max-widths are only allowed inside dialog/sheet content; never stack two global containers.

**The 768px Surface Flip Rule.** Below 768px, any surface that opens centered (Dialog) flips to a bottom-anchored Drawer; the sidebar flips from persistent to a Sheet overlay. There is no third behavior for intermediate widths.

## Elevation & Depth

The system is structurally flat. Shadows are a response to elevation (a card, a dialog, a sheet, a dropdown), never a decoration. Two 1px borders do more structural work than any shadow.

### Shadow Vocabulary

- **Resting card** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): Tailwind's `shadow-sm`. Applied via `shadow-sm` on `Card` and `button-default`. Subtle enough that a card looks like a sheet of paper on the canvas, not a lifted tile.
- **Lifted surface** (`0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): Tailwind's `shadow-md`. Used on dropdown menu content, popovers, and select content.
- **Modal** (`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): Tailwind's `shadow-lg`. Used on dialog and sheet content.
- **No shadow at all**: tables, rows, sidebar items, badges, KPI tile icon chips. They communicate state via background, border, or text — not via drop shadow.

### Focus Rings

The focus ring is a structural element, not decoration. Pattern: a 1px offset matching the surrounding background color + a 2px ring in `--ring` color. The button primitive sets this in its shared class: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background`. On light surfaces the ring is Siigo Blue; on dark surfaces (sidebar, tooltip) the ring color is `--sidebar-ring` (`oklch(0.78 0.12 235)` in light, `oklch(0.72 0.16 235)` in dark) — a paler Siigo blue that stays AA-readable against the brand chrome.

### Named Rules

**The Quiet-Shadow Rule.** Shadows appear only on lifted surfaces (cards at rest, popovers, dialogs, sheets). Never on rows, list items, badges, sidebar items, or inputs.

**The Border-First Rule.** When a surface needs to be visually separated, default to a 1px `--border` before reaching for a shadow. The topbar uses a border-bottom; table rows use a border-bottom; cards use both a border and a `shadow-sm`. Hover states on table rows use `bg-muted/40`, never a shadow.

## Shapes

The form language is soft-but-precise. All radii derive from a single base unit (`--radius: 0.5rem` / 8px, declared in `:root` and stepped via `calc(var(--radius) - …)` at `@theme inline`), giving the system four steps: 4px / 6px / 8px / 12px. There is no fifth step.

- **Inputs, buttons, selects, badges, KPI icon chips, sidebar items, table cells**: `rounded-md` (6px). Small enough to read as engineering, large enough to feel modern.
- **Cards, dialogs, sheets, popovers, dropdowns, empty states**: `rounded-lg` (8px). The "container" radius.
- **Login card, KPI tile icon containers**: `rounded-lg` (8px) — same as other containers. Nothing in the portal uses `rounded-xl` (12px) at the moment; the slot is reserved for future hero or marketing surfaces.
- **Avatars, status dots, mono numeric badges with full circles**: `rounded-full`. Only used for circular elements.
- **Topbar, sidebar (when collapsed to icon rail)**: square corners — they meet the viewport edges.

**Borders** are always 1px. There are no thicker borders anywhere in the system except the focus ring. The sidebar-on-blue uses a white-tinted divider (`border-white/15`) instead of the page border token so the divider reads against the brand chrome.

### Named Rules

**The Eight-Pixel-Family Rule.** All radii are derived from `--radius: 0.5rem` (8px): 4 / 6 / 8 / 12 px. Do not introduce new radii — if a new surface doesn't fit one of these four steps, change the surface, not the scale.

**The Square-Chrome Rule.** The persistent chrome (topbar, sidebar rail, page edges) is square. Corners only soften inside the content well.

## Components

### Buttons

Source: `src/components/ui/button.tsx` (shadcn/ui `new-york` primitive, translated).

- **Shape:** `rounded-md` (6px). Sizes: `default` (h-9 / 36px, px-4), `sm` (h-8 / 32px, px-3, text-xs), `lg` (h-10 / 40px, px-6), `icon` (h-9 w-9 / 36px square).
- **Primary:** `bg-primary` + `text-primary-foreground` + `shadow-sm`. Hover drops to `bg-primary/90`. Used sparingly — one per surface, never stacked.
- **Outline:** `bg-background` + `border border-input` + `text-foreground` + `shadow-sm`. Hover fills with `bg-accent hover:text-accent-foreground`. The default secondary action (Cancelar, Limpiar filtros).
- **Ghost:** No background, no border, `text-foreground`. Hover fills with `bg-accent hover:text-accent-foreground`. Used for low-emphasis actions like icon buttons in the topbar.
- **Destructive:** `bg-destructive` + `text-destructive-foreground` + `shadow-sm`. Reserved for confirmed destructive actions (Eliminar). Destructive intent in non-confirmatory contexts uses the destructive ghost variant (coral text on transparent background, only visible on hover).
- **Secondary:** `bg-secondary` + `text-secondary-foreground` + `shadow-sm`. Hover drops to `bg-secondary/80`. Used for tonal buttons that need to read as buttons without competing with primary.
- **Link:** `text-primary` + `underline-offset-4` + hover underline. Used inline in the 404 page and in `EmptyDescription`.
- **Focus:** 2px ring in `--ring`, 1px offset matching background. Disabled drops to 50% opacity and ignores pointer events.

### Chips (Badges)

Source: `src/components/ui/badge.tsx`.

- **Style:** Outlined pill — `border-transparent` + tinted background + tinted text. `rounded-md` (6px). Padding `px-2 py-0.5`. `text-xs font-medium`.
- **Variants:**
  - `default`: filled primary.
  - `secondary`: filled `--secondary` / `--secondary-foreground`.
  - `destructive`: filled destructive.
  - `outline`: transparent background, `--foreground` text.
  - `success`: emerald ramp (`bg-emerald-100 text-emerald-900` in light, `bg-emerald-950 text-emerald-100` in dark). For the anticipos table the success look is the outlined family (`bg-emerald-50 text-emerald-700 border-emerald-200/60` in light, `bg-emerald-950/40 text-emerald-300 border-emerald-900/40` in dark).
  - `warning`: amber ramp (`bg-amber-100 text-amber-900` in light, `bg-amber-950 text-amber-100` in dark). Same outlined variant in the anticipos table.
- **Status dot convention:** Status badges in the anticipos table prepend a 6px dot in the matching status color (`bg-emerald-500`, `bg-amber-500`, `bg-sky-500`, `bg-rose-500`, `bg-muted-foreground` for the default tone). The dot is `mr-1.5 size-1.5 rounded-full shrink-0`.

### Cards / Containers

Source: `src/components/ui/card.tsx`.

- **Corner Style:** `rounded-lg` (8px).
- **Background:** `--card` (pure white in light, slate in dark) — clearly lifted off the gray canvas so cards read as containers, even before the border or shadow is read.
- **Border:** 1px `--border`. Always.
- **Shadow:** `shadow-sm`. Always on the resting card.
- **Internal Padding:** `p-5` (20px) for header / content / footer slots (`CardHeader`, `CardContent`, `CardFooter`). The KPI tile variant is tighter at `p-4` and lays out icon + label + value horizontally.
- **Typography slot:** `CardTitle` = `text-base font-semibold leading-none tracking-tight`; `CardDescription` = `text-sm text-muted-foreground`.

### Inputs / Fields

Source: `src/components/ui/input.tsx`.

- **Style:** 1px `--input` border + `--background` (canvas gray) fill + `rounded-md` (6px). `h-9` (36px) on text inputs. `text-sm`. Inside a white card, the gray fill reads as a "field inset"; on the gray canvas itself it sits subtly inside a white container.
- **Padding:** `px-3 py-1` for text inputs, `px-3 py-2` for textarea and select.
- **Placeholder:** `--muted-foreground`.
- **Focus:** 2px ring in `--ring` (Siigo blue), with a 1px offset matching the surrounding background. The offset prevents the ring from hugging the control.
- **Error:** `aria-invalid` flips the border to `--destructive` and adds a `ring-destructive/20` halo.
- **Disabled:** 50% opacity + `cursor-not-allowed`.
- **Search variant (anticipos data table):** Adds a leading search icon at `left-2.5`, a clear-button on the right when filled, and `pl-7 pr-7` so icons don't collide with text.

### Navigation

- **Topbar (`src/components/layout/topbar.tsx`):** `h-14` sticky, `border-b border-border`, `bg-card` (solid white panel, not translucent — the topbar is part of the content well, not a layer floating above the gray canvas). Left side: sidebar trigger + breadcrumb (eyebrow + title). Right side: theme toggle + user menu.
- **Sidebar (`src/components/layout/app-sidebar.tsx`, primitives in `src/components/ui/sidebar.tsx`):** `w-[16rem]` persistent on `md+`, offcanvas Sheet on mobile. `bg-sidebar` (Siigo blue `oklch(0.6 0.17 235)` in light, deep Siigo blue `oklch(0.26 0.13 235)` in dark) — the brand voice owns the rail. Header holds the SIICO mark tile (`size-8` square, `bg-sidebar-primary` white fill in light / near-white in dark, dashboard icon in `text-sidebar-primary-foreground` Siigo blue, `shadow-sm`) + a two-line "SIICO / Portal contable" label (`text-sm font-semibold` + `text-[11px] text-sidebar-foreground/70`). Footer holds the user card (avatar + name + email) on a white-tinted panel (`bg-white/10` + `border-white/15`) so it reads as a separate surface inside the blue chrome.
- **Sidebar menu item:** `rounded-md` (6px), `h-8` (32px), `p-2`, full-width. Icon + label + (optional) chevron. Hover fills with `--sidebar-accent`. Active state uses `data-active=true` to apply `--sidebar-accent` + semibold weight + `--sidebar-accent-foreground`. Group-active (a collapsible has a child active but the trigger itself is collapsed) uses `--sidebar-accent/60` for a softer hint.
- **Sub-menu item:** `text-xs`, indented under the parent, separated by a 1px `--sidebar-border` left rail (white-tinted divider). Same hover/focus treatment, no chevron.
- **Group label:** `text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/70`. White at 70% opacity — quieter than the menu items above it so the eye lands on the items first.
- **Keyboard:** `Cmd/Ctrl+B` toggles the sidebar (`SIDEBAR_KEYBOARD_SHORTCUT = "b"`). The state persists in a 7-day `sidebar_state` cookie.

### Signature Components

- **KPI Tile (`KpiTile` in `src/components/anticipos/anticipos-page.tsx`):** A horizontal card with a colored icon chip on the left and a two-line stack on the right. Icon chip is `size-9 rounded-md border` filled with a tone class (`bg-primary/10` + `text-primary` + `border-primary/15` for the default tone; emerald/amber/rose for status tones). Label is `text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`. Value is `font-mono text-xl font-semibold tabular-nums text-foreground`; an optional suffix slot (`tasaLegalizacion` style) renders muted mono text right of the value.
- **Column header with sort (`DataTableColumnHeader`):** A two-column flex — uppercase label on the left, sort button on the right. Sort button is `size-6 ghost icon` with `ArrowUpDown` (idle, `opacity-60`), `ArrowUp`, or `ArrowDown` depending on sort state.
- **Empty state (`Empty` + `EmptyHeader` + `EmptyMedia` + `EmptyTitle` + `EmptyDescription`):** Centered column with a dashed border, optional `size-10 rounded-full border bg-muted` icon container, title at `text-sm font-semibold text-foreground`, description at `text-sm text-muted-foreground`. Wrapped in a Card with `border-0 bg-transparent` when shown inside the data table so the table's border carries the structure.
- **Login card:** A `rounded-lg border bg-card` with `p-8 sm:p-10`. The SIICO mark uses `font-mono text-sm font-semibold tracking-[0.14em]` — the only place in the portal where the brand mark is set in mono at a wider tracking than labels. The footer caption below the card is `font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70` — even quieter than group labels.

### Motion

Motion is a closed vocabulary. Three durations, two easings, defined at `:root` in `globals.css`:

- `--duration-exit: 150ms` paired with `--easing-exit: cubic-bezier(0.4, 0, 1, 1)` for elements leaving a surface.
- `--duration-enter: 210ms` paired with `--easing-enter: cubic-bezier(0.16, 1, 0.3, 1)` for elements entering.
- `--duration-move: 400ms` (uses `--easing-enter`) for directional move (auth vertical translate, page slide).

These tokens drive `auth-enter`, `auth-exit`, `nav-forward`, `nav-back` view-transition classes, the `collapsible-down` / `collapsible-up` sidebar animations (`180ms ease-out`), the anticipos row-flash / row-halo / KPI-tile-stagger keyframes, and the theme-toggle crossfade. `prefers-reduced-motion: reduce` collapses every animation to `0.01ms`. There is no fourth duration; new transitions choose one of these three.

## Do's and Don'ts

### Do

- **Do** render every numeric column with `font-variant-numeric: tabular-nums` and prefer IBM Plex Mono for values that get sorted or summed.
- **Do** reserve primary buttons for the single most important action on a surface; use outline for the dismiss/secondary action.
- **Do** pair the project motion tokens (`--duration-enter` 210ms with `--easing-enter` cubic-bezier(0.16, 1, 0.3, 1); `--duration-exit` 150ms with `--easing-exit` cubic-bezier(0.4, 0, 1, 1); `--duration-move` 400ms) for every new entrance and exit. Never introduce new durations.
- **Do** ship loading, empty, error, and success states on every view that fetches or mutates data. The anticipos page is the reference: KPI tiles always render; the data table degrades to one of three Empty variants (no data, no matches with filters, generic empty).
- **Do** use Spanish for every user-facing string. The product is monolingual in Spanish; English is only acceptable in code identifiers.
- **Do** maintain WCAG AA contrast in both themes. Foreground on background, primary on primary-foreground, and the four text tokens (foreground / muted-foreground / card-foreground / popover-foreground) on their respective surfaces.

### Don't

- **Don't** introduce display fonts, oversized headlines, or marketing-style typography. The portal is operate-mode internal tooling; the brand mark uses mono, not display serif.
- **Don't** add new gradients, glassmorphism, blur effects, or decorative drop shadows. The system is intentionally flat; the topbar is solid white, not a backdrop-blurred overlay.
- **Don't** invent new radii. Stick to the 4 / 6 / 8 / 12 px scale derived from the 8px base. If a new surface feels off, change the spacing or padding, not the radius.
- **Don't** promote status tones (emerald / amber / sky / rose) into brand surfaces, primary actions, or sidebar/navigation. They are functional, not decorative.
- **Don't** stack two filled buttons of different intents on the same row (e.g., a coral destructive button next to a primary CTA). Confirm destructive intent with an AlertDialog instead.
- **Don't** use shadow as decoration on rows, list items, badges, or sidebar items. Shadows appear only on lifted surfaces (cards at rest, popovers, dialogs, sheets).
- **Don't** break the 768px Surface Flip Rule: any centered modal-style surface must become a bottom-anchored Drawer below 768px. There is no third responsive behavior.
- **Don't** let the topbar drift back to a translucent overlay. The white-on-canvas split is what makes the Three-Zone Contrast Rule work; a backdrop-blurred topbar collapses the canvas and the content well into one surface.
