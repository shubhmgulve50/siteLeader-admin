"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Breadcrumbs, Divider, Typography } from "@mui/material";
import BackButton from "@/components/BackButton";

type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: React.ReactNode;
};

interface CustomBreadcrumbsProps {
  items: BreadcrumbItem[];
}

const CustomBreadcrumbs = ({ items }: CustomBreadcrumbsProps) => {
  const router = useRouter();

  return (
    <Box display="flex" flexDirection="row" mb={3} alignItems="center" gap={1}>
      <BackButton />
      <Divider
        orientation="vertical"
        flexItem
        sx={{
          height: 24,
          alignSelf: "center",
          borderColor: "rgba(255,255,255,0.15)",
          borderWidth: 1,
        }}
      />
      <Breadcrumbs aria-label="breadcrumb">
        {items.map((item) => {
          return (
            <Typography
              key={item.label}
              sx={{
                color: "text.primary",
                fontWeight: 800,
                fontSize: "1.1rem",
                letterSpacing: -0.5,
                cursor: item.href ? "pointer" : "default",
                "&:hover": {
                  color: item.href ? "primary.main" : "text.primary",
                },
              }}
              onClick={() => item.href && router.push(item.href)}
            >
              {item.label}
            </Typography>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default CustomBreadcrumbs;
