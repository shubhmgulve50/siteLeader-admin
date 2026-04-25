// app/not-found.tsx
"use client";

import Link from "next/link";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Box, Button, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Box
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      px={2}
    >
      <ErrorOutlineIcon sx={{ fontSize: 80, color: "#FF6B00" }} />
      <Typography variant="h3" mt={2} fontWeight="bold">
        404 - Page Not Found
      </Typography>
      <Typography variant="body1" mt={1} color="text.secondary">
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </Typography>

      <Link href="/" passHref>
        <Button variant="contained" sx={{ mt: 4 }}>
          Go to Homepage
        </Button>
      </Link>
    </Box>
  );
}
