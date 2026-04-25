"use client";

import { toast } from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowBack as BackIcon,
  Payments as FinanceIcon,
  People as LabourIcon,
  HistoryEdu as LogIcon,
  LocalShipping as MaterialIcon,
  Dashboard as OverviewIcon,
  Person as SupervisorIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import FinanceTab from "@/components/sites/FinanceTab";
// Tabs
import LabourTab from "@/components/sites/LabourTab";
import LogsTab from "@/components/sites/LogsTab";
import MaterialTab from "@/components/sites/MaterialTab";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";

interface Site {
  _id: string;
  name: string;
  clientName?: string;
  status: string;
  startDate: string;
  supervisor?: { _id: string; name: string };
  phoneNumber: string;
  address: string;
}

export default function SiteDetailPage() {
  const { id } = useParams();
  const theme = useTheme();
  const router = useRouter();

  const [site, setSite] = useState<Site | null>(null);
  const [siteStats, setSiteStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const fetchSiteDetails = React.useCallback(async () => {
    setLoading(true);
    try {
      const [siteRes, statsRes] = await Promise.all([
        api.get(apiEndpoints.sites.byId(id as string)),
        api.get(apiEndpoints.sites.stats(id as string)),
      ]);
      setSite(siteRes.data.data);
      setSiteStats(statsRes.data.data);
    } catch {
      toast.error("Failed to load site details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchSiteDetails();
  }, [id, fetchSiteDetails]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!site) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Site not found</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* HEADER SECTION */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{ bgcolor: "background.paper" }}
          >
            <BackIcon />
          </IconButton>
          <Typography
            variant="h4"
            sx={{ fontWeight: 900, color: "primary.main" }}
          >
            {site.name}
          </Typography>
          <Chip
            label={site.status}
            color={
              site.status === "Ongoing"
                ? "warning"
                : site.status === "Completed"
                  ? "success"
                  : "default"
            }
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, textTransform: "uppercase" }}
              >
                Client Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {site.clientName || "Not Specified"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, textTransform: "uppercase" }}
              >
                Supervisor
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <SupervisorIcon fontSize="small" color="primary" />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {site.supervisor?.name || "Unassigned"}
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, textTransform: "uppercase" }}
              >
                Start Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {site.startDate
                  ? new Date(site.startDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Not Set"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, textTransform: "uppercase" }}
              >
                Location
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {site.address}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* QUICK STATS OVERVIEW - Operational */}
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ fontWeight: 800, mb: 1, display: "block" }}
      >
        Operational Pulse
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: "Labour Today",
            value: siteStats?.presentLabourToday || 0,
            sub: `of ${siteStats?.totalLabourAssigned || 0} assigned`,
            icon: <LabourIcon />,
            color: "#059669",
            bg: "#ecfdf5",
          },
          {
            label: "Daily Progress",
            value: siteStats?.logsCount || 0,
            sub: "Total Reports",
            icon: <LogIcon />,
            color: "#2563eb",
            bg: "#eff6ff",
          },
          {
            label: "Material Move",
            value: siteStats?.materialExpense > 0 ? "Active" : "Stable",
            sub: "Site Inventory",
            icon: <MaterialIcon />,
            color: "#d97706",
            bg: "#fffbeb",
          },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                gap: 2,
                border: "1px solid",
                borderColor: "grey.100",
                bgcolor: "background.paper",
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: stat.bg,
                  color: stat.color,
                  display: "flex",
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700 }}
                >
                  {stat.label} •{" "}
                  <span style={{ opacity: 0.8 }}>{stat.sub}</span>
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* QUICK STATS OVERVIEW - Financial */}
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ fontWeight: 800, mb: 1, display: "block" }}
      >
        Financial Standing
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          {
            label: "Paid by Client",
            value: `₹${(siteStats?.totalIncome || 0).toLocaleString()}`,
            icon: <OverviewIcon />,
            color: "#10b981",
            bg: alpha("#10b981", 0.08),
          },
          {
            label: "Total Expense",
            value: `₹${(siteStats?.totalExpense || 0).toLocaleString()}`,
            icon: <FinanceIcon />,
            color: "#ef4444",
            bg: alpha("#ef4444", 0.08),
          },
          {
            label: "Labour Cost",
            value: `₹${(siteStats?.labourExpense || 0).toLocaleString()}`,
            icon: <LabourIcon />,
            color: "#8b5cf6",
            bg: alpha("#8b5cf6", 0.08),
          },
          {
            label: "Current Balance",
            value: `₹${(siteStats?.balance || 0).toLocaleString()}`,
            icon: <FinanceIcon />,
            color: siteStats?.balance >= 0 ? "#10b981" : "#ef4444",
            bg: alpha(siteStats?.balance >= 0 ? "#10b981" : "#ef4444", 0.08),
          },
        ].map((stat) => (
          <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                border: "1px solid",
                borderColor: alpha(stat.color, 0.2),
                bgcolor: stat.bg,
                textAlign: "left",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: stat.color,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  mb: 1,
                  display: "block",
                }}
              >
                {stat.label}
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 900, color: stat.color }}
              >
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* MODULE TABS */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            bgcolor: "grey.50",
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": { py: 2, minHeight: 64, fontWeight: 700 },
          }}
        >
          <Tab icon={<OverviewIcon />} iconPosition="start" label="Overview" />
          <Tab
            icon={<LabourIcon />}
            iconPosition="start"
            label="Labour & Attendance"
          />
          <Tab icon={<MaterialIcon />} iconPosition="start" label="Materials" />
          <Tab icon={<LogIcon />} iconPosition="start" label="Daily Logs" />
          <Tab icon={<FinanceIcon />} iconPosition="start" label="Finance" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <OverviewTab site={site} siteStats={siteStats} />}
          {activeTab === 1 && <LabourTab siteId={site._id} />}
          {activeTab === 2 && <MaterialTab siteId={site._id} />}
          {activeTab === 3 && <LogsTab siteId={site._id} />}
          {activeTab === 4 && <FinanceTab siteId={site._id} />}
        </Box>
      </Paper>
    </Box>
  );
}

function OverviewTab({ site, siteStats }: { site: any; siteStats: any }) {
  const theme = useTheme();
  const budgetUsed = site.estimatedBudget ? Math.round((siteStats?.totalExpense / site.estimatedBudget) * 100) : 0;
  
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
        Site Execution Intelligence
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            variant="outlined"
            sx={{ 
              p: 4, 
              borderRadius: 5, 
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              border: '1px solid',
              borderColor: 'grey.100',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Subtle background pattern could go here */}
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.5px' }}>
              Execution Roadmap
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px' }}>
              Real-time synchronization of site resources, financial health, and construction milestones.
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={4}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                  SITE TYPE
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {site.projectType || "Residential"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                  CLIENT COMMITMENT
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>
                  ₹{(siteStats?.totalIncome || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                  ESTIMATIVE BUDGET
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  ₹{(site.estimatedBudget || 0).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            variant="outlined"
            sx={{ p: 3, borderRadius: 5, border: '1px solid', borderColor: 'grey.100' }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>
              Execution Vitality
            </Typography>
            <Stack spacing={4}>
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Project Clock</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main' }}>65% Done</Typography>
                </Stack>
                <Box sx={{ height: 10, bgcolor: 'grey.100', borderRadius: 5, overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', width: '65%', bgcolor: 'primary.main', borderRadius: 5 }} />
                </Box>
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Financial Burn</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: budgetUsed > 90 ? 'error.main' : 'warning.main' }}>
                    {budgetUsed}% Spent
                  </Typography>
                </Stack>
                <Box sx={{ height: 10, bgcolor: 'grey.100', borderRadius: 5, overflow: 'hidden' }}>
                  <Box sx={{ 
                    height: '100%', 
                    width: `${Math.min(budgetUsed, 100)}%`, 
                    bgcolor: budgetUsed > 90 ? 'error.main' : 'warning.main',
                    borderRadius: 5 
                  }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ₹{(siteStats?.totalExpense || 0).toLocaleString()} of ₹{(site.estimatedBudget || 0).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 3, 
                border: '1px dashed', 
                borderColor: 'grey.300',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Site Cash Flow</Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 900, 
                  color: (siteStats?.balance || 0) >= 0 ? 'success.main' : 'error.main' 
                }}>
                  {siteStats?.balance >= 0 ? '+' : ''}₹{(siteStats?.balance || 0).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
