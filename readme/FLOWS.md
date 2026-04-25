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
2. Header: site name + status / priority / project-type / end-date countdown chips. Action group (responsive):
   - Always visible: Call (tel:), **WhatsApp share** (opens `wa.me/?text=<site summary>`).
   - Desktop only (md+): Open in Maps, Export PDF, Refresh, Edit.
   - Mobile (xs–sm): `MoreVertIcon` → MUI `Menu` with Maps / PDF / Refresh / Edit items.
3. **Quick Action strip** (horizontal scroll on mobile) sits between info bar and KPIs: `+ Daily Log`, `+ Attendance`, `+ Material Log`, `+ Expense`. Each jumps to the relevant tab via `setActiveTab`.
4. Tab 0 (Overview): Execution roadmap, financial burn, site cash flow.
5. Tab 1 (Labour & Attendance):
   - Assign labour: `GET /api/labours` → select → `POST /api/sites/assign-labour`.
   - Mark attendance: Present / Half Day / Absent buttons → `POST /api/sites/attendance`.
   - Monthly summary: `GET /api/sites/:siteId/attendance/summary?month=YYYY-MM`.
6. Tab 2 (Materials): `GET /api/materials/logs?siteId=id` → material usage table.
7. Tab 3 (Daily Logs): `GET /api/sites/:siteId/logs` → daily progress entries. Each card renders an `ImageList` thumbnail grid (3/4/6 cols xs/sm/md); clicking opens a full-screen lightbox with prev/next navigation. "Add Daily Log" dialog supports multi-photo selection (up to 10 files, ≤5MB each, camera via `capture="environment"` on mobile) submitted as `multipart/form-data` to `POST /api/sites/logs` (Content-Type stripped in `transformRequest` so the browser sets the boundary automatically).
8. Tab 4 (Finance): filtered transactions for this site.

### WhatsApp share
`handleShareWhatsApp` → `buildSiteSummary(site, siteStats)` (see `utils/share.ts`) → `shareOnWhatsApp(text)` opens `https://wa.me/?text=<encoded>`. No phone → contact picker. No backend call, pure client-side.

### Data Pathways
- Tab changes trigger lazy fetch calls per tab.
- PDF export button is a placeholder (toast "coming soon") until Phase 1 Step 4 (RA bill / report PDFs).

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
Build Bill of Quantities (Indian PWD-style) with rate analysis and manage client quotations. Supports CGST/SGST/IGST split, discount, validity, optional section grouping, and HSN/SAC codes.

### Steps
1. `quotations/page.tsx` mounts → `GET /api/quotations`.
2. **Create Quotation** dialog (responsive `maxWidth=lg`, stacked fields on xs):
   - **Client & project details** — Client name, site, address.
   - **BOQ items** — each item card has:
     - Section title (optional — groups items in print view)
     - Item # (e.g. `1.1`, `A.2`) + HSN/SAC + description (multiline)
     - Qty, unit (Sq.Ft, Sq.Mt, Cu.Mt, Brass, Bags, Nos, Kg, MT, RMT, Lump Sum)
     - Rate (auto-disabled when rate analysis has values; else manual)
     - Computed amount (read-only)
     - Expandable **Rate Analysis** panel: Material ₹ + Labour ₹ + Equipment ₹ + Overhead+Profit ₹ per unit, plus notes
   - **Tax & Settings** card — GST Type (None / CGST+SGST / IGST), % inputs, discount ₹, valid-until date.
   - **Totals panel** (primary-bg) — live Sub Total / Discount / CGST / SGST / IGST / Tax / Grand Total (all in `formatINRFull` `en-IN` grouping).
3. `POST /api/quotations` → backend recomputes totals via `computeTotals` (see `controllers/quotation.controller.js`), assigns sequential `QT-YYNN`, saves `cgstAmount/sgstAmount/igstAmount/taxAmount/totalAmount/subTotal/discountAmount`.
4. Status workflow: Draft → Sent (View dialog button) → Approved (list action).
5. **View dialog** actions: Print/PDF (opens `/admin/quotations/[id]/print`), Share on WhatsApp, Mark as Sent.

### Print / PDF flow (`/admin/quotations/[id]/print`)
- Standalone A4-sized page with print-friendly @media rules.
- Header + bill-to + site + grouped items table (HSN column + per-item rate-analysis `M+L+E+O` breakdown).
- Totals block with CGST/SGST or IGST split, discount, grand total.
- Amount-in-words (Indian Lakh/Crore system) via `numberToWordsIN`.
- "Print / Save as PDF" and "Share on WhatsApp" buttons (hidden on print).
- Browser's native Print → Save as PDF used — no server-side puppeteer needed, works on Lambda.

---

## 9. Labour management flow

### Purpose
Maintain a labour master with wage rates.

### Steps
1. `labours/page.tsx` → `GET /api/labours`.
2. Add Labour dialog: Name, Mobile, Type (Mason/Carpenter/Helper/Electrician/Plumber/Other), Daily Wage.
3. `POST /api/labours`; Edit → `PUT /api/labours/:id`; Delete → `DELETE /api/labours/:id`.

---

## 10. GST Tax Invoice flow

### Purpose
Issue GST-compliant tax invoices (CGST+SGST or IGST) to clients with payment tracking.

### Steps
1. `invoices/page.tsx` → `GET /api/invoices`. Table columns: Invoice #, Client, GSTIN, Site, Date, Total, Status (UNPAID/PARTIAL/PAID/OVERDUE).
2. **New Invoice** dialog (`maxWidth=lg`): Client details (name/GSTIN/address/phone/email/place-of-supply), line items (description, HSN, qty, unit, rate, amount), GST type (CGST+SGST / IGST / None), discount, notes, terms. Live totals panel with sub total → taxable → CGST/SGST/IGST → round-off → grand total (`formatINRFull`).
3. `POST /api/invoices` → backend `computeTotals()` + auto-number `INV-YYNNNN`.
4. **Payment tracking**: "Record Payment" action opens small dialog → `POST /api/invoices/:id/payments { amount }` → server derives `paymentStatus` (PAID/PARTIAL/UNPAID/OVERDUE).
5. **Print**: row action opens `/admin/invoices/[id]/print` — A4 sheet with "Tax Invoice" header, bill-to + GSTIN, items with HSN column, CGST/SGST/IGST breakdown, round-off, amount-in-words, notes/terms, signatures.
6. **WhatsApp share**: row action composes `*Invoice ...*` text via `shareOnWhatsApp`.

---

## 11. Running Account (RA) Bill flow

### Purpose
Issue Indian-style progress bills against a quotation/contract with cumulative qty tracking, retention, mobilization recovery, TDS.

### Steps
1. `ra-bills/page.tsx` → `GET /api/ra-bills`. Columns: RA #, Client, Site, Date, This Period, Net Payable, Status (DRAFT/SUBMITTED/CERTIFIED/PAID).
2. **New RA Bill** dialog (`maxWidth=lg`):
   - **Project & Client**: Site (required), optional Quotation link, client name/GSTIN/address, issue date, period from/to, status. "Seed Items from Quotation" button → `GET /api/ra-bills/seed?siteId=&quotationId=` → pre-fills items with contract qty/rate AND sums `previousCumulativeQty` from all prior RA bills for this site.
   - **Items grid**: per-BOQ-item row shows Item # / Description / Unit / Contract Qty / Rate / Previous Cum. Qty / This Cum. Qty → computed Current Qty + Current Amount (read-only).
   - **Deductions & Taxes**: Retention %, Mobilization Recovery ₹, Security Deposit ₹, Other Deductions ₹ + note, GST type + % (CGST+SGST or IGST), TDS %.
   - **Live totals panel**: Cumulative Gross − Previously Billed → This Period Gross − deductions → Taxable → + GST → − TDS → **Net Payable**.
3. `POST /api/ra-bills` → server re-computes totals; auto-assigns `RA-YY-NNN` and per-site `raSequence`.
4. **Print**: `/admin/ra-bills/[id]/print` — A4 sheet with measurement table (9 columns: #, Description, Unit, Rate, Contract Qty, Prev Cum, Cum, Current, Current Value), running-account totals, retention/mobilization/SD/TDS lines, amount-in-words, 3-column signature block (Prepared / Certified / Accepted).
5. **WhatsApp share** + Edit + Delete row actions.

---

## 12. Labour advance + payment register flow

### Purpose
Record wage advances paid to labour; subtract from monthly earnings to compute balance owed; print a monthly payment register.

### Steps
1. In the **Site → Labour** tab, each assigned labour row has an **Advance** button. Clicking opens a small dialog (Amount ₹, Date, Payment Mode — Cash/UPI/Bank/Cheque/Other, Note). `POST /api/labour-advances` with `siteId` auto-attached.
2. The **Attendance &amp; Payroll Summary** (below the attendance table) now shows columns: P, HD, A, Total Days, **Earnings**, **Advance**, **Balance** (`formatINRFull`). Balance = earnings − advance. Each row has an inline "Add Advance" icon.
3. **Payment Register** button in the summary header opens `/admin/labour-register/print?siteId=&month=&year=` — standalone A4-landscape register.
4. Print page renders builder-ready format: Sr / Name / Category / Rate / P / HD / A / Total / Earnings / Advance / Balance / signature column per worker, footer totals (Gross / Advances / Net Payable), 3-column signature block.
5. WhatsApp share button on register composes a monthly summary text via `shareOnWhatsApp`.

---

## 13. Material issue slip flow

### Purpose
Record and print acknowledgment slips when site store issues material to a worker/contractor (or receives stock from a vendor).

### Steps
1. **Site → Materials tab**: "Add Material Log" dialog now switches form shape by type:
   - **Stock OUT (Issue)**: Material, Qty, Issued To, Purpose, Notes. Submit → `POST /api/materials/log` → server assigns `issueSlipNumber` (ISS-YY-NNNN).
   - **Stock IN (Purchase/Delivery)**: Material, Qty, Vendor, Invoice Ref, Notes.
2. Logs table columns: Date, Slip #, Material, Type (Issued/Stock-In), Qty, Issued-To / Vendor, Purpose / Invoice, Actions.
3. Per-row actions on Out rows: **Print Slip** (opens `/admin/material-slips/[id]/print`) + **WhatsApp** (shares slip summary).
4. Print page renders A5 slip: header + slip# / date / site / material table / context rows / 2-column signature block. Print CSS: `@page { size: A5 }`.
5. Uses shared utilities: `formatDateIN`, `shareOnWhatsApp`.

---

## 14. Expense receipt photo flow

### Purpose
Attach receipt images / PDFs (bills, invoices) to each finance transaction.

### Steps
1. On **Site → Finance** tab OR **/admin/finance**, clicking "Add Entry" opens the form dialog. Form has: Type, Amount ₹, Category, Payment Mode (Cash/UPI/Bank/Cheque/Other), Date, Notes + **Receipts** section.
2. Receipt picker accepts `image/*,application/pdf`, max 5 files, 5MB each. Mobile uses `capture="environment"` for direct camera. PDFs render as placeholder tile with "PDF" label.
3. On edit, existing receipts shown with red "X" to mark for removal (greyed overlay); new uploads highlighted with green dashed border.
4. Submission uses `FormData` + `transformRequest` to strip Content-Type so the browser auto-sets multipart boundary. Field `receipts` repeated per file; existing receipts flagged via `removeReceipt`.
5. Backend uploads new files to `s3://<bucket>/receipts/<builderId>/` and updates `receiptUrls: string[]` on the Transaction. On delete, S3 objects are cleaned up best-effort.
6. Table shows a `ReceiptLong` icon when `receiptUrls.length > 0`; click opens a full-screen lightbox with prev/next navigation. PDFs render a placeholder with an "Open PDF" button.

---

## 15. Cash book per site flow

### Purpose
Generate a printable chronological cash book (Indian traditional ledger format) for a single site with running balance.

### Steps
1. On site detail → **Finance** tab, "Print Cash Book" button opens `/admin/sites/[id]/cashbook/print` in new tab.
2. Print page fetches site + all transactions via existing `GET /api/finance`, filters to current site, sorts by date, and computes running balance client-side.
3. Top sticky toolbar (hidden on print): From/To date pickers, Opening Balance ₹ input, Print, WhatsApp share — all inputs update the ledger live.
4. A4 portrait layout:
   - Header: "CASH BOOK" title, site name + address, period
   - Opening balance row
   - 7-column ledger table: Date, Voucher # (auto `V001`...), Particulars (category + notes), Mode, Receipt (Cr) ₹, Payment (Dr) ₹, Running Balance ₹
   - Footer row with column totals
   - 4 summary cards: Opening, Total Receipts, Total Payments, Closing Balance
   - 3-column signature block (Prepared / Checked / Approved)
5. No new backend endpoint needed — reuses `GET /api/finance` + client-side filtering. Opening balance is an optional input from the user (for re-opening after reconciliation).

### Query params (optional)
`?from=YYYY-MM-DD&to=YYYY-MM-DD&opening=<amount>` — allows deep-linking to a specific period.

---

## 16. Logout flow

### Steps
1. User clicks logout (Topbar or sidebar).
2. `handleLogout()` in `src/utils/handleLogout.ts`:
   - Clears `localStorage` token.
   - Calls `POST /api/auth/logout` (clears HttpOnly cookie on server).
   - `router.push('/login')`.

---

*Last updated: 2026-04-17*
