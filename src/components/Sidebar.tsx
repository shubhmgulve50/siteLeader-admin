"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDropDown,
  ArrowDropUp,
  Menu as MenuIcon,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BOTTOM_MENU_ITEMS, MAIN_MENU_ITEMS, SUPER_ADMIN_MENU_ITEMS } from "@/constants/constants";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import handleLogout from "@/utils/handleLogout";
import { useT } from "@/i18n/LocaleProvider";
import BulletIcon from "./BulletIcon";
import { ConfirmDialog } from "./ConfirmDialog";
import GradientBox from "./GradientBox";
import LogoView from "./LogoView";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
}

const Sidebar = ({ isOpen, width, onClose }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isXlDown = useMediaQuery(theme.breakpoints.down("md"));
  const t = useT();
  const labelOf = (item: { labelKey?: string; label: string }) =>
    item.labelKey ? t(item.labelKey) : item.label;

  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [submenuStates, setSubmenuStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirmAction: () => {},
    onCancelAction: () => {},
  });

  useEffect(() => {
    setIsClient(true);
    api.get(apiEndpoints.adminProfile).then((r) => {
      setUserRole(r.data.data.role);
      setUserPermissions(r.data.data.permissions ?? []);
    }).catch(() => {});
  }, []);

  const isActivePath = (path: string) => {
    if (!pathname || !path) return false;
    return pathname === path || pathname.startsWith(path + "/");
  };

  const toggleSubmenu = (menuId: string) => {
    setSubmenuStates((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const sidebarContent = (
    <GradientBox style={{ width, height: "100vh" }}>
      <Box
        sx={{ width, height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Box
            sx={{
              height: "56px",
              display: "flex",
              px: 1.5,
              alignItems: "center",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            <LogoView />
            <IconButton onClick={onClose} sx={{ color: "white", p: 0.5 }}>
              <MenuIcon />
            </IconButton>
          </Box>

          <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }} />

          <Box sx={{ p: 1, color: "white" }}>
            <Box sx={{ p: 0, color: "white" }}>
              {MAIN_MENU_ITEMS.filter((m: any) => {
                if (m.hidden) return false;
                if (userRole === "BUILDER" && m.permissionKey !== null) {
                  return userPermissions.includes(m.permissionKey);
                }
                return true;
              }).map((menuItem: any) => (
                <Box key={menuItem.id}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      paddingX: 2,
                      paddingY: 1,
                      cursor: "pointer",
                      borderRadius: 2,
                      bgcolor: isActivePath(menuItem.path)
                        ? "rgba(255,255,255,0.15)"
                        : "transparent",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                    }}
                    onClick={() => {
                      if (menuItem.hasSubmenu) {
                        toggleSubmenu(menuItem.id);
                      } else if (menuItem.path) {
                        router.push(menuItem.path);
                        if (isXlDown) onClose();
                      }
                    }}
                  >
                    {menuItem.icon && React.createElement(menuItem.icon)}
                    <Typography
                      sx={{
                        fontSize: 15,
                        mx: 2,
                        fontWeight: isActivePath(menuItem.path) ? 700 : 500,
                      }}
                    >
                      {labelOf(menuItem)}
                    </Typography>
                    {menuItem.hasSubmenu &&
                      (submenuStates[menuItem.id] ? (
                        <ArrowDropUp sx={{ color: "white" }} />
                      ) : (
                        <ArrowDropDown sx={{ color: "white" }} />
                      ))}
                  </Box>
                  {menuItem.hasSubmenu && (
                    <Collapse in={submenuStates[menuItem.id]}>
                      <Box sx={{ pl: 6 }}>
                        {menuItem.submenuItems?.map((item: any) => (
                          <Box
                            key={item.label}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              py: 0.5,
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                            onClick={() => {
                              router.push(item.path);
                              if (isXlDown) onClose();
                            }}
                          >
                            <BulletIcon color={item.color} />
                            <Typography
                              className="sidebarSubMenu"
                              sx={{
                                fontSize: 14,
                                ml: 2,
                                fontWeight: isActivePath(item.path) ? 750 : 400,
                                color: isActivePath(item.path)
                                  ? "white"
                                  : "#f1f1f1",
                              }}
                            >
                              {labelOf(item)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Super Admin section — only when role === SUPER_ADMIN */}
          {userRole === "SUPER_ADMIN" && (
            <Box sx={{ px: 3, pb: 1, color: "white" }}>
              <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)", mb: 1 }} />
              <Typography sx={{ fontSize: 11, mb: 0.5, opacity: 0.7, fontWeight: 700, letterSpacing: 1 }}>
                SUPER ADMIN
              </Typography>
              {SUPER_ADMIN_MENU_ITEMS.map((menuItem: any) => (
                <Box
                  key={menuItem.id}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    px: 2,
                    py: 1,
                    cursor: "pointer",
                    borderRadius: 2,
                    bgcolor: isActivePath(menuItem.path) ? "rgba(255,255,255,0.15)" : "transparent",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                  onClick={() => { router.push(menuItem.path); if (isXlDown) onClose(); }}
                >
                  {menuItem.icon && React.createElement(menuItem.icon)}
                  <Typography sx={{ fontSize: 15, mx: 1.5, fontWeight: isActivePath(menuItem.path) ? 700 : 500 }}>
                    {labelOf(menuItem)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            bottom: 0,
            width: "100%",
            color: "white",
            cursor: "pointer",
            p: 2,
            pb: { xs: 10, md: 2 },
            borderTop: "1px solid rgba(255,255,255,0.15)",
            mt: "auto",
          }}
        >
          <Typography
            sx={{ fontSize: 13, mb: 1, opacity: 0.7, px: 2, fontWeight: 700 }}
          >
            OTHERS
          </Typography>
          {BOTTOM_MENU_ITEMS.map((item: any) => (
            <Box
              key={item.label}
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                paddingX: 2,
                paddingY: 1,
                borderRadius: 2,
                bgcolor: isActivePath(item.path)
                  ? "rgba(255,255,255,0.15)"
                  : "transparent",
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              }}
              onClick={async () => {
                if (item.labelKey === "menu.logout" || item.label === "Logout") {
                  setConfirmDialog({
                    open: true,
                    title: "Logout",
                    message: "Are you sure you want to logout?",
                    onConfirmAction: async () => {
                      await handleLogout(router, setLoading);
                      setConfirmDialog({ ...confirmDialog, open: false });
                    },
                    onCancelAction: () =>
                      setConfirmDialog({ ...confirmDialog, open: false }),
                  });
                } else if (item.path) {
                  router.push(item.path);
                }
              }}
            >
              {item.icon && React.createElement(item.icon)}
              <Typography
                sx={{
                  fontSize: 15,
                  mx: 2,
                  fontWeight: isActivePath(item.path) ? 700 : 500,
                }}
              >
                {labelOf(item)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirmAction={confirmDialog.onConfirmAction}
        onCancelAction={confirmDialog.onCancelAction}
        loading={loading}
      />
    </GradientBox>
  );

  if (!isClient) return null;

  if (isXlDown) {
    return (
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={onClose}
        variant="temporary"
        slotProps={{
          paper: { sx: { width, boxSizing: "border-box", border: "none" } },
        }}
        ModalProps={{ disableEnforceFocus: true }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Box
      component="nav"
      sx={{
        width: isOpen ? width : 0,
        flexShrink: 0,
        transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        position: "relative",
        zIndex: 1200,
      }}
    >
      {sidebarContent}
    </Box>
  );
};

export default Sidebar;
