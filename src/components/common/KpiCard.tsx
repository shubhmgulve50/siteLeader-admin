"use client";

import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  /** Accent color (hex or MUI token) — drives both tint + icon colour */
  color?: string;
  /** Full-colour filled variant (white text) — for primary KPIs */
  variant?: "default" | "filled" | "soft";
  onClick?: () => void;
  compact?: boolean;
}

/**
 * Unified KPI/stat card used across Dashboard, Site Detail, Vendors, Equipment, etc.
 * Keeps visual rhythm consistent — always `borderRadius: 3`, uniform padding + typography.
 */
export default function KpiCard({
  label,
  value,
  sub,
  icon,
  color = "#FF6B1A",
  variant = "soft",
  onClick,
  compact = false,
}: KpiCardProps) {
  const pad = compact ? 1 : 1.5;
  const valueVariant = compact ? "subtitle1" : "h5";

  if (variant === "filled") {
    return (
      <Paper
        elevation={0}
        onClick={onClick}
        sx={{
          p: pad,
          borderRadius: 3,
          bgcolor: color,
          color: "white",
          cursor: onClick ? "pointer" : "default",
          transition: "transform 0.15s",
          "&:hover": onClick ? { transform: "translateY(-2px)" } : {},
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.2)",
                display: "flex",
                color: "inherit",
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", opacity: 0.9 }}>
              {label}
            </Typography>
            <Typography variant={valueVariant} sx={{ fontWeight: 900, lineHeight: 1.1 }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {sub}
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>
    );
  }

  if (variant === "default") {
    return (
      <Paper
        elevation={0}
        onClick={onClick}
        sx={{
          p: pad,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "grey.200",
          bgcolor: "background.paper",
          cursor: onClick ? "pointer" : "default",
          transition: "transform 0.15s, box-shadow 0.15s",
          "&:hover": onClick ? { transform: "translateY(-2px)", boxShadow: 2 } : {},
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(color, 0.1),
                color,
                display: "flex",
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {label}
            </Typography>
            <Typography variant={valueVariant} sx={{ fontWeight: 900, lineHeight: 1.1 }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary">
                {sub}
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>
    );
  }

  // soft (default) — tinted background with coloured border, most visually distinctive
  if (compact) {
    return (
      <Paper
        elevation={0}
        onClick={onClick}
        sx={{
          p: 1.25,
          borderRadius: 3,
          border: "1px solid",
          borderColor: alpha(color, 0.25),
          bgcolor: alpha(color, 0.06),
          cursor: onClick ? "pointer" : "default",
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.6rem",
            fontWeight: 800,
            textTransform: "uppercase",
            color,
            letterSpacing: 0.5,
            lineHeight: 1.2,
            mb: 0.25,
            display: "block",
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{ fontSize: "1.05rem", fontWeight: 900, color, lineHeight: 1.2 }}
        >
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
            {sub}
          </Typography>
        )}
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: pad,
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(color, 0.25),
        bgcolor: alpha(color, 0.06),
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.15s",
        "&:hover": onClick ? { transform: "translateY(-2px)" } : {},
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        {icon && (
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(color, 0.15),
              color,
              display: "flex",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, textTransform: "uppercase", color, letterSpacing: 0.3 }}
          >
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, color, lineHeight: 1.1 }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
              {sub}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
