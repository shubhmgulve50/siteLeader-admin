"use client";

import React from "react";
import { Chip, ChipProps } from "@mui/material";
import { COLORS } from "@/styles/tokens";
import { useT } from "@/i18n/LocaleProvider";

type Domain = "site" | "quotation" | "payment" | "milestone" | "priority";

interface StatusChipProps extends Omit<ChipProps, "color" | "label"> {
  status: string;
  domain?: Domain;
  /** Override domain-lookup color */
  color?: ChipProps["color"];
  /** Skip i18n translation (show raw value) */
  raw?: boolean;
}

/**
 * Unified status chip — drives colour from shared COLORS mapping and
 * translates label through `status.*` i18n keys.
 * Use everywhere instead of inline Chip + hard-coded status→color logic.
 */
export default function StatusChip({
  status,
  domain = "site",
  color,
  raw = false,
  size = "small",
  sx,
  ...rest
}: StatusChipProps) {
  const t = useT();
  const map = COLORS[domain] as Record<string, ChipProps["color"]>;
  const resolvedColor = color ?? map[status] ?? "default";
  const label = raw ? status : t(`status.${status}`);

  return (
    <Chip
      label={label}
      color={resolvedColor}
      size={size}
      sx={{ fontWeight: 700, ...sx }}
      {...rest}
    />
  );
}
