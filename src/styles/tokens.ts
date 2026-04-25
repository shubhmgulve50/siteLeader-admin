// Design tokens — single source of truth for spacing, radius, shadow
// Import and use these everywhere for visual consistency.

import type { Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

export const RADIUS = {
  pill: 999,
  xs: 1,
  sm: 2,
  md: 3, // default for Paper / Card / Dialog
  lg: 4,
  xl: 6,
} as const;

export const SPACING = {
  section: 3, // mb between major sections
  card: 2.5, // padding inside cards
  cardLg: 3,
  inner: 2, // mb between related elements
  tight: 1,
} as const;

// Unified TableHead styling — adapts to light/dark theme like GenericTable.
// Apply to any native <TableHead> so headers stay consistent across the app.
// Usage: <TableHead sx={TABLE_HEAD_SX}>
export const TABLE_HEAD_SX = {
  bgcolor: (theme: Theme) =>
    theme.palette.mode === "dark"
      ? alpha(theme.palette.background.paper, 0.4)
      : theme.palette.grey[50],
  "& .MuiTableCell-head": {
    fontWeight: 700,
    color: "text.primary",
    borderBottom: (theme: Theme) => `1px solid ${theme.palette.divider}`,
  },
} as const;

export const CARD_SX = {
  // Standard card container — use across KPI cards, list wrappers, dialogs
  elevated: {
    borderRadius: RADIUS.md,
    bgcolor: "background.paper",
    border: "1px solid",
    borderColor: "grey.200",
  },
  // Subtle highlight card (stat / KPI)
  accent: (color: string) => ({
    p: SPACING.card,
    borderRadius: RADIUS.md,
    bgcolor: `${color}10`, // 10% alpha
    border: "1px solid",
    borderColor: `${color}30`,
  }),
} as const;

export const COLORS = {
  // Status colour mapping (use in StatusChip)
  site: {
    "Not Started": "default" as const,
    Ongoing: "warning" as const,
    Completed: "success" as const,
    Planned: "info" as const,
    "On Hold": "error" as const,
  },
  quotation: {
    Draft: "default" as const,
    Sent: "info" as const,
    Approved: "success" as const,
    Rejected: "error" as const,
  },
  payment: {
    UNPAID: "default" as const,
    PARTIAL: "warning" as const,
    PAID: "success" as const,
    OVERDUE: "error" as const,
  },
  milestone: {
    NOT_STARTED: "default" as const,
    IN_PROGRESS: "warning" as const,
    COMPLETED: "success" as const,
    BLOCKED: "error" as const,
  },
  priority: {
    Low: "success" as const,
    Medium: "info" as const,
    High: "error" as const,
  },
} as const;

// Semantic palette — used by KPI cards + summary strips
export const ACCENT = {
  primary: "#FF6B1A",   // brand orange
  secondary: "#EF9F27", // brand amber-yellow
  success: "#16a34a",
  warning: "#f59e0b",
  error: "#dc2626",
  info: "#0891b2",
  purple: "#7c3aed",
  rose: "#e11d48",
  amber: "#b45309",
} as const;

/** WhatsApp brand green — use only for WA share buttons */
export const WA_GREEN = "#25D366" as const;

/** Reusable sx for "Add" buttons placed inside PageHeaderWithActions (white bg on gradient) */
export const HEADER_BTN_SX = {
  borderRadius: 2,
  px: 3,
  bgcolor: "rgba(255,255,255,0.15)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.35)",
  fontWeight: 700,
  "&:hover": { bgcolor: "rgba(255,255,255,0.25)", borderColor: "white" },
} as const;

/** Reusable sx for icon-only buttons inside PageHeaderWithActions */
export const HEADER_ICON_BTN_SX = {
  color: "white",
  border: "1px solid rgba(255,255,255,0.4)",
  borderRadius: 2,
  px: 1.25,
  py: 1,
  "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.12)" },
  "&.Mui-disabled": { color: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.2)" },
} as const;
