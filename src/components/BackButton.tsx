import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowBackRounded } from "@mui/icons-material";
import { IconButton } from "@mui/material";

export default function BackButton() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanGoBack(window.history.length > 1);
    }
  }, []);

  const handleGoBack = () => {
    if (canGoBack) {
      router.back();
    }
  };

  return (
    <IconButton
      onClick={() => handleGoBack()}
      color="inherit"
      disabled={!canGoBack}
    >
      <ArrowBackRounded />
    </IconButton>
  );
}
