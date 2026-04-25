import React from "react";
import Box, { BoxProps } from "@mui/material/Box";

type GradientBoxProps = BoxProps & {
  rotation?: number;
  children: React.ReactNode;
};

const GradientBox: React.FC<GradientBoxProps> = ({
  rotation = 0,
  children,
  sx,
  ...props
}) => {
  const gradient = `linear-gradient(${rotation}deg, #1a4b46, #3caea3)`;

  return (
    <Box
      sx={{
        background: gradient,
        ...sx, // merge any additional sx styles
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default GradientBox;
