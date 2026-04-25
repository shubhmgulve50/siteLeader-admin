import {
  AccountBalanceWalletOutlined,
  BusinessOutlined,
  DashboardOutlined,
  Inventory2Outlined,
  PeopleAltOutlined,
  RequestQuoteOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

export const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  BUILDER: "BUILDER",
  SUPERVISOR: "SUPERVISOR",
  ENGINEER: "ENGINEER",
  WORKER: "WORKER",
};

export const MAIN_MENU_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: DashboardOutlined,
    path: "/admin/dashboard",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
  {
    id: "sites",
    label: "Sites",
    icon: BusinessOutlined,
    path: "/admin/sites",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
  {
    id: "labours",
    label: "Labour",
    icon: PeopleAltOutlined,
    path: "/admin/labours",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
  {
    id: "materials",
    label: "Inventory",
    icon: Inventory2Outlined,
    path: "/admin/materials",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
  {
    id: "finance",
    label: "Finance",
    icon: AccountBalanceWalletOutlined,
    path: "/admin/finance",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
  {
    id: "quotations",
    label: "Quotations",
    icon: RequestQuoteOutlined,
    path: "/admin/quotations",
    roles: ["SUPER_ADMIN", "BUILDER", "SUPERVISOR", "ENGINEER"],
  },
];

export const BOTTOM_MENU_ITEMS = [
  {
    label: "Settings",
    icon: SettingsOutlined,
    path: "/admin/settings",
  },
  {
    label: "Logout",
    icon: LogoutOutlinedIcon,
    path: "/login",
  },
];
