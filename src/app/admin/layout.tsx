"use client";

import { useEffect, useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
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
        <Box sx={{ p: 3, flexGrow: 1, overflow: "auto", height: "100%" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
