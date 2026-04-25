"use client";

import { Poppins } from "next/font/google";
import { createTheme } from "@mui/material/styles";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const primaryMain = "#0AA38D";

const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        mode: "light",
        primary: {
          main: primaryMain,
        },
        secondary: {
          main: "#EF9F27",
          contrastText: "#FFFFFF",
        },
        background: {
          default: "#F4F3F0",
          paper: "#FFFFFF",
        },
        text: {
          primary: "#0C2240",
          secondary: "#5F5E5A",
        },
      },
    },
    dark: {
      palette: {
        mode: "dark",
        primary: {
          main: primaryMain,
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#EF9F27",
          contrastText: "#FFFFFF",
        },
        background: {
          default: "#121212",
          paper: "#1e1e1e",
        },
        text: {
          primary: "#ffffff",
          secondary: "#bbbbbb",
        },
        divider: "rgba(255, 255, 255, 0.12)",
      },
    },
  },
  typography: {
    fontFamily: poppins.style.fontFamily,
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 500 },
    button: { textTransform: "none" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "inherit",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          scrollbarWidth: "thin",
          scrollbarColor: `${primaryMain} transparent`,
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: primaryMain,
            borderRadius: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0, // default
      sm: 600, // default
      md: 900, // default
      lg: 1200, // default
      xl: 1536, // default

      // 🔼 Custom breakpoints
      bp300: 300,
      bp350: 350,
      bp400: 400,
      bp450: 450,
      bp500: 500,
      bp550: 550,
      bp650: 650,
      bp700: 700,
      bp750: 750,
      bp800: 800,
      bp850: 850,
      bp950: 950,
      bp1000: 1000,
    },
  },
});

declare module "@mui/system" {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    // ✅ Add your custom breakpoints here
    bp300: true;
    bp350: true;
    bp400: true;
    bp450: true;
    bp500: true;
    bp550: true;
    bp650: true;
    bp700: true;
    bp750: true;
    bp800: true;
    bp850: true;
    bp950: true;
    bp1000: true;
  }
}
// Export default theme as the light theme
export default theme;
