# Flows — siteLeader-admin

## 1. Login flow

### Purpose
Authenticate admin user and establish session via JWT cookie.

### Steps
1. User navigates to `/login` → `src/app/login/page.tsx`.
2. `LoginForm.tsx` renders email + password fields with RHF + Zod validation (`loginSchema`).
3. On submit → `axiosInstance.post(API.AUTH.LOGIN, { email, password })`.
4. Backend returns user object + sets HttpOnly JWT cookie.
5. Axios interceptors hide loader.
6. On success → `router.push('/admin/dashboard')`.
7. On 401 → toast error shown.
8. Subsequent requests: `middleware.ts` reads cookie, verifies JWT, allows `/admin/*` access.

### Data Pathways
- Input: `{ email: string, password: string }`
- Output: user object + `Set-Cookie: token=<jwt>` (HttpOnly)

### Dependencies
- `src/lib/axios.ts`, `src/app/schemas/advisorSchema.ts` (login schema), `jose` (middleware verify)

---

## 2. Route protection flow

### Purpose
Prevent unauthenticated/unauthorised access to `/admin/*`.

### Steps
1. Any navigation to `/admin/*` triggers `src/middleware.ts` (Edge runtime).
2. Middleware reads `token` cookie.
3. `jose.jwtVerify(token, secret)` — if throws → `NextResponse.redirect('/login')`.
4. Decoded payload checked for required role.
5. If role not allowed → redirect to `/login`.
6. Otherwise → `NextResponse.next()`.

### Data Pathways
- Cookie `token` → decoded JWT payload → `role` field → allow/deny

---

## 3. Dashboard load flow

### Purpose
Show KPI summary cards on `/admin/dashboard`.

### Steps
1. Page mounts (`useEffect`).
2. `axiosInstance.get(API.ADMIN.DASHBOARD_STATS)` fires.
3. Response `{ sites, labours, finance, quotationValue }` populates stat cards.
4. Financial cards compute Net Profit Margin % inline.

### Data Pathways
- `GET /api/admin/dashboard-stats` → `{ sites: number, labours: number, finance: { totalIncome, totalExpense, balance }, quotationValue: number }`

---

## 4. Site CRUD flow

### Purpose
Create, read, update, delete construction sites.

### Steps
1. `sites/page.tsx` mounts → `fetchSites()` → `GET /api/sites`.
2. `GenericTable` renders with 7 columns (Name, Contact, Location, Status, Priority, Date, Actions).
3. **Create**: Add Site button → opens MUI Dialog → form with 4 sections → `POST /api/sites`.
4. **Edit**: Edit icon → pre-fills form with site data → `PUT /api/sites/:id`.
5. **Delete**: Delete icon → `ConfirmDialog` → `DELETE /api/sites/:id`.
6. Any mutation → toast feedback + `fetchSites()` refresh.

### Data Pathways
- `GET /api/sites` → `SiteModel[]`
- `POST /api/sites` → `{ name, phone, address, startDate, clientName, city, lat, lng, type, status, priority, endDate, budget, supervisor, engineer, notes }`
- `PUT /api/sites/:id` → partial update
- `DELETE /api/sites/:id` → 200 OK

---

## 5. Site detail — 5-tab flow

### Purpose
Deep-dive into a single site: operations, labour, materials, logs, finance.

### Steps
1. `/admin/sites/[id]` mounts → `Promise.all([fetchSite(id), fetchStats(id)])`.
2. Tab 0 (Overview): Execution roadmap, financial burn, site cash flow.
3. Tab 1 (Labour & Attendance):
   - Assign labour: `GET /api/labours` → select → `POST /api/sites/assign-labour`.
   - Mark attendance: Present / Half Day / Absent buttons → `POST /api/sites/attendance`.
   - Monthly summary: `GET /api/sites/:siteId/attendance/summary?month=YYYY-MM`.
4. Tab 2 (Materials): `GET /api/materials/logs?siteId=id` → material usage table.
5. Tab 3 (Daily Logs): `GET /api/sites/:siteId/logs` → daily progress entries.
6. Tab 4 (Finance): filtered transactions for this site.

### Data Pathways
- Tab changes trigger lazy fetch calls per tab.

---

## 6. Materials inventory flow

### Purpose
Track material stock levels and log movements (In/Out).

### Steps
1. `materials/page.tsx` mounts → `fetchMaterials()` + `fetchMaterialLogs()`.
2. Tab 0 (Live Stock): cards per material; red chip if `currentStock <= minStock`.
3. Tab 1 (Catalog): table with edit/delete; Add Material → `POST /api/materials`.
4. Tab 2 (Activity): timeline of all movements.
5. **Log Movement**: dialog → select material, type (In/Out), site if Out, qty → `POST /api/materials/log`.
   - `type=In` → stock increases (purchase).
   - `type=Out` → stock decreases (consumption).

### Data Pathways
- `POST /api/materials/log` → `{ materialId, type, quantity, siteId?, note? }`

---

## 7. Finance transaction flow

### Purpose
Record and view income/expense transactions.

### Steps
1. `finance/page.tsx` mounts → `GET /api/finance` → returns `{ data, summary }`.
2. Summary cards: Total Income (green), Total Expense (red), Net Balance.
3. Add Transaction → dialog → `{ type, amount, category, siteId?, date, notes }` → `POST /api/finance`.
4. Edit → `PUT /api/finance/:id`; Delete → `DELETE /api/finance/:id`.

### Data Pathways
- Categories: Client Payment, Material Cost, Labour Wage, Fuel, Office Rent, Marketing, Other.

---

## 8. Quotation (BOQ) flow

### Purpose
Build Bill of Quantities and manage client quotations.

### Steps
1. `quotations/page.tsx` mounts → `GET /api/quotations`.
2. Create Quotation dialog:
   - Client & project details.
   - Dynamic BOQ line items (Description, Qty, Unit, Rate → Amount auto-calculated).
   - Right panel: Subtotal, Tax %, Grand Total.
3. `POST /api/quotations` → backend assigns sequential quotation number (QT-YYNN).
4. Status workflow: Draft → Sent → Approve (button → `PUT /api/quotations/:id`).
5. View dialog shows itemised breakdown.

---

## 9. Labour management flow

### Purpose
Maintain a labour master with wage rates.

### Steps
1. `labours/page.tsx` → `GET /api/labours`.
2. Add Labour dialog: Name, Mobile, Type (Mason/Carpenter/Helper/Electrician/Plumber/Other), Daily Wage.
3. `POST /api/labours`; Edit → `PUT /api/labours/:id`; Delete → `DELETE /api/labours/:id`.

---

## 10. Logout flow

### Steps
1. User clicks logout (Topbar or sidebar).
2. `handleLogout()` in `src/utils/handleLogout.ts`:
   - Clears `localStorage` token.
   - Calls `POST /api/auth/logout` (clears HttpOnly cookie on server).
   - `router.push('/login')`.

---

*Last updated: 2026-04-17*
