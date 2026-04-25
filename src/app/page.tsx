"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import Center from "@/components/Center";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/settings");
  }, [router]);

  return (
    <Center fullScreen>
      <CircularProgress />
    </Center>
  );
}
