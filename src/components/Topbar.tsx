"use client";

import moment from "moment";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import {
  CalendarMonth as CalendarIcon,
  Fullscreen as FullscreenIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";

interface TopbarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const Topbar = ({ onMenuClick, isSidebarOpen }: TopbarProps) => {
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

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
        gap: 2,
        p: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Left Section: Show Menu Icon ONLY if sidebar is closed */}
      <Box sx={{ minWidth: 40 }}>
        {!isSidebarOpen && (
          <IconButton onClick={onMenuClick}>
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      {/* Right Section: Utilities */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <ThemeToggleButton />

        <IconButton
          onClick={() => toggleFullscreen()}
          sx={{
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
            width: 44,
            height: 44,
          }}
        >
          <FullscreenIcon />
        </IconButton>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ mx: 1, borderColor: "divider", borderWidth: 1 }}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: "primary.main",
            color: "white",
            px: 3,
            py: 1.2,
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(10, 163, 141, 0.2)",
          }}
        >
          <Typography
            noWrap
            sx={{
              fontWeight: 600,
              fontSize: "0.95rem",
              letterSpacing: 0.2,
            }}
          >
            {moment(currentTime).format("ddd, DD MMM YYYY | HH:mm")}
          </Typography>
          <CalendarIcon sx={{ fontSize: 20, opacity: 0.9 }} />
        </Box>
      </Stack>
    </Box>
  );
};

export default Topbar;
