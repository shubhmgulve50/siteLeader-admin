"use client";

import { useRouter } from "next/navigation";
import { Box } from "@mui/material";

interface LogoViewProps {
  clickable?: boolean;
}

export default function LogoView({ clickable = true }: LogoViewProps) {
  const router = useRouter();

  return (
    <Box
      onClick={() => clickable && router.push("/")}
      sx={{
        cursor: clickable ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/site_leader.png"
        alt="logo"
        style={{ width: 140, height: "auto", objectFit: "contain", maxWidth: "100%" }}
      />
    </Box>
  );
}
