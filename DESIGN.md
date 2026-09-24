---
name: SIICO Portal
description: Operations console for Siigo's accounting automation catalog and operational data views.
colors:
  primary: oklch(0.385 0.082 256)
  primary-foreground: oklch(0.985 0.002 95)
  background: oklch(0.985 0.002 95)
  foreground: oklch(0.205 0.013 256)
  card: oklch(1 0 0)
  card-foreground: oklch(0.205 0.013 256)
  popover: oklch(1 0 0)
  popover-foreground: oklch(0.205 0.013 256)
  secondary: oklch(0.965 0.004 256)
  secondary-foreground: oklch(0.205 0.013 256)
  muted: oklch(0.965 0.004 256)
  muted-foreground: oklch(0.485 0.013 256)
  accent: oklch(0.945 0.014 256)
  accent-foreground: oklch(0.205 0.013 256)
  destructive: oklch(0.555 0.182 27)
  destructive-foreground: oklch(0.985 0.002 95)
  border: oklch(0.915 0.006 256)
  input: oklch(0.915 0.006 256)
  ring: oklch(0.385 0.082 256)
  chart-1: oklch(0.525 0.142 256)
  chart-2: oklch(0.585 0.118 168)
  chart-3: oklch(0.625 0.142 64)
  chart-4: oklch(0.555 0.182 27)
  chart-5: oklch(0.485 0.184 304)
  sidebar-background: oklch(0.965 0.004 256)
  sidebar-foreground: oklch(0.205 0.013 256)
  sidebar-primary: oklch(0.205 0.013 256)
  sidebar-primary-foreground: oklch(0.985 0.002 95)
  sidebar-accent: oklch(0.945 0.014 256)
  sidebar-accent-foreground: oklch(0.205 0.013 256)
  sidebar-border: oklch(0.915 0.006 256)
  sidebar-ring: oklch(0.385 0.082 256)
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

**Creative North Star: "The Operations Console."**

SIICO's portal is a working console for the Siigo accounting team — a place to dispatch automations, audit their outcomes, and operate on tabular data without leaving the browser. The visual language borrows from engineering and accounting tooling (issue trackers, ERP tables, terminal UIs): typography carries weight, borders carry structure, and color is reserved for state and emphasis rather than decoration. Density wins over breathing room; every pixel should help a counter answer "what is the status of this run?" or "where is this anticipo?" without scrolling for context. The aesthetic is sober, workmanlike, and unmistakably internal — there is no marketing voice here.

The system is bilingual in form (light/dark themes over the same tokens) but monolingual in voice (Spanish UI). It runs on Tailwind v4's CSS-first tokens and shadcn/ui's `new-york` primitives, with IBM Plex Sans and IBM Plex Mono as the only typefaces. Light and dark themes are not equals aesthetically — light is the working canvas for daytime data entry, dark is the after-hours and reduced-glare default — but neither is louder than the other.

**Key Characteristics:**

- Sober, professional, dense; information density wins over whitespace
- One accent (deep slate-blue) carries primary action; chart colors break out only inside data viz
- Type pair is fixed: IBM Plex Sans for prose, IBM Plex Mono for numerics, codes, and the brand mark
- Borders are the primary structural device; shadows appear only on lifted surfaces (cards, dialogs, sheets)
- Operate mode: every screen ships explicit loading, empty, error, and success states

## Colors

The palette is built on a near-black slate-blue accent and a warm off-white paper background, with cool slate-mist neutrals doing all the heavy lifting between them. Chart hues (slate-blue, teal, amber, coral, magenta) exist for data only and are never used for primary actions or brand voice.

### Primary

- **Deep Slate** (`oklch(0.385 0.082 256)`): The single accent voice. Used for primary buttons, the SIICO mark in the sidebar header, active brand marks, and the focus ring. Carries ~10% of the visible surface on any given screen. In dark mode the same role flips to a high-luminance slate-blue (`oklch(0.825 0.064 256)`) so contrast inverts against the dark canvas.
- **Slate Accent** (`oklch(0.945 0.014 256)`): The hover and "selected row" wash. Sits one step darker than `--muted` so a hovered row is legible without competing with focus rings.

### Neutral

- **Paper** (`oklch(0.985 0.002 95)`): The canvas. Warm off-white, slightly yellow on the OKLCH b-axis to read as paper rather than glass. Pure white (`oklch(1 0 0)`) is reserved for cards so they lift off the paper. In dark mode the canvas becomes `oklch(0.165 0.012 256)` (deep ink) and cards become `oklch(0.205 0.013 256)` (slate).
- **Slate Mist** (`oklch(0.965 0.004 256)`): The structural neutral. Same hue as primary but at very low chroma and high lightness. Carries `--muted`, `--secondary`, the sidebar background, and dashed empty-state borders. In dark mode it deepens to `oklch(0.245 0.014 256)`.
- **Hairline Border** (`oklch(0.915 0.006 256)`): 1px borders on cards, tables, inputs, and the topbar. Always the same value as `--input`. In dark mode `oklch(0.285 0.014 256)`.
- **Slate Text** (`oklch(0.205 0.013 256)`): Default body and heading text. Same hue family as primary; never used as a background.
- **Quiet Text** (`oklch(0.485 0.013 256)`): Muted descriptions, helper text, table column headers, and the sidebar's group label. Always paired with the bold label typography.

### Status / Destructive

- **Coral** (`oklch(0.555 0.182 27)`): Destructive actions only (Eliminar registro, error toasts). High chroma so it never gets confused with the muted slate family. Never used for emphasis or branding.
- **Status Tones** (project-local, not in frontmatter): Emerald (`oklch(0.6 0.16 160)` family), amber (`oklch(0.65 0.15 80)` family), sky (`oklch(0.6 0.12 230)` family), and rose. These tones power the KPI tile chips, status badges in the anticipos table, and overdue-date callouts. They are not theme tokens — they are functional role colors. They sit alongside Tailwind's stock emerald/amber/sky/rose ramps to keep them legible in both light and dark mode.

### Chart

- **Slate-Blue** (`oklch(0.525 0.142 256)`), **Teal** (`oklch(0.585 0.118 168)`), **Amber** (`oklch(0.625 0.142 64)`), **Coral** (`oklch(0.555 0.182 27)`), **Magenta** (`oklch(0.485 0.184 304)`): The five-color categorical palette for future charting. Each hue is well-separated on the OKLCH wheel and stays legible at small sizes.

### Sidebar

- **Slate Mist** (`oklch(0.965 0.004 256)` in light, `oklch(0.185 0.012 256)` in dark): The sidebar background — one step deeper than the page background so it reads as a structural surface without competing with cards.
- **Sidebar Primary** (`oklch(0.205 0.013 256)` in light, `oklch(0.945 0.008 95)` in dark): Inverted relative to page primary so the SIICO mark tile in the sidebar header stays dark on light and light on dark.

### Named Rules

**The One-Voice Rule.** The primary accent appears in roughly ≤10% of any given viewport. It speaks for primary actions, the SIICO mark, and focus rings. It never co-occurs with another bright fill on the same screen — a primary button next to a coral destructive button on the same row breaks the rule.

**The Chart-Only Hue Rule.** Hues other than slate-blue exist exclusively inside data viz (chart slots 1–5 and KPI tone chips). Emerald/amber/sky/rose tones are status colors, not decorative accents; do not promote them into brand surfaces.

**The Same-Family Neutrals Rule.** Every neutral token shares the slate hue family (256°). Even the warm paper background sits on the warm yellow axis only at the lowest chroma so it never breaks the slate silhouette.

## Typography

**Display Font:** Not used. Per PRODUCT.md, display typography is explicitly excluded.
**Body Font:** IBM Plex Sans (weights 400, 500, 600, 700), with system-ui fallbacks.
**Label Font:** IBM Plex Sans, semibold, uppercase, tracked.
**Mono Font:** IBM Plex Mono (weights 400, 500, 600), with monospace fallbacks. Reserved for tabular numerics, codes (requerimiento identifiers), the SIICO brand mark, the 404 marker, and KPI values.

**Character:** Plex Sans reads as engineering documentation — slightly humanist, optically distinct at small sizes, and serious without feeling cold. Plex Mono is its workhorse sibling, used wherever a number or code needs to line up with another number or code. The pairing is intentionally narrow: no third typeface, no display weights, no italic flourishes.

### Hierarchy

- **Title** (semibold 600, 16px / `1rem`, line-height 1.25, slight negative tracking): Page titles, card titles, dialog titles. Used at `text-base font-semibold leading-none tracking-tight` in the shadcn primitives. Never scales up to display sizes — if a surface needs more weight, it adds color or borders instead.
- **Body** (regular 400, 14px / `0.875rem`, line-height 1.5): Default prose. Used for form labels, descriptions, table cells, button text, sidebar menu items.
- **Label** (semibold 600, 11px / `0.6875rem`, line-height 1, letter-spacing 0.06em, uppercase): Column headers in tables, sidebar group labels (`ÁREAS`), KPI tile labels, dropdown section labels, eyebrow text in the topbar. Always uppercase and tracked; never mixed-case.
- **Mono** (medium 500, 14px / `0.875rem`, tabular-nums): The mono variant is used selectively for tabular numerics (`KPI values`, dates, requerimiento codes), the SIICO mark in the login card and the 404 marker, and `font-variant-numeric: tabular-nums` on every table cell. Numeric alignment matters more than decoration.

### Named Rules

**The Mono-Number Rule.** Whenever a number is stacked, sorted, or compared in a list, render it in IBM Plex Mono with `tabular-nums`. This includes KPI values, dates in tables, counts in pagination (`Mostrando 1–5 de 23 registros`), and percent suffixes.

**The Uppercase-Label Rule.** Any text ≤ 12px that introduces a section, column, or group is uppercase + tracked + semibold. Mixed-case small text is reserved for prose.

## Layout

The portal follows a fixed two-zone chrome (sticky topbar + persistent sidebar) and a single-canvas content well. Every authenticated page renders inside that chassis.

**Outer chassis:**
- Topbar (`h-14` / 56px) sticky to the top of `SidebarInset`, with `border-b` + `bg-background/80 backdrop-blur`. The sidebar (`16.5rem` / ~264px on desktop) is offcanvas on mobile (`<768px`) and toggleable with `Cmd/Ctrl+B`. The sidebar collapses to an icon rail (`3rem`) when the user toggles.
- The content well uses `max-w-7xl` (1280px) with responsive horizontal padding (`px-4 sm:px-6 lg:px-8`). Vertical rhythm is `py-6 sm:py-8 lg:py-10`.

**Section rhythm inside the content well:**
- Sections stack with `gap-6` (24px) at the page level, `gap-5` (20px) inside a feature surface like anticipos, `gap-3` (12px) between same-rank controls (KPI tiles, filter chips).
- Cards use `p-5` (20px) for headers and content; the KPI tile is tighter at `p-4` (16px) because it packs icon + label + value.
- Form fields stack with `space-y-5` between groups and `space-y-1.5` between label and input. Labels sit above their inputs; helper text and error messages sit directly below.

**Density:**
- Tables use `py-2.5` (10px) on cells, `h-9` (36px) on column headers, and a `Card` shell with `overflow-hidden` and zero internal padding so the table edge meets the card border. Default page size is 5 rows; options expand to 10/20/50/100.
- The anticipos data table renders row numbers in mono, collaborator names in semibold foreground, requerimiento codes in muted mono, dates in muted mono with `tabular-nums`, and statuses as outlined badge pills with a 2px status dot.

**Responsive breakpoints (active in the codebase):**
- `md` (768px): the sidebar switches from a Sheet overlay to the persistent offcanvas rail; form surfaces flip from Drawer (bottom sheet) to Dialog (centered modal); KPI grid collapses from `lg:grid-cols-4` → `2 cols`.
- `lg` (1024px): the dashboard catalog opens up to two columns of area cards.
- The default Tailwind v4 breakpoints (sm/md/lg/xl/2xl) are inherited; the only project-specific breakpoint is the 768px mobile-detection used inside `app-sidebar` and the anticipos form.

**Container rules:**
- Login surface: `max-w-[420px]` card centered in the viewport.
- Dialog (anticipos create/edit): `max-w-md` (28rem), centered.
- Sheet/Drawer (anticipos mobile form): right edge on desktop (`sm:max-w-sm`), bottom-anchored on mobile.
- 404 page: `max-w-md` centered in the viewport.

**Named Rules:**

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

The focus ring is a structural element, not decoration. Pattern: a 1px offset matching the surrounding background color + a 2px ring in `--ring` color. On dark surfaces (sidebar, tooltip), the ring color is `--sidebar-ring` or the inverse foreground. The offset prevents the ring from looking like it's hugging the control; the ring color is always `--ring` so it never blends into the page.

### Named Rules

**The Quiet-Shadow Rule.** Shadows appear only on lifted surfaces (cards at rest, popovers, dialogs, sheets). Never on rows, list items, badges, sidebar items, or inputs.

**The Border-First Rule.** When a surface needs to be visually separated, default to a 1px `--border` before reaching for a shadow. The topbar uses a border-bottom; table rows use a border-bottom; cards use both a border and a `shadow-sm`. Hover states on table rows use `bg-muted/40`, never a shadow.

## Shapes

The form language is soft-but-precise. All radii derive from a single base unit (`0.5rem` / 8px), giving the system four steps: 4px / 6px / 8px / 12px. There is no fifth step.

- **Inputs, buttons, selects, badges, KPI icon chips, sidebar items, table cells**: `rounded-md` (6px). Small enough to read as engineering, large enough to feel modern.
- **Cards, dialogs, sheets, popovers, dropdowns, empty states**: `rounded-lg` (8px). The "container" radius.
- **Login card, KPI tile icon containers**: `rounded-lg` (8px) — same as other containers. Nothing in the portal uses `rounded-xl` (12px) at the moment; the slot is reserved for future hero or marketing surfaces.
- **Avatars, status dots, mono numeric badges with full circles**: `rounded-full`. Only used for circular elements.
- **Topbar, sidebar (when collapsed to icon rail)**: square corners — they meet the viewport edges.

**Borders** are always 1px. There are no thicker borders anywhere in the system except the focus ring.

**Named Rules:**

**The Eight-Pixel-Family Rule.** All radii are derived from `--radius: 0.5rem` (8px): 4 / 6 / 8 / 12 px. Do not introduce new radii — if a new surface doesn't fit one of these four steps, change the surface, not the scale.

**The Square-Chrome Rule.** The persistent chrome (topbar, sidebar rail, page edges) is square. Corners only soften inside the content well.

## Components

### Buttons

- **Shape:** `rounded-md` (6px).
- **Primary:** `bg-primary` + `text-primary-foreground` + `shadow-sm`. Hover drops to `bg-primary/90`. Used sparingly — one per surface, never stacked.
- **Outline:** `bg-background` + `border border-input` + `text-foreground` + `shadow-sm`. Hover fills with `bg-accent`. The default secondary action (Cancelar, Limpiar filtros).
- **Ghost:** No background, no border, `text-foreground`. Hover fills with `bg-accent`. Used for low-emphasis actions like icon buttons in the topbar.
- **Destructive:** `bg-destructive` + `text-destructive-foreground` + `shadow-sm`. Reserved for confirmed destructive actions (Eliminar). Destructive intent in non-confirmatory contexts uses the destructive ghost variant (coral text on transparent background, only visible on hover).
- **Link:** `text-primary` + `underline-offset-4` + hover underline. Used inline in the 404 page and in `EmptyDescription`.
- **Sizes:** `default` (h-9 / 36px, px-4), `sm` (h-8 / 32px, px-3, text-xs), `lg` (h-10 / 40px, px-6), `icon` (h-9 w-9 / 36px square).
- **Focus:** 2px ring in `--ring`, 1px offset matching background. Disabled drops to 50% opacity and ignores pointer events.

### Chips (Badges)

- **Style:** Outlined pill — 1px border + matching tinted background + matching tinted text. `rounded-md` (6px). Padding `px-2 py-0.5`. `text-xs font-medium`.
- **Variants:**
  - `default`: filled primary.
  - `secondary`: filled `--secondary` / `--secondary-foreground`.
  - `destructive`: filled destructive.
  - `outline`: transparent background, `--foreground` text.
  - `success`: emerald family (50 bg / 700 fg / 200 border in light, 950/40 bg / 300 fg / 900/40 border in dark).
  - `warning`: amber family (50/700/200 in light, 950/40/300/900/40 in dark).
- **Status dot convention:** Status badges in the anticipos table prepend a 6px dot in the matching status color (`bg-emerald-500`, `bg-amber-500`, `bg-sky-500`, `bg-rose-500`, `bg-muted-foreground` for the default tone). The dot is `mr-1.5 size-1.5 rounded-full shrink-0`.

### Cards / Containers

- **Corner Style:** `rounded-lg` (8px).
- **Background:** `--card` (pure white in light, slate in dark) — one step lifted off the page background so cards read as containers.
- **Border:** 1px `--border`. Always.
- **Shadow:** `shadow-sm`. Always on the resting card.
- **Internal Padding:** `p-5` (20px) for header / content / footer slots. The KPI tile variant is tighter at `p-4` and lays out icon + label + value horizontally.

### Inputs / Fields

- **Style:** 1px `--input` border + `--background` fill + `rounded-md` (6px). `h-9` (36px) on text inputs. `text-sm`.
- **Padding:** `px-3 py-1` for text inputs, `px-3 py-2` for textarea and select.
- **Placeholder:** `--muted-foreground`.
- **Focus:** border switches to `--ring`, with a 3px outer halo at `--ring/50`. The halo is wider than the standard button focus ring to make the input's focused edge unmistakable in dense form rows.
- **Error:** `aria-invalid` flips the border to `--destructive` and adds a `ring-destructive/20` halo.
- **Disabled:** 50% opacity + `cursor-not-allowed`.
- **Search variant (anticipos data table):** Adds a leading search icon at `left-2.5`, a clear-button on the right when filled, and `pl-7 pr-7` so icons don't collide with text.

### Navigation

- **Topbar:** `h-14` sticky, `border-b border-sidebar-border`, `bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60`. Left side: sidebar trigger + breadcrumb (eyebrow + title). Right side: theme toggle + user menu.
- **Sidebar:** `w-[16.5rem]` persistent on `md+`, offcanvas Sheet on mobile. `bg-sidebar` (slate-mist in light, deep ink in dark). Header holds the SIICO mark tile (8×8 square, primary fill, dashboard icon) + a two-line "SIICO / Portal contable" label. Footer holds the user card (avatar + name + email).
- **Sidebar menu item:** `rounded-md` (6px), `h-8` (32px), `p-2`, full-width. Icon + label + (optional) chevron. Hover fills with `--sidebar-accent`. Active state uses `data-active=true` to apply `--sidebar-accent` + semibold weight + `--sidebar-accent-foreground`. Group-active (a collapsible has a child active but the trigger itself is collapsed) uses `--sidebar-accent/60` for a softer hint.
- **Sub-menu item:** `text-xs`, indented under the parent, separated by a 1px `--sidebar-border` left rail. Same hover/focus treatment, no chevron.
- **Group label:** `text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/55`. The `55%` opacity is deliberate — quieter than the menu items above it so the eye lands on the items first.
- **Keyboard:** `Cmd/Ctrl+B` toggles the sidebar. The state persists in a 7-day `sidebar_state` cookie.

### Signature Components

- **KPI Tile (`KpiTile` in `anticipos-page.tsx`):** A horizontal card with a colored icon chip on the left and a two-line stack on the right. Icon chip is `size-9 rounded-md border` filled with a tone class (`bg-primary/10` + `text-primary` + `border-primary/15` for the default tone; emerald/amber/rose for status tones). Label is `text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`. Value is `font-mono text-xl font-semibold tabular-nums text-foreground`; an optional suffix slot (`tasaLegalizacion` style) renders muted mono text right of the value.
- **Column header with sort (`DataTableColumnHeader`):** A two-column flex — uppercase label on the left, sort button on the right. Sort button is `size-6 ghost icon` with `ArrowUpDown` (idle, `opacity-60`), `ArrowUp`, or `ArrowDown` depending on sort state.
- **Empty state (`Empty` + `EmptyHeader` + `EmptyMedia` + `EmptyTitle` + `EmptyDescription`):** Centered column with optional `size-10 rounded-full border bg-muted` icon container, title at `text-sm font-semibold text-foreground`, description at `text-sm text-muted-foreground`. Wrapped in a Card with `border-0 bg-transparent py-14` when shown inside the data table so the table's border carries the structure.
- **Login card:** A `rounded-lg border bg-card` with `p-8 sm:p-10`. The SIICO mark uses `font-mono text-sm font-semibold tracking-[0.14em]` — the only place in the portal where the brand mark is set in mono at a wider tracking than labels. The footer caption below the card is `font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70` — even quieter than group labels.

## Do's and Don'ts

### Do

- **Do** render every numeric column with `font-variant-numeric: tabular-nums` and prefer IBM Plex Mono for values that get sorted or summed.
- **Do** reserve primary buttons for the single most important action on a surface; use outline for the dismiss/secondary action.
- **Do** pair the project motion tokens (`--duration-enter` 210ms with `--easing-enter` cubic-bezier(0.16, 1, 0.3, 1); `--duration-exit` 150ms with `--easing-exit` cubic-bezier(0.4, 0, 1, 1)) for every new entrance and exit. Never introduce new durations.
- **Do** ship loading, empty, error, and success states on every view that fetches or mutates data. The anticipos page is the reference: KPI tiles always render; the data table degrades to one of three Empty variants (no data, no matches with filters, generic empty).
- **Do** use Spanish for every user-facing string. The product is monolingual in Spanish; English is only acceptable in code identifiers.
- **Do** maintain WCAG AA contrast in both themes. Foreground on background, primary on primary-foreground, and the four text tokens (foreground / muted-foreground / card-foreground / popover-foreground) on their respective surfaces.

### Don't

- **Don't** introduce display fonts, oversized headlines, or marketing-style typography. The portal is operate-mode internal tooling; the brand mark uses mono, not display serif.
- **Don't** add new gradients, glassmorphism, blur effects beyond the existing topbar backdrop-blur, or decorative drop shadows. The system is intentionally flat.
- **Don't** invent new radii. Stick to the 4 / 6 / 8 / 12 px scale derived from the 8px base. If a new surface feels off, change the spacing or padding, not the radius.
- **Don't** promote status tones (emerald / amber / sky / rose) into brand surfaces, primary actions, or sidebar/navigation. They are functional, not decorative.
- **Don't** stack two filled buttons of different intents on the same row (e.g., a coral destructive button next to a primary CTA). Confirm destructive intent with an AlertDialog instead.
- **Don't** use shadow as decoration on rows, list items, badges, or sidebar items. Shadows appear only on lifted surfaces (cards at rest, popovers, dialogs, sheets).
- **Don't** break the 768px Surface Flip Rule: any centered modal-style surface must become a bottom-anchored Drawer below 768px. There is no third responsive behavior.
