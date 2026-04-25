"use client";

import React, { useState } from "react";
import { Close, Delete, Refresh, Search } from "@mui/icons-material";
import {
  Box,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import GradientBox from "./GradientBox";

interface Props {
  pageIcon?: React.ReactNode;
  pageTitle: string;
  handleSearch?: (value: string) => void;
  selectedCount?: number;
  onClearSelection?: () => void;
  actions?: React.ReactNode[];
  onRefreshAction?: () => void;
  onActionClicked?: (action: string, selectedIds: string[]) => void;
  placeholder?: string;
  showSearch?: boolean;
}

export default function PageHeaderWithActions({
  pageIcon,
  pageTitle,
  handleSearch,
  selectedCount = 0,
  onClearSelection,
  actions = [],
  onRefreshAction,
  onActionClicked = () => {},
  placeholder = "Search...",
  showSearch = true,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && handleSearch) {
      handleSearch(searchQuery);
    }
  };

  const searchField = (
    <TextField
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      size="small"
      fullWidth={isMobile}
      sx={
        isMobile
          ? {
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: (t) =>
                  t.palette.mode === "dark"
                    ? alpha(t.palette.background.paper, 0.8)
                    : "#fff",
              },
            }
          : {
              width: { sm: 250, md: 300 },
              "& .MuiOutlinedInput-root": {
                color: "white",
                bgcolor: alpha("#fff", 0.1),
                "& fieldset": {
                  borderColor: alpha("#fff", 0.3),
                  borderRadius: 2,
                },
                "&:hover fieldset": { borderColor: alpha("#fff", 0.5) },
                "&.Mui-focused fieldset": { borderColor: "white" },
              },
              input: {
                "&::placeholder": { color: alpha("#fff", 0.6), opacity: 1 },
              },
            }
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search
              sx={{ color: isMobile ? "text.secondary" : alpha("#fff", 0.6) }}
              fontSize="small"
            />
          </InputAdornment>
        ),
      }}
    />
  );

  return (
    <Box sx={{ mb: 3 }}>
      <GradientBox
        rotation={90}
        sx={{
          color: "white",
          px: { xs: 1.5, sm: 3 },
          py: { xs: 1, sm: 2 },
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          flexWrap: "nowrap",
          gap: { xs: 1, md: 2 },
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {/* Title area */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1, minWidth: 0 }}
        >
          {pageIcon && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha("#fff", 0.2),
                p: 1,
                borderRadius: 1.5,
                fontSize: { xs: 22, md: 28 },
                flexShrink: 0,
              }}
            >
              {pageIcon}
            </Box>
          )}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1rem", sm: "1.2rem", md: "1.4rem" },
              letterSpacing: -0.5,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {pageTitle}
          </Typography>
        </Box>

        {/* Right side: on desktop show search + actions; on mobile show only actions + refresh */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
          }}
        >
          {selectedCount > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                bgcolor: alpha("#fff", 0.1),
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selectedCount} selected
              </Typography>
              <Tooltip title="Delete selected">
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => onActionClicked("delete", [])}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear selection">
                <IconButton size="small" color="inherit" onClick={onClearSelection}>
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Desktop search inside header */}
          {!isMobile && showSearch && handleSearch && searchField}

          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: 0.75 }}>
            {actions}
            {onRefreshAction && (
              <Tooltip title="Refresh">
                <IconButton
                  color="inherit"
                  onClick={onRefreshAction}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    bgcolor: alpha("#fff", 0.1),
                    "&:hover": { bgcolor: alpha("#fff", 0.2) },
                  }}
                >
                  <Refresh fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </GradientBox>

      {/* Mobile search bar below header */}
      {isMobile && showSearch && handleSearch && (
        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            px: 1.5,
            py: 1,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {searchField}
        </Paper>
      )}
    </Box>
  );
}
