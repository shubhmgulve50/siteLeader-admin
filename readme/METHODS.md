# Methods — siteLeader-admin

## Utility functions

### `src/utils/utils.ts`

#### `sortObject(obj: object): object`
Deep-sorts all keys of an object alphabetically. Used before JSON comparison to normalise key order.

#### `compareJSONObject(a: object, b: object): boolean`
Stringifies both objects after `sortObject` and compares. Returns `true` if structurally equal. Used to detect if a form value has changed before submitting a PUT request.

---

### `src/utils/handleLogout.ts`

#### `handleLogout(router: NextRouter): void`
1. Clears `localStorage` token entry.
2. Calls `POST /api/auth/logout` to clear HttpOnly cookie on server.
3. Calls `router.push('/login')`.

Called from Topbar or sidebar logout button.

---

### `src/utils/format.ts`

Shared INR currency + Indian-locale date helpers. Use these instead of inline formatters in pages.

#### `formatINR(n?: number | null): string`
Compact INR formatter. Returns `₹0` for null/undefined. Suffixes: `Cr` (≥1 crore), `L` (≥1 lakh), `K` (≥1k). Below 1k uses `en-IN` locale grouping.

#### `formatINRFull(n?: number | null): string`
Full-precision INR — no compact suffix, up to 2 decimals, `en-IN` grouping (e.g. `₹1,23,456.75`). Use on invoices, RA bills, PDF exports.

#### `formatDateIN(d?: string | Date | null, opts?: Intl.DateTimeFormatOptions): string`
`en-IN` locale date formatter. Default opts: `{ day: "2-digit", month: "short", year: "numeric" }` → `21 Apr 2026`.

#### `daysBetween(target: string | Date): number`
Days from now to `target`. Negative = past.

#### `calcDateProgress(start, end?): number | null`
Elapsed % between two dates, clamped 0–100. `null` if no end date or end ≤ start.

---

### `src/utils/share.ts`

WhatsApp share helpers. Uses `https://wa.me/` URL scheme — works on mobile + web.

#### `shareOnWhatsApp(text: string, phone?: string): void`
Opens WhatsApp with pre-filled `text`. If `phone` passed (with or without country code), shares to that contact; else opens contact picker.

#### `buildSiteSummary(site, stats?): string`
Builds formatted summary text (name, status, client, contact, address, financials) suitable for WhatsApp. Used by Site Detail header share button.

---

## Custom hooks

### `useLoader` (in `src/components/Loader.tsx`)

Zustand store exposing:
- `loading: boolean`
- `setLoading(value: boolean): void`

Used by Axios interceptors to show/hide the global loading overlay. Do not set this manually in components — it is driven entirely by Axios interceptors.

---

## Axios instance (`src/lib/axios.ts`)

### Instance config
- `baseURL`: `process.env.NEXT_PUBLIC_API_URL`
- `withCredentials: true` (sends HttpOnly cookies)

### Request interceptor
1. `setLoading(true)` via Zustand.
2. Reads token from `localStorage.getItem('token')`.
3. Sets `Authorization: Bearer <token>` header.
4. Ensures `data` is not `undefined` on POST/PUT/PATCH.

### Response interceptor
1. `setLoading(false)` on both success and error.
2. On `error.response.status === 401` → `window.location.href = '/login'`.
3. Passes error through for component-level catch.

---

## API endpoint constants (`src/constants/apiEndpoints.ts`)

Nested object structure. Always import from here — never hardcode URL strings.

```typescript
// Pattern:
API.AUTH.LOGIN        // '/api/auth/login'
API.SITES.LIST        // '/api/sites'
API.SITES.DETAIL(id)  // '/api/sites/:id'
API.MATERIALS.LOG     // '/api/materials/log'
API.ADMIN.STATS       // '/api/admin/dashboard-stats'
```

---

## Design tokens (`src/styles/tokens.ts`)

Single source of truth for radius / spacing / status-colour mapping. Use everywhere for visual consistency.

```typescript
import { RADIUS, SPACING, COLORS, ACCENT } from "@/styles/tokens";

// Paper radius — always RADIUS.md (3)
sx={{ borderRadius: RADIUS.md }}

// Status chip colours (by domain)
COLORS.site["Ongoing"]          // "warning"
COLORS.payment["OVERDUE"]       // "error"
COLORS.milestone["IN_PROGRESS"] // "warning"

// Accent palette for KPI cards
ACCENT.success  // #16a34a
ACCENT.primary  // #2563eb
ACCENT.amber    // #b45309
```

---

## Shared common components

### `KpiCard` (`src/components/common/KpiCard.tsx`)
Unified statistic card — replaces ad-hoc `<Paper>` with inline alpha-tinted backgrounds. Three variants:

```tsx
import KpiCard from "@/components/common/KpiCard";
import { ACCENT } from "@/styles/tokens";

<KpiCard label="Total Sites" value={12} icon={<SiteIcon />} color={ACCENT.primary} variant="default" />
<KpiCard label="Revenue" value="₹1,24,500" color={ACCENT.success} variant="soft" />
<KpiCard label="Overdue" value="3" color={ACCENT.error} variant="filled" />
```

- **default** — neutral paper with coloured icon bubble, hover lift
- **soft** — tinted bg with coloured border, uppercase coloured label
- **filled** — full accent bg with white text (use sparingly for emphasis)

### `StatusChip` (`src/components/common/StatusChip.tsx`)
Domain-driven status chip that picks colour from `COLORS` map and translates label through `status.*` i18n keys.

```tsx
import StatusChip from "@/components/common/StatusChip";

<StatusChip status="Ongoing" domain="site" />
<StatusChip status="OVERDUE" domain="payment" />
<StatusChip status="IN_PROGRESS" domain="milestone" />
```

Skip `domain` prop to default to `"site"`. Pass `raw` to bypass i18n translation (rare).

### `GenericTable` (`src/components/common/GenericTable.tsx`)
Canonical list-page table. Always use this over native `<Table>` for consistency — built-in skeleton loading, empty-state, hover rows, uniform `grey.50` header bg.

---

## App constants (`src/constants/constants.ts`)

### `ROLE`
```typescript
export const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  BUILDER: "BUILDER",
  SUPERVISOR: "SUPERVISOR",
  ENGINEER: "ENGINEER",
  WORKER: "WORKER",
};
```

### `MAIN_MENU_ITEMS`
Array of sidebar navigation items — each item has `label`, `icon`, `path`, and optional `roles` array for access control.

---

## Zod schemas (`src/app/schemas/advisorSchema.ts`)

Contains shared Zod validation schemas. Currently includes `loginSchema`. Add new page schemas here to keep validation co-located.

---

## ThemeRegistry (`src/providers/ThemeRegistry.tsx`)

SSR-safe MUI + emotion setup for Next.js App Router. Wraps the app in:
1. `CacheProvider` (emotion) for SSR-safe style injection.
2. `ThemeProvider` with `theme` from `src/theme.ts`.

Do not add business logic here.

---

---

## i18n (en / hi / mr)

Lightweight context-based translation — no next-intl, no route restructure.

### Files
- `src/i18n/locales/{en,hi,mr}.json` — flat JSON dictionaries, nested by namespace (menu, common, status, attendance, toast).
- `src/i18n/LocaleProvider.tsx` — React Context. Reads `localStorage.siteLeader.locale`. Fallback resolution: active → en → raw key.
- `src/components/LanguageSwitcher.tsx` — MUI IconButton + Menu dropdown in Topbar.

### Wiring
1. `app/layout.tsx` wraps children in `<LocaleProvider>`.
2. `components/Topbar.tsx` renders `<LanguageSwitcher />`.
3. User choice persists in `localStorage` and updates `<html lang>` attr.

### Usage
```tsx
import { useT } from "@/i18n/LocaleProvider";

export default function MyComponent() {
  const t = useT();
  return <Button>{t("common.save")}</Button>;
}
```

With interpolation: `t("greeting", { name: "Raj" })` → template `"Hello {{name}}"`.

### Retrofit strategy
- **Done**: sidebar menu labels (via `labelKey` in `MAIN_MENU_ITEMS` + `BOTTOM_MENU_ITEMS`).
- **Progressive migration**: when editing any page, replace hardcoded user-facing strings with `t("namespace.key")`. Add missing keys to all three JSON files together. Never let one language fall behind — `LocaleProvider` falls back to `en` for missing keys so nothing breaks but UX degrades.
- **Print pages**: intentionally left in English (invoices, RA bills, registers) for universal recipient readability. Switch via locale only if client explicitly requests.
- **User data**: never auto-translate user-entered content (site names, labour names, notes). Only static UI chrome.

### Font support
Hindi + Marathi share Devanagari script. System fonts handle it; add Noto Sans Devanagari via `next/font` if visual polish is needed.

### Number / date locale
Already `en-IN` throughout via `formatINRFull` + `formatDateIN`. Works correctly for hi/mr users too — Indian grouping (1,00,000) is locale-appropriate.

---

*Last updated: 2026-04-22*
