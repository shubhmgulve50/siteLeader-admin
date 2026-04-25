"use client";

import React, { useState } from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, Tooltip, Typography } from "@mui/material";
import { Translate as TranslateIcon, Check as CheckIcon } from "@mui/icons-material";
import { useLocale, type Locale } from "@/i18n/LocaleProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale, available, t } = useLocale();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <Tooltip title={t("common.language")}>
        <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small">
          <TranslateIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 180, mt: 1 } } }}
      >
        {available.map((l) => (
          <MenuItem
            key={l.code}
            selected={l.code === locale}
            onClick={() => {
              setLocale(l.code as Locale);
              setAnchor(null);
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {l.code === locale && <CheckIcon fontSize="small" color="primary" />}
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontWeight: l.code === locale ? 800 : 500 }}>
              {l.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
