# Auth and Routing — siteLeader-admin

## JWT verification (middleware)

**File:** `src/middleware.ts`
**Runtime:** Next.js Edge runtime (runs before page render)

### How it works

1. Reads `token` cookie from incoming request.
2. Calls `jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET))`.
3. If verification throws (expired, invalid, missing) → `NextResponse.redirect(new URL('/login', req.url))`.
4. Decodes payload, checks `payload.role`.
5. If role not in `ALLOWED_ROLES` → redirect to `/login`.
6. Otherwise → `NextResponse.next()`.

### Protected paths

All routes matching `/admin/:path*` are protected.
The middleware `matcher` config excludes:
- `/login`
- `/api/*`
- `/_next/*`
- `/public/*`
- Static file extensions (`.png`, `.svg`, etc.)

### Token source

Token is set as an HttpOnly cookie by the backend on login. The middleware reads it from the cookie (not localStorage). The Axios instance reads a copy from localStorage for API calls — both are set at login time.

---

## RBAC — Role-based access control

Roles defined in `src/constants/constants.ts`:

```typescript
export const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  BUILDER: "BUILDER",
  SUPERVISOR: "SUPERVISOR",
  ENGINEER: "ENGINEER",
  WORKER: "WORKER",
};
```

### Frontend enforcement

- Middleware blocks entire `/admin/*` tree for invalid tokens.
- Individual pages check `user.role` to show/hide action buttons:
  - Add/Edit/Delete buttons: visible only to `SUPER_ADMIN` and `BUILDER`.
  - View-only for `SUPERVISOR`, `ENGINEER`, `WORKER`.
- No dedicated RBAC hook — role checks are inline in component JSX.

---

## Route structure

| Path | Auth required | Notes |
|---|---|---|
| `/` | No | Redirect → `/admin/settings` |
| `/login` | No | Public; redirects to `/admin/dashboard` on success |
| `/admin/*` | Yes | Entire subtree protected by middleware |
| `/admin/dashboard` | Yes | Dashboard KPIs |
| `/admin/sites` | Yes | Site list CRUD |
| `/admin/sites/[id]` | Yes | Dynamic site detail |
| `/admin/labours` | Yes | Labour master |
| `/admin/materials` | Yes | Inventory |
| `/admin/finance` | Yes | Transactions |
| `/admin/quotations` | Yes | BOQ builder |
| `/admin/settings` | Yes | Password change |

---

## Logout

`src/utils/handleLogout.ts`:
1. `localStorage.removeItem('token')` — clears client copy.
2. `POST /api/auth/logout` — backend clears HttpOnly cookie.
3. `router.push('/login')`.

---

*Last updated: 2026-04-17*
