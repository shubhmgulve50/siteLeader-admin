"use client";

import toast from "react-hot-toast";
import {
  Fullscreen as FullscreenIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { Box, IconButton, Stack, useTheme } from "@mui/material";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationsBell from "@/components/NotificationsBell";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import LogoView from "@/components/LogoView";

interface TopbarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const Topbar = ({ onMenuClick, isSidebarOpen }: TopbarProps) => {
  const theme = useTheme();
  const pathname = usePathname();
  const isDashboard = pathname === "/admin/dashboard";

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error("Error entering fullscreen", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: { xs: 1.5, sm: 2 },
        py: { xs: 0.75, sm: 1.5 },
        borderBottom: `1px solid ${theme.palette.divider}`,
        width: "100%",
        boxSizing: "border-box",
        minHeight: { xs: 56, sm: 64 },
        position: { xs: "sticky", md: "relative" },
        top: { xs: 0, md: "auto" },
        zIndex: { xs: 1100, md: "auto" },
        bgcolor: "background.paper",
      }}
    >
      {/* Left: hamburger + logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Mobile hamburger — always visible to open drawer */}
        <IconButton
          onClick={onMenuClick}
          size="small"
          sx={{ display: { xs: "flex", md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Mobile logo */}
        <Box sx={{ display: { xs: "flex", md: "none" }, ml: 0.5, maxWidth: { xs: 120, sm: 160 }, overflow: "hidden" }}>
          <LogoView clickable={false} />
        </Box>

        {/* Desktop hamburger — only when sidebar closed */}
        <Box sx={{ display: { xs: "none", md: "flex" }, minWidth: 40 }}>
          {!isSidebarOpen && (
            <IconButton onClick={onMenuClick} size="small">
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Right: action icons */}
      <Stack direction="row" spacing={{ xs: 0.25, sm: 1.5 }} alignItems="center">
        <NotificationsBell />

        {isDashboard && (
          <Box sx={{ display: { xs: "none", sm: "flex" } }}>
            <LanguageSwitcher />
          </Box>
        )}

        <ThemeToggleButton />

        <IconButton
          onClick={toggleFullscreen}
          sx={{
            display: { xs: "none", sm: "flex" },
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
            width: 44,
            height: 44,
          }}
        >
          <FullscreenIcon />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default Topbar;
