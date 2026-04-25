"use client";

import React from "react";
import { Fab, FabProps, useMediaQuery, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface GlassFabProps extends Omit<FabProps, "sx"> {
  /** Override bottom position (default: 80px to clear bottom nav / page padding) */
  bottom?: number;
  right?: number;
}

/**
 * Glassmorphic FAB matching Exotic mobile style.
 * Auto-visible only on mobile/tablet (≤md).
 */
export default function GlassFab({
  bottom = 80,
  right = 16,
  children,
  color = "primary",
  ...props
}: GlassFabProps) {
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down("md"));

  if (!isMobileOrTablet) return null;

  const isDark = theme.palette.mode === "dark";
  const primaryMain = theme.palette.primary.main;

  return (
    <Fab
      color={color}
      {...props}
      sx={{
        position: "fixed",
        bottom,
        right,
        zIndex: 1300,
        width: 56,
        height: 56,
        boxShadow: isDark
          ? `4px 4px 10px rgba(0,0,0,0.4), -2px -2px 8px ${alpha(primaryMain, 0.3)}`
          : `6px 6px 12px rgba(0,0,0,0.15), -4px -4px 10px ${alpha(primaryMain, 0.25)}, 0 2px 20px ${alpha(primaryMain, 0.3)}`,
        backdropFilter: "blur(8px)",
        transition: "box-shadow 0.25s ease, transform 0.15s ease",
        "&:hover": {
          transform: "scale(1.07)",
          boxShadow: isDark
            ? `6px 6px 16px rgba(0,0,0,0.5), -2px -2px 10px ${alpha(primaryMain, 0.4)}`
            : `8px 8px 16px rgba(0,0,0,0.2), -4px -4px 12px ${alpha(primaryMain, 0.35)}, 0 4px 28px ${alpha(primaryMain, 0.4)}`,
        },
        "&:active": {
          transform: "scale(0.97)",
        },
      }}
    >
      {children}
    </Fab>
  );
}
