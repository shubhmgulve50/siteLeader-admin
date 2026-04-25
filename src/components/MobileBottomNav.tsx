"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AccountBalanceWalletOutlined,
  AdminPanelSettingsOutlined,
  BusinessOutlined,
  DashboardOutlined,
  MoreHorizOutlined,
  PeopleAltOutlined,
  SettingsOutlined,
  AssessmentOutlined,
  Inventory2Outlined,
  ReceiptLongOutlined,
  HistoryOutlined,
  LogoutOutlined,
} from "@mui/icons-material";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import { useT } from "@/i18n/LocaleProvider";
import { ConfirmDialog } from "./ConfirmDialog";
import handleLogout from "@/utils/handleLogout";
import api from "@/lib/axios";
import apiEndpoints from "@/constants/apiEndpoints";

const PRIMARY_NAV = [
  { id: "dashboard", labelKey: "menu.dashboard", label: "Dashboard", icon: DashboardOutlined, path: "/admin/dashboard" },
  { id: "sites",     labelKey: "menu.sites",      label: "Sites",     icon: BusinessOutlined,             path: "/admin/sites" },
  { id: "labours",   labelKey: "menu.labour",     label: "Labour",    icon: PeopleAltOutlined,            path: "/admin/labours" },
  { id: "finance",   labelKey: "menu.finance",    label: "Finance",   icon: AccountBalanceWalletOutlined, path: "/admin/finance" },
];

const MORE_NAV = [
  { id: "materials",  labelKey: "menu.inventory",  label: "Inventory",  icon: Inventory2Outlined,   path: "/admin/materials" },
  { id: "quotations", labelKey: "menu.quotations", label: "Quotations", icon: ReceiptLongOutlined,  path: "/admin/quotations" },
  { id: "invoices",   labelKey: "menu.invoices",   label: "Invoices",   icon: ReceiptLongOutlined,  path: "/admin/invoices" },
  { id: "reports",    labelKey: "menu.reports",    label: "Reports",    icon: AssessmentOutlined,   path: "/admin/reports" },
  { id: "audit-log",  labelKey: "menu.auditLog",   label: "Audit Log",  icon: HistoryOutlined,      path: "/admin/audit-log" },
  { id: "settings",   labelKey: "menu.settings",   label: "Settings",   icon: SettingsOutlined,     path: "/admin/settings" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const t = useT();
  const [moreOpen, setMoreOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    api.get(apiEndpoints.adminProfile).then((r) => setUserRole(r.data.data.role)).catch(() => {});
  }, []);

  const labelOf = (item: { labelKey: string; label: string }) => {
    try { return t(item.labelKey); } catch { return item.label; }
  };

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const activeIndex = PRIMARY_NAV.findIndex((item) => isActive(item.path));
  const currentValue = activeIndex >= 0 ? activeIndex : (moreOpen ? 4 : -1);

  const handleNav = (path: string) => {
    setMoreOpen(false);
    router.push(path);
  };

  return (
    <>
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          borderTop: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          display: { xs: "block", md: "none" },
          backdropFilter: "blur(8px)",
          bgcolor: alpha(theme.palette.background.paper, 0.95),
        }}
      >
        <BottomNavigation
          value={currentValue}
          sx={{
            bgcolor: "transparent",
            height: 64,
            "& .MuiBottomNavigationAction-root": {
              minWidth: 0,
              px: 0.5,
              color: theme.palette.text.secondary,
              transition: "color 0.2s",
              "&.Mui-selected": {
                color: theme.palette.primary.main,
              },
            },
            "& .MuiBottomNavigationAction-label": {
              fontSize: "0.625rem",
              fontWeight: 500,
              "&.Mui-selected": { fontWeight: 700, fontSize: "0.625rem" },
            },
          }}
        >
          {PRIMARY_NAV.map((item, idx) => (
            <BottomNavigationAction
              key={item.id}
              label={labelOf(item)}
              icon={
                <item.icon
                  sx={{
                    fontSize: 22,
                    transform: isActive(item.path) ? "scale(1.15)" : "scale(1)",
                    transition: "transform 0.2s",
                  }}
                />
              }
              onClick={() => handleNav(item.path)}
            />
          ))}
          <BottomNavigationAction
            label="More"
            icon={
              <MoreHorizOutlined
                sx={{
                  fontSize: 22,
                  transform: moreOpen ? "scale(1.15)" : "scale(1)",
                  transition: "transform 0.2s",
                  color: moreOpen ? theme.palette.primary.main : undefined,
                }}
              />
            }
            onClick={() => setMoreOpen(true)}
            sx={{ color: moreOpen ? `${theme.palette.primary.main} !important` : undefined }}
          />
        </BottomNavigation>
      </Paper>

      {/* "More" Sheet */}
      <Drawer
        anchor="bottom"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        sx={{ display: { xs: "block", md: "none" }, zIndex: 1400 }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px 16px 0 0",
              maxHeight: "75vh",
              pb: "env(safe-area-inset-bottom, 16px)",
            },
          },
        }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: "divider",
              mx: "auto",
              mb: 1.5,
            }}
          />
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, letterSpacing: 0.5, color: "text.secondary", px: 1 }}
          >
            MORE OPTIONS
          </Typography>
        </Box>

        <List dense sx={{ px: 1, pb: 1 }}>
          {MORE_NAV.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => handleNav(item.path)}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                  "& .MuiListItemIcon-root": { color: theme.palette.primary.main },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <item.icon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary={labelOf(item)}
                primaryTypographyProps={{ fontWeight: isActive(item.path) ? 700 : 500, fontSize: "0.9rem" }}
              />
            </ListItemButton>
          ))}

          {userRole === "SUPER_ADMIN" && (
            <ListItemButton
              onClick={() => handleNav("/admin/super-admin")}
              selected={isActive("/admin/super-admin")}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                  "& .MuiListItemIcon-root": { color: theme.palette.primary.main },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <AdminPanelSettingsOutlined sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Super Admin"
                primaryTypographyProps={{ fontWeight: isActive("/admin/super-admin") ? 700 : 500, fontSize: "0.9rem" }}
              />
            </ListItemButton>
          )}

          <Divider sx={{ my: 1 }} />

          <ListItemButton
            onClick={() => { setMoreOpen(false); setConfirmOpen(true); }}
            sx={{ borderRadius: 2, color: "error.main", "& .MuiListItemIcon-root": { color: "error.main" } }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutOutlined sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }}
            />
          </ListItemButton>
        </List>
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        title="Logout"
        message="Are you sure you want to logout?"
        loading={loading}
        onConfirmAction={async () => {
          await handleLogout(router, setLoading);
          setConfirmOpen(false);
        }}
        onCancelAction={() => setConfirmOpen(false)}
      />
    </>
  );
}
