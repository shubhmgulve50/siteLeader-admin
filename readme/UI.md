# UI — siteLeader-admin

## Component inventory

### Layout components

| Component | File | Purpose |
|---|---|---|
| `Sidebar` | `components/Sidebar.tsx` | Gradient sidebar, persistent desktop / temporary mobile drawer, nested nav items. Fetches role → shows `SUPER_ADMIN_MENU_ITEMS` section when `role===SUPER_ADMIN` |
| Super Admin | `app/admin/super-admin/page.tsx` | Builder management: list with status filter tabs, approve/deny/suspend/reinstate/verify-email/permissions/delete actions. Role-gated (SUPER_ADMIN only). |
| `Topbar` | `components/Topbar.tsx` | Sticky on mobile (z-1100). Shows hamburger + logo on xs; fullscreen, language switcher hidden on xs |
| `MobileBottomNav` | `components/MobileBottomNav.tsx` | Fixed bottom nav bar (64px, `display:{xs:block,md:none}`). 4 primary tabs + "More" bottom sheet with remaining routes + logout. Replaces sidebar nav on mobile. |
| Dashboard | `app/admin/dashboard/page.tsx` | 2-col stat cards on mobile, responsive Quick Actions grid, fluid Financial Performance panel |
| Site Detail | `app/admin/sites/[id]/page.tsx` | Mobile-first: compact header (back+name row, chips+actions row), xs:6 KPI grid, horizontally-scrollable quick actions, icon+label tabs with `allowScrollButtonsMobile`, `p:0` outer (layout handles), `InfoCell` helper for key-info bar |
| Admin layout | `app/admin/layout.tsx` | Shell: Sidebar + Topbar + `{children}` + `MobileBottomNav`. Content `pb:{xs:"80px",md:3}` to clear bottom nav. |

### Page-level shared components

| Component | File | Purpose |
|---|---|---|
| `PageHeaderWithActions` | `components/PageHeaderWithActions.tsx` | Page title in `GradientBox` + optional search field + action buttons |
| `GenericTable<T>` | `components/common/GenericTable.tsx` | Type-safe MUI table: custom column renderers, pagination, loading skeleton. Pass `mobileCard` to switch to stacked card layout on xs/sm screens. Column flags: `isPrimaryOnMobile`, `isActionColumn`, `hiddenOnMobile`, `mobileLabel` |
| `GradientBox` | `components/GradientBox.tsx` | Reusable `Box` with orange-to-amber brand gradient (`#FF6B1A → #EF9F27`) |
| `ConfirmDialog` | `components/ConfirmDialog.tsx` | MUI Dialog for destructive action confirmation |
| `TableSkeleton` | `components/TableSkeleton.tsx` | Animated skeleton rows while data loads |
| `Loader` | `components/Loader.tsx` | Full-screen loading overlay driven by Zustand `useLoader` |
| `PageLoader` | `components/PageLoader.tsx` | Page-level skeleton / spinner |

### Form components

| Component | File | Purpose |
|---|---|---|
| `LoginForm` | `components/LoginForm.tsx` | Email + password with RHF + Zod, submit calls auth endpoint |
| `PasswordField` | `components/PasswordField.tsx` | MUI TextField with show/hide toggle |
| `ChangePassword` | `components/settings/ChangePassword.tsx` | Current + new + confirm password form |

### Feature tab components

| Component | File | Purpose |
|---|---|---|
| `LabourTab` | `components/sites/LabourTab.tsx` | Labour assignment + daily attendance for a site |
| `MaterialTab` | `components/sites/MaterialTab.tsx` | Material usage logs for a site |
| `FinanceTab` | `components/sites/FinanceTab.tsx` | Site-specific income/expense summary |
| `LogsTab` | `components/sites/LogsTab.tsx` | Daily progress reports for a site |

### Utility components

| Component | File | Purpose |
|---|---|---|
| `LogoView` | `components/LogoView.tsx` | Clickable or static logo image |
| `Center` | `components/Center.tsx` | Flex centering wrapper |
| `ThemeToggleButton` | `components/ThemeToggleButton.tsx` | MUI `useColorScheme` toggle |
| `CustomBreadcrumbs` | `components/CustomBreadcrumbs.tsx` | MUI Breadcrumbs for nested routes |

---

## Naming conventions

- **Component files**: PascalCase (`GenericTable.tsx`, `LabourTab.tsx`).
- **Utility files**: camelCase (`handleLogout.ts`, `utils.ts`).
- **Page files**: `page.tsx` inside feature directory.
- Feature tabs: suffix `Tab` (e.g. `LabourTab`, `MaterialTab`).
- Dialog open state: `const [open, setOpen] = useState(false)` — one `open` flag per dialog.
- Loading state: `dialogLoading` for dialog submission, `loading` for page/table fetch.

---

## Layout patterns

### Sidebar + Topbar shell
```
admin/layout.tsx
  MUI Box (display: flex)
  ├── Sidebar (persistent / temporary based on breakpoint)
  └── Box (flex: 1, overflow-x: hidden)
      ├── Topbar
      └── Box (p: { xs: 2, sm: 3 }, mt: 8 for topbar height)
          └── {children}
```

### Page structure pattern
```
"use client"
export default function FeaturePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);       // dialog
  const [selected, setSelected] = useState(null); // for edit
  const [form, setForm] = useState({});

  useEffect(() => { fetchData(); }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions title="..." onAdd={() => setOpen(true)} />
      <GenericTable columns={columns} data={data} loading={loading} />
      <Dialog open={open} ...>
        {/* form content */}
      </Dialog>
      <ConfirmDialog ... />
    </Box>
  );
}
```

### GenericTable column definition
```typescript
const columns: Column<T>[] = [
  { id: 'name', label: 'Name' },
  { id: 'status', label: 'Status', render: (row) => <Chip label={row.status} /> },
  { id: 'actions', label: 'Actions', align: 'center', render: (row) => <IconButton>...</IconButton> },
];
```

---

## Responsive design

| Breakpoint | Sidebar | Grid | Typography |
|---|---|---|---|
| `xs` (0px+) | Drawer (temporary) | 12 cols | `fontSize: '1rem'` |
| `sm` (600px+) | Drawer | 6 cols | `fontSize: '1.1rem'` |
| `md` (900px+) | Persistent | 4 cols | `fontSize: '1.25rem'` |

Custom MUI breakpoints `bp300`–`bp1000` are defined in `theme.ts` for fine-grained responsive control.

### Mobile-specific patterns

- **GenericTable `mobileCard` mode**: pass `mobileCard` prop → stacked card layout on xs/sm, normal table on md+. Column flags: `isPrimaryOnMobile` (card title), `isActionColumn` (card footer), `hiddenOnMobile`, `mobileLabel`.
- **Floating Action Button (FAB)**: every CRUD page renders a `<Fab color="primary">` fixed at `bottom: 24, right: 24` when `isMobile && canManage`. Replaces the header button on small screens.
- **Full-screen dialogs**: complex forms use `fullScreen={isMobile}` + `borderRadius: isMobile ? 0 : 4`.
- **Dashboard stat cards**: `xs: 6` (2-per-row) not `xs: 12`.
- **Topbar fullscreen toggle**: `display: { xs: "none", sm: "flex" }` — hidden on mobile.
- **WhatsApp share**: use `shareOnWhatsApp()` from `utils/share.ts`. Icon colour must use `WA_GREEN` token from `tokens.ts` — never hardcode `#25D366`.

### Header button pattern

All action buttons placed inside `PageHeaderWithActions` must use tokens:

```tsx
// Primary action (labelled button)
<Button sx={HEADER_BTN_SX}>Add X</Button>

// Icon-only action
<IconButton sx={HEADER_ICON_BTN_SX}><SomeIcon /></IconButton>
```

Import from `@/styles/tokens`.

### Client-side search

All pages with `PageHeaderWithActions` wire `handleSearch` to a local `searchQuery` state and filter the `data` prop of `GenericTable` inline. No server round-trips for search.

---

*Last updated: 2026-04-22*
