"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AccountBalanceOutlined,
  BusinessOutlined,
  PaymentsOutlined,
  RequestQuoteOutlined,
  Construction as ToolsIcon,
  TrendingUpOutlined,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { useT } from "@/i18n/LocaleProvider";
import { ACCENT } from "@/styles/tokens";

interface Stats {
  sites: number;
  labours: number;
  finance: {
    income: number;
    expense: number;
    balance: number;
    materialCost: number;
  };
  quotationValue: number;
}

export default function DashboardPage() {
  const t = useT();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await api.get(apiEndpoints.dashboardStats);
      setStats(response.data.data);
    } catch {
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statConfig = [
    {
      title: "Total Sites",
      value: stats?.sites || 0,
      icon: <BusinessOutlined sx={{ fontSize: 32 }} />,
      color: ACCENT.primary,
      label: "Active Projects",
    },
    {
      title: "Quotation Pipeline",
      value: `₹${(stats?.quotationValue || 0).toLocaleString()}`,
      icon: <RequestQuoteOutlined sx={{ fontSize: 32 }} />,
      color: ACCENT.secondary,
      label: "Approved Quotes",
    },
    {
      title: "Material Expenses",
      value: `₹${(stats?.finance.materialCost || 0).toLocaleString()}`,
      icon: <ToolsIcon sx={{ fontSize: 32 }} />,
      color: ACCENT.error,
      label: "Total Procurement",
    },
    {
      title: "Current Balance",
      value: `₹${(stats?.finance.balance || 0).toLocaleString()}`,
      icon: <AccountBalanceOutlined sx={{ fontSize: 32 }} />,
      color: ACCENT.success,
      label: "Financial Health",
    },
  ];

  const margin = stats
    ? Math.round(
        ((stats.finance.income - stats.finance.expense) /
          (stats.finance.income || 1)) *
          100
      )
    : 0;

  const quickActions = [
    { label: "Sites", href: "/admin/sites", icon: <BusinessOutlined /> },
    { label: "Labour", href: "/admin/labours", icon: <ToolsIcon /> },
    { label: "Quotation", href: "/admin/quotations", icon: <RequestQuoteOutlined /> },
    { label: "Finance", href: "/admin/finance", icon: <AccountBalanceOutlined /> },
    { label: "Invoice", href: "/admin/invoices", icon: <PaymentsOutlined /> },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 900, mb: { xs: 2, md: 3 }, fontSize: { xs: "1.25rem", md: "1.5rem" } }}
      >
        {t("page.dashboardTitle")}
      </Typography>

      {/* Primary Stats — 2 cols mobile, 4 cols desktop */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 3, md: 5 } }}>
        {loading
          ? [...Array(4)].map((_, i) => (
              <Grid size={{ xs: 6, md: 3 }} key={i}>
                <Skeleton variant="rounded" height={130} sx={{ borderRadius: 3 }} />
              </Grid>
            ))
          : statConfig.map((item, idx) => (
              <Grid size={{ xs: 6, md: 3 }} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.75, sm: 2.5, md: 3 },
                    borderRadius: { xs: 3, md: 5 },
                    border: "1px solid",
                    borderColor: "grey.200",
                    transition: "0.3s",
                    height: "100%",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 16px 32px rgba(0,0,0,0.06)",
                      borderColor: item.color,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    sx={{ mb: { xs: 1, md: 2 } }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: alpha(item.color, 0.1),
                        color: item.color,
                        width: { xs: 36, md: 52 },
                        height: { xs: 36, md: 52 },
                        borderRadius: 2,
                        "& svg": { fontSize: { xs: 20, md: 28 } },
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    <TrendingUpOutlined sx={{ color: "grey.300", fontSize: { xs: 16, md: 20 } }} />
                  </Stack>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      mb: 0.25,
                      fontSize: { xs: "1rem", sm: "1.3rem", md: "1.75rem" },
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                    }}
                  >
                    {item.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ display: "block", fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: item.color,
                      fontWeight: 700,
                      mt: 0.5,
                      display: { xs: "none", sm: "block" },
                    }}
                  >
                    {item.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
      </Grid>

      {/* Second Row */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Financial Performance */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: { xs: 3, md: 6 },
              border: "1px solid",
              borderColor: "grey.100",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: { xs: 2, md: 3 } }}>
              Financial Performance
            </Typography>
            <Grid container spacing={{ xs: 1.5, md: 3 }}>
              <Grid size={{ xs: 6 }}>
                <Box
                  sx={{
                    p: { xs: 1.5, md: 3 },
                    bgcolor: "success.50",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "success.100",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Avatar sx={{ bgcolor: "success.main", width: 28, height: 28 }}>
                      <PaymentsOutlined sx={{ fontSize: 15 }} />
                    </Avatar>
                    <Typography
                      variant="caption"
                      color="success.dark"
                      fontWeight={700}
                      sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                    >
                      Revenue
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{ fontWeight: 900, fontSize: { xs: "0.95rem", sm: "1.25rem", md: "1.5rem" }, wordBreak: "break-word" }}
                  >
                    ₹{(stats?.finance.income || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Box
                  sx={{
                    p: { xs: 1.5, md: 3 },
                    bgcolor: "error.50",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "error.100",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Avatar sx={{ bgcolor: "error.main", width: 28, height: 28 }}>
                      <PaymentsOutlined sx={{ fontSize: 15 }} />
                    </Avatar>
                    <Typography
                      variant="caption"
                      color="error.dark"
                      fontWeight={700}
                      sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                    >
                      Expenses
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{ fontWeight: 900, fontSize: { xs: "0.95rem", sm: "1.25rem", md: "1.5rem" }, wordBreak: "break-word" }}
                  >
                    ₹{(stats?.finance.expense || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: { xs: 2, md: 4 }, p: { xs: 2, md: 3 }, bgcolor: "grey.50", borderRadius: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                Net Profit Margin (Estimated)
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
                <Typography
                  sx={{ fontWeight: 900, color: "primary.main", fontSize: { xs: "1.75rem", md: "2.5rem" } }}
                >
                  {margin}%
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight={700}>
                  {margin >= 0 ? "Positive Growth" : "Review Costs"}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: { xs: 3, md: 6 },
              bgcolor: "primary.main",
              color: "white",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Quick Actions
            </Typography>
            {/* 2-col grid on mobile, single column on desktop */}
            <Grid container spacing={1}>
              {quickActions.map((a) => (
                <Grid size={{ xs: 6, md: 12 }} key={a.label}>
                  <Button
                    component={Link}
                    href={a.href}
                    startIcon={a.icon}
                    fullWidth
                    sx={{
                      justifyContent: "flex-start",
                      py: { xs: 1.25, md: 1.5 },
                      px: { xs: 1.5, md: 2 },
                      bgcolor: "rgba(255,255,255,0.12)",
                      color: "white",
                      borderRadius: 2.5,
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: { xs: 13, md: 15 },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                      "& .MuiButton-startIcon": { mr: { xs: 0.75, md: 1 } },
                    }}
                  >
                    {a.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
