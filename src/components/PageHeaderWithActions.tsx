"use client";

import React, { useState } from "react";
import { Close, Delete, Refresh, Search } from "@mui/icons-material";
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && handleSearch) {
      handleSearch(searchQuery);
    }
  };

  return (
    <GradientBox
      rotation={90}
      sx={{
        color: "white",
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        flexWrap: { xs: "wrap", md: "nowrap" },
        gap: { xs: 1, md: 2 },
        mb: 3,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1 }}
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
              fontSize: { xs: 24, md: 28 },
            }}
          >
            {pageIcon}
          </Box>
        )}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.4rem" },
            letterSpacing: -0.5,
            whiteSpace: "nowrap",
          }}
        >
          {pageTitle}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          width: { xs: "100%", md: "auto" },
          justifyContent: "flex-end",
        }}
      >
        {selectedCount > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
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
              <IconButton
                size="small"
                color="inherit"
                onClick={onClearSelection}
              >
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {showSearch && handleSearch && (
          <TextField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            size="small"
            sx={{
              width: { xs: "100%", sm: 250, md: 300 },
              "& .MuiOutlinedInput-root": {
                color: "white",
                bgcolor: alpha("#fff", 0.1),
                "& fieldset": {
                  borderColor: alpha("#fff", 0.3),
                  borderRadius: 2,
                },
                "&:hover fieldset": {
                  borderColor: alpha("#fff", 0.5),
                },
                "&.Mui-focused fieldset": {
                  borderColor: "white",
                },
              },
              input: {
                "&::placeholder": {
                  color: alpha("#fff", 0.6),
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: alpha("#fff", 0.6) }} fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        )}

        <Box sx={{ display: "flex", gap: 1 }}>
          {actions}
          {onRefreshAction && (
            <Tooltip title="Refresh">
              <IconButton
                color="inherit"
                onClick={onRefreshAction}
                sx={{
                  bgcolor: alpha("#fff", 0.1),
                  "&:hover": { bgcolor: alpha("#fff", 0.2) },
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </GradientBox>
  );
}
