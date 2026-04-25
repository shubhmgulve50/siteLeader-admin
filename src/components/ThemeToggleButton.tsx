import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import { Box, IconButton, Tooltip, useColorScheme } from "@mui/material";

export const ThemeToggleButton = () => {
  const { mode, setMode } = useColorScheme();

  const handleToggle = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
  };

  if (!mode) return null;

  return (
    <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
      <IconButton
        onClick={handleToggle}
        sx={{
          bgcolor: "primary.main",
          color: "white",
          "&:hover": {
            bgcolor: "primary.dark",
          },
          width: 44,
          height: 44,
          transition: "all 0.3s ease",
        }}
      >
        <Box
          sx={{
            display: "flex",
            animation: "rotate 0.5s ease-in-out",
            "@keyframes rotate": {
              "0%": { transform: "rotate(0deg) scale(0.8)", opacity: 0 },
              "100%": { transform: "rotate(360deg) scale(1)", opacity: 1 },
            },
          }}
        >
          {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
        </Box>
      </IconButton>
    </Tooltip>
  );
};
