import { Box, SxProps, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function ComponentBackground({
  children,
  sx,
}: {
  children: React.ReactNode;
  sx?: SxProps;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.primary.main, 0.1)
            : alpha(theme.palette.primary.main, 0.05),
        borderRadius: 2.5,
        p: 0.5,
        color: "primary.main",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        display: "flex",
        alignItems: "center",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
