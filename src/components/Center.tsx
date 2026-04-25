"use client";

import { ReactNode } from "react";
import { Box, BoxProps } from "@mui/material";

interface CenterProps extends BoxProps {
  children: ReactNode;
  fullScreen?: boolean;
}

const Center = ({
  children,
  fullScreen = false,
  sx,
  ...props
}: CenterProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...(fullScreen && {
          height: "100vh",
          width: "100vw",
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default Center;
