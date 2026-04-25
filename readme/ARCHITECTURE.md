# Architecture — siteLeader-admin

## Runtime

Next.js 15 App Router, React 19, TypeScript strict mode.
Dev server runs on port 3002 (`next dev --turbopack --port 3002`).
Production: AWS Amplify.

---

## Layers

```
Browser
  └── Next.js App Router (src/app/)
        ├── middleware.ts          ← JWT verification, route guard (Edge runtime)
        ├── Server Components      ← layouts, static shells
        └── Client Components      ← "use client" — all interactive pages
              ├── lib/axios.ts     ← HTTP client (interceptors)
              ├── constants/       ← API endpoints, roles, menu items
              └── components/      ← shared UI primitives + feature tabs
```

---

## Request lifecycle

1. Browser navigates to `/admin/*`.
2. **`src/middleware.ts`** runs at the Edge:
   - Reads `token` from cookies.
   - Verifies JWT with `jose` using `NEXT_PUBLIC_JWT_SECRET`.
   - If invalid/missing → redirects to `/login`.
   - If valid → decodes role; if role not in allowed list → redirects to login.
3. Next.js renders the matching page component (client component, `"use client"`).
4. `useEffect` fires, calling `axiosInstance.get(API_ENDPOINT)` from `lib/axios.ts`.
5. **Request interceptor** in `lib/axios.ts`:
   - Shows global loader (Zustand `useLoader`).
   - Attaches `Authorization: Bearer <token>` from `localStorage`.
   - Ensures POST/PUT/PATCH body is never `undefined`.
6. API responds; **response interceptor**:
   - Hides loader.
   - On 401 → `router.push('/login')`.
7. Component updates state, React re-renders.

---

## Key integrations

| Integration | Location | Purpose |
|---|---|---|
| JWT auth | `src/middleware.ts` | Route protection at Edge |
| Axios | `src/lib/axios.ts` | All HTTP calls with interceptors |
| MUI Theme | `src/providers/ThemeRegistry.tsx`, `src/theme.ts` | SSR-safe styling |
| Zustand | `src/components/Loader.tsx` | Global loading overlay state |
| Zod + RHF | page components | Form validation |
| React Hot Toast | `src/app/layout.tsx` | User feedback notifications |
| CloudFront CDN | `next.config.ts` | Remote image optimisation |

---

## Environment variables

| Variable | Used in | Purpose |
|---|---|---|
| `NEXT_PUBLIC_JWT_SECRET` | `src/middleware.ts` | JWT signature verification |
| `NEXT_PUBLIC_API_URL` | `src/lib/axios.ts` | Backend API base URL |
| `NEXT_PUBLIC_WEBSITE_URL` | redirects | Frontend origin URL |

All `NEXT_PUBLIC_*` vars are inlined at build time and visible to the browser. The JWT secret exposure here is a known tradeoff — verification only; signing is server-side.

---

*Last updated: 2026-04-17*
