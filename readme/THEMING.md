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
| Primary | `#0AA38D` | Buttons, active nav, chips, progress bars |
| Secondary | `#EF9F27` | Accent highlights, warning-adjacent UI |
| Background default | `#F5F5F5` | Page background |
| Background paper | `#FFFFFF` | Cards, dialogs, tables |
| Text primary | `#1A1A1A` | Body text |
| Text secondary | `#666666` | Captions, placeholders |
| Error | MUI default red | Form error states |
| Success | MUI default green | Success chips |

### Dark mode

| Token | Value | Use |
|---|---|---|
| Primary | `#0AA38D` | Same — teal is consistent across modes |
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
- `background: linear-gradient(135deg, #0AA38D22 0%, transparent 100%)`
- Used in `PageHeaderWithActions`, stat cards, sidebar header.

---

## Dark mode rules

1. Toggle state persists via MUI `colorSchemes` in localStorage.
2. All color tokens switch via the `colorSchemes.dark` config — no manual conditional styling.
3. After any theme token change → update this file.

---

*Last updated: 2026-04-17*
