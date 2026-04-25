"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AccountBalanceOutlined,
  BusinessOutlined,
  PaymentsOutlined,
  PeopleAltOutlined,
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
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";

interface Stats {
  sites: number;
  labours: number;
  finance: {
    income: number;
    expense: number;
    balance: number;
  };
  quotationValue: number;
}

export default function DashboardPage() {
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
      color: "#3b82f6",
      label: "Active Projects",
    },
    {
      title: "Labour Force",
      value: stats?.labours || 0,
      icon: <PeopleAltOutlined sx={{ fontSize: 32 }} />,
      color: "#8b5cf6",
      label: "Total Workers",
    },
    {
      title: "Quotation Pipeline",
      value: `₹${(stats?.quotationValue || 0).toLocaleString()}`,
      icon: <RequestQuoteOutlined sx={{ fontSize: 32 }} />,
      color: "#f59e0b",
      label: "Approved Quotes",
    },
    {
      title: "Material Expenses",
      value: `₹${(stats?.finance.materialCost || 0).toLocaleString()}`,
      icon: <ToolsIcon sx={{ fontSize: 32 }} />,
      color: "#f43f5e",
      label: "Total Procurement",
    },
    {
      title: "Current Balance",
      value: `₹${(stats?.finance.balance || 0).toLocaleString()}`,
      icon: <AccountBalanceOutlined sx={{ fontSize: 32 }} />,
      color: "#10b981",
      label: "Financial Health",
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeaderWithActions
        pageTitle="Dashboard Overview"
        showSearch={false}
        onRefreshAction={fetchStats}
      />

      {/* Primary Stats Grid using size prop (MUI v6) */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {loading
          ? [...Array(4)].map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <Skeleton
                  variant="rounded"
                  height={160}
                  sx={{ borderRadius: 5 }}
                />
              </Grid>
            ))
          : statConfig.map((item, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 5,
                    border: "1px solid",
                    borderColor: "grey.200",
                    transition: "0.3s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
                      borderColor: item.color,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    sx={{ mb: 2 }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: `${item.color}15`,
                        color: item.color,
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    <TrendingUpOutlined sx={{ color: "grey.300" }} />
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                    {item.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: item.color,
                      fontWeight: 700,
                      mt: 1,
                      display: "block",
                    }}
                  >
                    {item.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
      </Grid>

      {/* Second Row: Detailed Financials */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 6,
              border: "1px solid",
              borderColor: "grey.100",
              height: "100%",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 4 }}>
              Financial Performance
            </Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 6 }}>
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "success.50",
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "success.100",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Avatar
                      sx={{ bgcolor: "success.main", width: 32, height: 32 }}
                    >
                      <PaymentsOutlined sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography
                      variant="subtitle2"
                      color="success.dark"
                      fontWeight={700}
                    >
                      Total Revenue
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={900}>
                    ₹{stats?.finance.income.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "error.50",
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "error.100",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Avatar
                      sx={{ bgcolor: "error.main", width: 32, height: 32 }}
                    >
                      <PaymentsOutlined sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography
                      variant="subtitle2"
                      color="error.dark"
                      fontWeight={700}
                    >
                      Total Expenses
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={900}>
                    ₹{stats?.finance.expense.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 5, p: 3, bgcolor: "grey.50", borderRadius: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Net Profit Margin (Estimated)
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography variant="h3" fontWeight={900} color="primary.main">
                  {stats
                    ? Math.round(
                        ((stats.finance.income - stats.finance.expense) /
                          (stats.finance.income || 1)) *
                          100
                      )
                    : 0}
                  %
                </Typography>
                <Typography
                  variant="body1"
                  color="success.main"
                  fontWeight={700}
                >
                  Positive Growth
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 6,
              bgcolor: "primary.main",
              color: "white",
              height: "100%",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
              Quick Insights
            </Typography>
            <Stack spacing={3}>
              <Box
                sx={{ p: 2, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 3 }}
              >
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Average Labour Cost / Day
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  ₹12,450 (Calculated)
                </Typography>
              </Box>
              <Box
                sx={{ p: 2, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 3 }}
              >
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Quotation Conversion Rate
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  74% Approval
                </Typography>
              </Box>
              <Box
                sx={{ p: 2, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 3 }}
              >
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Site Efficiency
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  8.2 / 10 Scale
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ mt: 4, textAlign: "center", pt: 2 }}>
              <Button
                component={Link}
                href="/admin/sites"
                variant="contained"
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  fontWeight: 800,
                  borderRadius: 3,
                  px: 4,
                  "&:hover": { bgcolor: "grey.100" },
                }}
              >
                Manage Sites
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
