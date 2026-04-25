# Next.js project structure — siteLeader-admin

```
siteLeader-admin/
├── CLAUDE.md                          # Root intelligence hub — lists all README paths
├── AGENTS.md                          # Agent registry and deployment info
├── PROJECT_STRUCTURE.md               # This file
├── .claudeignore                      # Same as .gitignore (kept in sync)
├── .claude/
│   ├── RULES.md                       # Standing instructions (always read first)
│   └── skills/
│       ├── new-feature.md
│       ├── pr-workflow.md
│       ├── readme-sync.md
│       ├── code-review.md
│       └── ticket.md
├── readme/                            # Central documentation hub
│   ├── ARCHITECTURE.md
│   ├── FLOWS.md
│   ├── UI.md
│   ├── THEMING.md
│   ├── METHODS.md
│   ├── AUTH_AND_ROUTING.md
│   ├── STATE_MANAGEMENT.md
│   └── API_INTEGRATION.md
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout: ThemeRegistry + Toaster
│   │   ├── page.tsx                   # Root: redirects to /admin/settings
│   │   ├── globals.css                # Global styles
│   │   ├── not-found.tsx              # 404 page
│   │   ├── loading.tsx                # Root loading skeleton
│   │   ├── icon.png                   # Favicon
│   │   ├── schemas/
│   │   │   └── advisorSchema.ts       # Zod validation schemas
│   │   ├── login/
│   │   │   └── page.tsx               # Public login page
│   │   └── admin/                     # Protected /admin/* routes
│   │       ├── layout.tsx             # Admin shell: Sidebar + Topbar
│   │       ├── dashboard/
│   │       │   └── page.tsx           # KPI cards, revenue & labour overview
│   │       ├── sites/
│   │       │   ├── page.tsx           # Site list with CRUD
│   │       │   └── [id]/
│   │       │       └── page.tsx       # Site detail: 5-tab interface
│   │       ├── labours/
│   │       │   └── page.tsx           # Labour master & wage management
│   │       ├── materials/
│   │       │   └── page.tsx           # Inventory: live stock + catalog + logs
│   │       ├── finance/
│   │       │   └── page.tsx           # Income/expense transactions
│   │       ├── quotations/
│   │       │   └── page.tsx           # BOQ quotation builder
│   │       └── settings/
│   │           └── page.tsx           # User settings: password change
│   ├── components/                    # Reusable React components
│   │   ├── Sidebar.tsx               # Gradient sidebar with nested navigation
│   │   ├── Topbar.tsx                # Header: clock, fullscreen, theme toggle
│   │   ├── LoginForm.tsx             # Login form with Zod + RHF validation
│   │   ├── PageHeaderWithActions.tsx # Page title + search + action buttons
│   │   ├── GradientBox.tsx           # Reusable gradient container
│   │   ├── LogoView.tsx              # Clickable/static logo
│   │   ├── Center.tsx                # Centering utility wrapper
│   │   ├── Loader.tsx                # Global loading overlay (Zustand-driven)
│   │   ├── PageLoader.tsx            # Page-level loading state
│   │   ├── ConfirmDialog.tsx         # Reusable confirmation dialog
│   │   ├── ThemeToggleButton.tsx     # Light/dark mode switcher
│   │   ├── CustomBreadcrumbs.tsx    # Breadcrumb navigation
│   │   ├── PasswordField.tsx         # Masked password input
│   │   ├── TableSkeleton.tsx         # Loading skeleton for tables
│   │   ├── common/
│   │   │   └── GenericTable.tsx      # Type-safe data table with pagination
│   │   ├── sites/
│   │   │   ├── LabourTab.tsx         # Labour assignment & attendance
│   │   │   ├── MaterialTab.tsx       # Material usage logs
│   │   │   ├── FinanceTab.tsx        # Site-specific finance summary
│   │   │   └── LogsTab.tsx           # Daily logs & progress tracking
│   │   └── settings/
│   │       └── ChangePassword.tsx    # Password change form
│   ├── constants/
│   │   ├── apiEndpoints.ts           # Centralized API endpoint constants
│   │   └── constants.ts              # Roles, menu items, enums (ROLE, MAIN_MENU_ITEMS)
│   ├── lib/
│   │   └── axios.ts                  # Axios instance + request/response interceptors
│   ├── providers/
│   │   └── ThemeRegistry.tsx         # MUI theme + emotion cache SSR setup
│   ├── theme.ts                      # MUI colorSchemes config (light/dark)
│   ├── types/
│   │   ├── user.ts                   # User interface definitions
│   │   └── advisor.ts                # Advisor/Worker data types
│   ├── utils/
│   │   ├── utils.ts                  # sortObject, compareJSONObject helpers
│   │   └── handleLogout.ts           # Token cleanup + redirect
│   └── middleware.ts                 # JWT verification + route protection
├── public/
│   └── images/                       # Static assets (logo, icons)
├── .env                              # Environment variables (gitignored)
├── next.config.ts                    # Next.js config: image remote domains
├── next-env.d.ts                     # Next.js TypeScript declarations
├── tsconfig.json                     # TypeScript strict config
├── tsconfig.tsbuildinfo              # TypeScript incremental build cache
├── eslint.config.mjs                 # ESLint flat config
├── package.json                      # Dependencies & scripts
├── package-lock.json
└── README.md
```

## Package conventions

| Concern | Package |
|---|---|
| Date/time | `dayjs` (not yet used; prefer over moment if added) |
| HTTP client | `axios` v1.9.0 |
| Validation | `zod` v3.x |
| Forms | `react-hook-form` v7.58.1 |
| State | `zustand` v5.0.4 |
| Styling | `@mui/material` v7.1.2 + MUI colorSchemes |
| Auth | `jose` v6.0.11 (JWT verification in middleware) |
| Notifications | `react-hot-toast` v2.5.2 |
| Testing | not configured |

## Framework Versions

- Next.js: v15.3.8
- React: v19.2.3
- Node.js: v24.12.0
- npm: v10.9.1

## Default branches

- `main` — production-ready, protected
- `dev` — integration; all feature PRs target this branch
