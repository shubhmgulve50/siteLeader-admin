# UI — siteLeader-admin

## Component inventory

### Layout components

| Component | File | Purpose |
|---|---|---|
| `Sidebar` | `components/Sidebar.tsx` | Gradient sidebar, persistent desktop / temporary mobile drawer, nested nav items |
| `Topbar` | `components/Topbar.tsx` | Header: live clock, fullscreen toggle, theme toggle button |
| Admin layout | `app/admin/layout.tsx` | Shell that wraps Sidebar + Topbar + `{children}` |

### Page-level shared components

| Component | File | Purpose |
|---|---|---|
| `PageHeaderWithActions` | `components/PageHeaderWithActions.tsx` | Page title in `GradientBox` + optional search field + action buttons |
| `GenericTable<T>` | `components/common/GenericTable.tsx` | Type-safe MUI table: custom column renderers, pagination, loading skeleton |
| `GradientBox` | `components/GradientBox.tsx` | Reusable `Box` with teal-to-transparent gradient background |
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

---

*Last updated: 2026-04-17*
