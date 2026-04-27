"use client";

import Image from "next/image";
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
      <Image
        src="/images/site_leader.png"
        alt="logo"
        width={140}
        height={40}
        priority
        style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
      />
    </Box>
  );
}
