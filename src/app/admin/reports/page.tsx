"use client";

import { useEffect, useState } from "react";
import {
  Assessment as ReportsIcon,
  TrendingUp as PlIcon,
  ReceiptLong as GstIcon,
  People as LabourIcon,
  Inventory as StockIcon,
  AccountBalance as VendorIcon,
  Description as InvoiceIcon,
  ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActionArea,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { useT } from "@/i18n/LocaleProvider";

interface Site {
  _id: string;
  name: string;
}

interface ReportCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
  buildPath: (params: Record<string, string>) => string;
  requiresSite?: boolean;
}

export default function ReportsHub() {
  const t = useT();
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().substring(0, 10);
  });
  const [to, setTo] = useState(new Date().toISOString().substring(0, 10));

  useEffect(() => {
    api.get(apiEndpoints.sites.base).then((r) => setSites(r.data.data || [])).catch(() => {});
  }, []);

  const reports: ReportCard[] = [
    {
      id: "pl",
      title: "Profit & Loss",
      subtitle: "Income − expenses per site with category breakdown",
      icon: <PlIcon />,
      color: "#16a34a",
      enabled: true,
      requiresSite: true,
      buildPath: (p) => `/admin/reports/pl/print?siteId=${p.siteId}&from=${p.from}&to=${p.to}`,
    },
    {
      id: "gst",
      title: "GST Summary",
      subtitle: "Tax invoices + RA bills grouped by CGST/SGST/IGST %",
      icon: <GstIcon />,
      color: "#2563eb",
      enabled: true,
      buildPath: (p) => `/admin/reports/gst/print?from=${p.from}&to=${p.to}`,
    },
    {
      id: "cashbook",
      title: "Cash Book (Site)",
      subtitle: "Running ledger per site — requires site",
      icon: <VendorIcon />,
      color: "#0891b2",
      enabled: true,
      requiresSite: true,
      buildPath: (p) => `/admin/sites/${p.siteId}/cashbook/print?from=${p.from}&to=${p.to}`,
    },
    {
      id: "labour-register",
      title: "Labour Register",
      subtitle: "Monthly payroll sheet — site + month",
      icon: <LabourIcon />,
      color: "#b45309",
      enabled: true,
      requiresSite: true,
      buildPath: (p) => {
        const d = new Date(p.to);
        return `/admin/labour-register/print?siteId=${p.siteId}&month=${d.getMonth() + 1}&year=${d.getFullYear()}`;
      },
    },
    {
      id: "stock",
      title: "Stock Valuation",
      subtitle: "Current stock × last rate (coming soon)",
      icon: <StockIcon />,
      color: "#7c3aed",
      enabled: false,
      buildPath: () => "#",
    },
    {
      id: "aging",
      title: "Invoice Aging",
      subtitle: "AR aging buckets 0-30 / 31-60 / 61-90 / 90+ (coming soon)",
      icon: <InvoiceIcon />,
      color: "#dc2626",
      enabled: false,
      buildPath: () => "#",
    },
  ];

  const openReport = (r: ReportCard) => {
    if (!r.enabled) return;
    if (r.requiresSite && !siteId) {
      alert("Select a site first");
      return;
    }
    const path = r.buildPath({ siteId, from, to });
    window.open(path, "_blank", "noopener");
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions pageTitle={t("page.reportsTitle")} pageIcon={<ReportsIcon />} actions={[]} />

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, textTransform: "uppercase", color: "primary.main" }}>
          Report Parameters
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Site (if required by report)</InputLabel>
              <Select
                label="Site (if required by report)"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              >
                <MenuItem value="">— None —</MenuItem>
                {sites.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {[
                { label: "Today", days: 0 },
                { label: "Last 7 days", days: 7 },
                { label: "Last 30 days", days: 30 },
                { label: "This month", days: -1 },
                { label: "Last month", days: -2 },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const today = new Date();
                    if (preset.days === 0) {
                      setFrom(today.toISOString().substring(0, 10));
                      setTo(today.toISOString().substring(0, 10));
                    } else if (preset.days > 0) {
                      const f = new Date();
                      f.setDate(f.getDate() - preset.days);
                      setFrom(f.toISOString().substring(0, 10));
                      setTo(today.toISOString().substring(0, 10));
                    } else if (preset.days === -1) {
                      const f = new Date(today.getFullYear(), today.getMonth(), 1);
                      setFrom(f.toISOString().substring(0, 10));
                      setTo(today.toISOString().substring(0, 10));
                    } else if (preset.days === -2) {
                      const f = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                      const t = new Date(today.getFullYear(), today.getMonth(), 0);
                      setFrom(f.toISOString().substring(0, 10));
                      setTo(t.toISOString().substring(0, 10));
                    }
                  }}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  {preset.label}
                </Button>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        {reports.map((r) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={r.id}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: alpha(r.color, 0.3),
                opacity: r.enabled ? 1 : 0.5,
              }}
            >
              <CardActionArea
                onClick={() => openReport(r)}
                disabled={!r.enabled}
                sx={{ height: "100%" }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(r.color, 0.1),
                        color: r.color,
                        display: "flex",
                      }}
                    >
                      {r.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {r.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.subtitle}
                      </Typography>
                      {r.requiresSite && (
                        <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5, fontWeight: 700 }}>
                          requires site
                        </Typography>
                      )}
                      {!r.enabled && (
                        <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5, fontWeight: 700 }}>
                          Coming soon
                        </Typography>
                      )}
                    </Box>
                    {r.enabled && <ArrowIcon sx={{ color: r.color }} />}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
