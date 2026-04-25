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
        src="/images/site-leader.jpg"
        alt="logo"
        width={180}
        height={50}
        priority
        style={{ objectFit: "contain", maxWidth: "100%" }}
      />
    </Box>
  );
}
