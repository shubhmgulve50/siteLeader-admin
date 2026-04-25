"use client";

import { CircularProgress, LinearProgress } from "@mui/material";

interface ProgressIndicatorProps {
  type?: "linear" | "circular";
  size?: number;
}

const ProgressIndicator = ({
  type = "circular",
  size = 25,
}: ProgressIndicatorProps) => {
  return type === "circular" ? (
    <CircularProgress size={size} />
  ) : (
    <LinearProgress />
  );
};

export default ProgressIndicator;
