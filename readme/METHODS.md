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

*Last updated: 2026-04-17*
