import {
  AccountBalanceWalletOutlined,
  AgricultureOutlined,
  AssessmentOutlined,
  BusinessOutlined,
  DashboardOutlined,
  DescriptionOutlined,
  HistoryOutlined,
  Inventory2Outlined,
  PeopleAltOutlined,
  ReceiptLongOutlined,
  RequestQuoteOutlined,
  SettingsOutlined,
  StoreOutlined,
  AdminPanelSettingsOutlined,
} from "@mui/icons-material";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

export const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  BUILDER: "BUILDER",
  SUPERVISOR: "SUPERVISOR",
  ENGINEER: "ENGINEER",
  WORKER: "WORKER",
};

// MAIN_MENU_ITEMS — V1 release focused on Tier 1 (daily-use) features.
// `hidden: true` keeps the route accessible but hides from sidebar.
// Flip to false to enable per-tenant later (or move to a feature-flag model).
export const MAIN_MENU_ITEMS = [
  // === Tier 1 — daily use ===
  {
    id: "dashboard",
    label: "Dashboard",
    labelKey: "menu.dashboard",
    icon: DashboardOutlined,
    path: "/admin/dashboard",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
  {
    id: "sites",
    label: "Sites",
    labelKey: "menu.sites",
    icon: BusinessOutlined,
    path: "/admin/sites",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
  {
    id: "labours",
    label: "Labour",
    labelKey: "menu.labour",
    icon: PeopleAltOutlined,
    path: "/admin/labours",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
  {
    id: "materials",
    label: "Inventory",
    labelKey: "menu.inventory",
    icon: Inventory2Outlined,
    path: "/admin/materials",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
  {
    id: "finance",
    label: "Finance",
    labelKey: "menu.finance",
    icon: AccountBalanceWalletOutlined,
    path: "/admin/finance",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
  {
    id: "quotations",
    label: "Quotations",
    labelKey: "menu.quotations",
    icon: RequestQuoteOutlined,
    path: "/admin/quotations",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
  {
    id: "invoices",
    label: "Invoices",
    labelKey: "menu.invoices",
    icon: ReceiptLongOutlined,
    path: "/admin/invoices",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR"],
  },
  {
    id: "reports",
    label: "Reports",
    labelKey: "menu.reports",
    icon: AssessmentOutlined,
    path: "/admin/reports",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR"],
  },

  // === Tier 3 — hidden for V1 release. Routes still work via URL. ===
  {
    id: "ra-bills",
    label: "RA Bills",
    labelKey: "menu.raBills",
    icon: DescriptionOutlined,
    path: "/admin/ra-bills",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
    hidden: true,
  },
  {
    id: "vendors",
    label: "Vendors",
    labelKey: "menu.vendors",
    icon: StoreOutlined,
    path: "/admin/vendors",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR"],
    hidden: true,
  },
  {
    id: "equipment",
    label: "Equipment",
    labelKey: "menu.equipment",
    icon: AgricultureOutlined,
    path: "/admin/equipment",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
    hidden: true,
  },
  {
    id: "audit-log",
    label: "Audit Log",
    labelKey: "menu.auditLog",
    icon: HistoryOutlined,
    path: "/admin/audit-log",
    roles: ["SUPER_ADMIN", "BUILDER"],
    hidden: true,
  },
];

export const SUPER_ADMIN_MENU_ITEMS = [
  {
    id: "super-admin",
    label: "Super Admin",
    labelKey: "menu.superAdmin",
    icon: AdminPanelSettingsOutlined,
    path: "/admin/super-admin",
    roles: ["SUPER_ADMIN"],
    hidden: false,
  },
];

export const BOTTOM_MENU_ITEMS = [
  {
    label: "Settings",
    labelKey: "menu.settings",
    icon: SettingsOutlined,
    path: "/admin/settings",
  },
  {
    label: "Logout",
    labelKey: "menu.logout",
    icon: LogoutOutlinedIcon,
    path: "/login",
  },
];
