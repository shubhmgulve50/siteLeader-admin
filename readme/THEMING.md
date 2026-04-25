# Theming — siteLeader-admin

## System

Material-UI v7 `colorSchemes` API with SSR-safe emotion cache via `ThemeRegistry.tsx`.
Dark/light mode toggled by `ThemeToggleButton.tsx` using `useColorScheme()` hook.
Theme definition: `src/theme.ts`.

---

## Colour palette

### Light mode

| Token | Value | Use |
|---|---|---|
| Primary | `#FF6B1A` | Buttons, active nav, chips, progress bars |
| Secondary | `#EF9F27` | Accent highlights, gradient end colour |
| Background default | `#F5F5F5` | Page background |
| Background paper | `#FFFFFF` | Cards, dialogs, tables |
| Text primary | `#1A1A1A` | Body text |
| Text secondary | `#666666` | Captions, placeholders |
| Error | MUI default red | Form error states |
| Success | MUI default green | Success chips |

### Dark mode

| Token | Value | Use |
|---|---|---|
| Primary | `#FF6B1A` | Same — orange brand colour is consistent across modes |
| Background default | `#121212` | Page background |
| Background paper | `#1E1E1E` | Cards, dialogs |
| Text primary | `#FFFFFF` | Body text |
| Text secondary | `#AAAAAA` | Captions |

---

## Typography

| Token | Value |
|---|---|
| Font family | `Poppins` (Google Fonts) — weights 300, 400, 500, 600, 700 |
| Fallback | `sans-serif` |
| Base size | MUI default (14px) |

Geist font also loaded in `layout.tsx` for code/monospace fallback.

---

## Spacing

MUI default spacing scale (8px base unit).
Common usage:
- Page padding: `p: { xs: 2, sm: 3 }` = 16px / 24px
- Card padding: `p: 2` = 16px
- Gap between grid items: `spacing={2}` = 16px

---

## Custom breakpoints

Defined in `theme.ts` alongside standard MUI breakpoints:

| Token | Value |
|---|---|
| `bp300` | 300px |
| `bp400` | 400px |
| `bp500` | 500px |
| `bp600` | 600px |
| `bp700` | 700px |
| `bp800` | 800px |
| `bp900` | 900px |
| `bp1000` | 1000px |

Standard breakpoints (`xs`, `sm`, `md`, `lg`, `xl`) remain unchanged.

---

## Scrollbar styling

Custom primary-coloured scrollbars defined globally in CSS:
- Track: light grey
- Thumb: `#0AA38D` (primary)
- Hover thumb: darker teal

---

## Gradient

Reusable gradient via `GradientBox.tsx`:
- `background: linear-gradient(135deg, #FF6B1A 0%, #EF9F27 100%)` (solid orange-to-amber)
- Used in `PageHeaderWithActions` header strip and `Sidebar` header.

---

## Design tokens (`src/styles/tokens.ts`)

Single source of truth. Import from here — never hardcode these values.

| Export | Value / Type | Use |
|---|---|---|
| `ACCENT.primary` | `#FF6B1A` | Brand orange — KPI cards, icon tints |
| `ACCENT.secondary` | `#EF9F27` | Brand amber — gradient end, secondary KPIs |
| `ACCENT.success/warning/error/info` | semantic hex | KPI card accent colours |
| `ACCENT.purple / rose / amber` | extra semantic | specialty cards |
| `WA_GREEN` | `#25D366` | WhatsApp brand — share buttons **only** |
| `HEADER_BTN_SX` | sx object | Primary action button inside `PageHeaderWithActions` (white translucent on gradient) |
| `HEADER_ICON_BTN_SX` | sx object | Icon-only button inside `PageHeaderWithActions` |
| `TABLE_HEAD_SX` | sx object | Consistent `<TableHead>` styling across all tables |
| `CARD_SX.elevated` | sx object | Standard card container |
| `CARD_SX.accent(color)` | sx factory | Soft-colour KPI/stat card |
| `RADIUS.*` | number (MUI unit) | Border radii — `pill`, `xs`, `sm`, `md`, `lg`, `xl` |
| `SPACING.*` | number (MUI unit) | Standard spacing values |
| `COLORS.*` | MUI color string | Status chip colour maps for site/quotation/payment/milestone/priority |

---

## Dark mode rules

1. Toggle state persists via MUI `colorSchemes` in localStorage.
2. All color tokens switch via the `colorSchemes.dark` config — no manual conditional styling.
3. After any theme token change → update this file.

---

*Last updated: 2026-04-22*
