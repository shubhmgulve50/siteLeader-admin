"use client";

import { useLayoutEffect, useState } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useLayoutEffect(() => {
    const mql = window.matchMedia(
      `(min-width:${theme.breakpoints.values.md}px)`
    );
    setSidebarOpen(mql.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme.breakpoints.values.md]);

  const handleSidebarToggle = () => setSidebarOpen((prev) => !prev);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", overflow: "hidden", width: "100%" }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        width={280}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${sidebarOpen ? "280px" : "0px"})` },
          transition: "width 0.3s ease",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          ml: 0,
        }}
      >
        <Topbar onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
        <Box
          sx={{
            p: { xs: 1, sm: 3 },
            pb: { xs: "72px", md: 3 },
            flexGrow: 1,
            overflow: "auto",
            minHeight: 0,
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile bottom navigation — hidden on md+ */}
      <MobileBottomNav />
    </Box>
  );
}
