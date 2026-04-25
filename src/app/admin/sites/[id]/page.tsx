"use client";

import { toast } from "react-hot-toast";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  CalendarMonth as CalendarIcon,
  ContentCopy as CopyIcon,
  Directions as DirectionsIcon,
  FolderOpen as DocsIcon,
  Edit as EditIcon,
  Engineering as EngineerIcon,
  EventAvailable as EventAvailableIcon,
  Payments as FinanceIcon,
  People as LabourIcon,
  LocationOn as LocationIcon,
  HistoryEdu as LogIcon,
  Map as MapIcon,
  LocalShipping as MaterialIcon,
  Flag as MilestonesIcon,
  MoreVert as MoreVertIcon,
  Notes as NotesIcon,
  Dashboard as OverviewIcon,
  PictureAsPdf as PdfIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  Person as SupervisorIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Link as MuiLink,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import KpiCard from "@/components/common/KpiCard";
import DocumentsTab from "@/components/sites/DocumentsTab";
import FinanceTab from "@/components/sites/FinanceTab";
import LabourTab from "@/components/sites/LabourTab";
import LogsTab from "@/components/sites/LogsTab";
import MaterialTab from "@/components/sites/MaterialTab";
import MilestonesTab from "@/components/sites/MilestonesTab";
import apiEndpoints from "@/constants/apiEndpoints";
import { useT } from "@/i18n/LocaleProvider";
import api from "@/lib/axios";
import { ACCENT } from "@/styles/tokens";
import { calcDateProgress, daysBetween, formatINR } from "@/utils/format";
import { buildSiteSummary, shareOnWhatsApp } from "@/utils/share";

interface Site {
  _id: string;
  name: string;
  clientName?: string;
  status: string;
  startDate: string;
  endDate?: string;
  supervisor?: { _id: string; name: string; phoneNumber?: string };
  engineer?: { _id: string; name: string; phoneNumber?: string };
  phoneNumber: string;
  address: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  projectType?: string;
  priority?: string;
  estimatedBudget?: number;
  notes?: string;
  builderId: string;
  createdAt: string;
}

function StatusColor(status: string) {
  if (status === "Ongoing") return "warning";
  if (status === "Completed") return "success";
  return "default";
}

function PriorityColor(priority?: string) {
  if (priority === "High") return "error";
  if (priority === "Low") return "success";
  return "info";
}

function mapsLink(site: Site): string {
  if (site.latitude != null && site.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [site.address, site.city].filter(Boolean).join(", ")
  )}`;
}

export default function SiteDetailPage() {
  const { id } = useParams();
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const t = useT();

  const [site, setSite] = useState<Site | null>(null);
  const [siteStats, setSiteStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);

  const handleShareWhatsApp = () => {
    if (!site) return;
    shareOnWhatsApp(buildSiteSummary(site, siteStats));
  };

  const handleExportPdf = () => {
    toast("PDF report — coming soon", { icon: "📄" });
  };

  const handleClientPortal = async () => {
    if (!site) return;
    try {
      const res = await api.post(apiEndpoints.sites.portal(site._id));
      const url = `${window.location.origin}/portal/${res.data.token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Portal link copied", { icon: "🔗", duration: 4000 });
      shareOnWhatsApp(
        `*${site.name}*\nView live project progress, milestones and photos:\n${url}`
      );
    } catch {
      toast.error("Failed to generate portal link");
    }
  };

  const fetchSiteDetails = React.useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const [siteRes, statsRes] = await Promise.all([
          api.get(apiEndpoints.sites.byId(id as string)),
          api.get(apiEndpoints.sites.stats(id as string)),
        ]);
        setSite(siteRes.data.data);
        setSiteStats(statsRes.data.data);
        if (isRefresh) toast.success("Refreshed");
      } catch {
        toast.error("Failed to load site details");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (id) fetchSiteDetails();
  }, [id, fetchSiteDetails]);

  const endDateInfo = useMemo(() => {
    if (!site?.endDate) return null;
    const d = daysBetween(site.endDate);
    if (d < 0)
      return { label: `${Math.abs(d)}d overdue`, color: "error" as const };
    if (d === 0) return { label: "Due today", color: "warning" as const };
    if (d <= 7) return { label: `${d}d left`, color: "warning" as const };
    return { label: `${d}d left`, color: "info" as const };
  }, [site?.endDate]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={240} height={40} />
        <Skeleton variant="text" width={120} height={24} sx={{ mt: 0.5 }} />
        <Skeleton variant="rounded" height={110} sx={{ mt: 1.5, borderRadius: 3 }} />
        <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
          {[0, 1, 2, 3].map((k) => (
            <Grid size={{ xs: 6, sm: 6, md: 3 }} key={k}>
              <Skeleton variant="rounded" height={80} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={360} sx={{ mt: 2, borderRadius: 3 }} />
      </Box>
    );
  }

  if (!site) {
    return (
      <Box>
        <Alert severity="error">Site not found</Alert>
        <Button startIcon={<BackIcon />} onClick={() => router.back()} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  const gmaps = mapsLink(site);

  return (
    <Box>
      {/* ── HEADER ── */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>

        {/* Row 1: back + name + meta + actions */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-start"
          sx={{ mb: 1.5 }}
        >
          <IconButton
            onClick={() => router.back()}
            size="small"
            sx={{ bgcolor: "background.paper", boxShadow: 1, mt: 0.25, flexShrink: 0 }}
          >
            <BackIcon fontSize="small" />
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                lineHeight: 1.2,
                fontSize: { xs: "1.15rem", sm: "1.5rem", md: "1.9rem" },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {site.name}
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25, flexWrap: "wrap", gap: 0.5 }}>
              {site.city && (
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {site.city}
                </Typography>
              )}
              <Typography variant="caption" color="text.disabled">
                · {new Date(site.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </Typography>
            </Stack>
          </Box>

          {/* Desktop-only icon group */}
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: "none", md: "flex" }, flexShrink: 0 }}>
            <Tooltip title="Open in Maps">
              <IconButton component="a" href={gmaps} target="_blank" rel="noopener" sx={{ bgcolor: "background.paper", boxShadow: 1 }}>
                <DirectionsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export PDF">
              <IconButton onClick={handleExportPdf} sx={{ bgcolor: "background.paper", boxShadow: 1 }}>
                <PdfIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={() => fetchSiteDetails(true)} disabled={refreshing} sx={{ bgcolor: "background.paper", boxShadow: 1 }}>
                  {refreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Edit site">
              <IconButton onClick={() => router.push(`/admin/sites?edit=${site._id}`)} sx={{ bgcolor: "background.paper", boxShadow: 1 }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Row 2: chips + contact icons */}
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ flexWrap: "wrap", gap: 0.75 }}
        >
          <Chip label={site.status} color={StatusColor(site.status)} size="small" sx={{ fontWeight: 700 }} />
          {site.priority && (
            <Chip label={site.priority} color={PriorityColor(site.priority)} variant="outlined" size="small" sx={{ fontWeight: 700 }} />
          )}
          {site.projectType && (
            <Chip label={site.projectType} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
          )}
          {endDateInfo && (
            <Chip
              icon={<EventAvailableIcon sx={{ fontSize: 14 }} />}
              label={endDateInfo.label}
              color={endDateInfo.color}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          )}

          {/* spacer */}
          <Box sx={{ flex: 1 }} />

          <Tooltip title="Call site contact">
            <IconButton component="a" href={`tel:${site.phoneNumber}`} size="small" sx={{ bgcolor: "background.paper", boxShadow: 1 }}>
              <PhoneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share on WhatsApp">
            <IconButton onClick={handleShareWhatsApp} size="small" sx={{ bgcolor: "background.paper", boxShadow: 1, color: "#25D366" }}>
              <WhatsAppIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Mobile: more menu */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <Tooltip title="More">
              <IconButton onClick={(e) => setMoreAnchor(e.currentTarget)} size="small" sx={{ bgcolor: "background.paper", boxShadow: 1 }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={moreAnchor}
              open={Boolean(moreAnchor)}
              onClose={() => setMoreAnchor(null)}
              slotProps={{ paper: { sx: { mt: 1, minWidth: 190, borderRadius: 2 } } }}
            >
              <MenuItem component="a" href={gmaps} target="_blank" rel="noopener" onClick={() => setMoreAnchor(null)}>
                <DirectionsIcon sx={{ mr: 1.5, fontSize: 18 }} /> Open in Maps
              </MenuItem>
              <MenuItem onClick={() => { setMoreAnchor(null); handleExportPdf(); }}>
                <PdfIcon sx={{ mr: 1.5, fontSize: 18 }} /> Export PDF
              </MenuItem>
              <MenuItem onClick={() => { setMoreAnchor(null); fetchSiteDetails(true); }} disabled={refreshing}>
                <RefreshIcon sx={{ mr: 1.5, fontSize: 18 }} /> Refresh
              </MenuItem>
              <MenuItem onClick={() => { setMoreAnchor(null); router.push(`/admin/sites?edit=${site._id}`); }}>
                <EditIcon sx={{ mr: 1.5, fontSize: 18 }} /> Edit Site
              </MenuItem>
              <MenuItem onClick={() => { setMoreAnchor(null); window.open(`/admin/kiosk/${site._id}`, "_blank", "noopener"); }}>
                <LabourIcon sx={{ mr: 1.5, fontSize: 18 }} /> Open Kiosk
              </MenuItem>
              <MenuItem onClick={() => { setMoreAnchor(null); handleClientPortal(); }}>
                <WhatsAppIcon sx={{ mr: 1.5, fontSize: 18, color: "#25D366" }} /> Share with Client
              </MenuItem>
            </Menu>
          </Box>
        </Stack>

        {/* Key Info Bar */}
        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            p: { xs: 1.25, sm: 2.5 },
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.12),
          }}
        >
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            {site.clientName && (
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <InfoCell label="Client" value={site.clientName} />
              </Grid>
            )}
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
                Contact
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                <PhoneIcon sx={{ fontSize: 12, color: "primary.main" }} />
                <MuiLink href={`tel:${site.phoneNumber}`} underline="hover" sx={{ fontWeight: 700, fontSize: 12, color: "text.primary" }}>
                  {site.phoneNumber}
                </MuiLink>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
                Supervisor
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                <Avatar sx={{ width: 16, height: 16, fontSize: 8, bgcolor: "primary.main" }}>
                  {(site.supervisor?.name || "U").charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12 }}>
                  {site.supervisor?.name || "Unassigned"}
                </Typography>
              </Stack>
            </Grid>
            {site.engineer && (
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
                  Engineer
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                  <EngineerIcon sx={{ fontSize: 13, color: "primary.main" }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12 }}>
                    {(site.engineer as any)?.name || String(site.engineer)}
                  </Typography>
                </Stack>
              </Grid>
            )}
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
                Start
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                <CalendarIcon sx={{ fontSize: 12, color: "primary.main" }} />
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12 }}>
                  {new Date(site.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </Typography>
              </Stack>
            </Grid>
            {site.endDate && (
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
                  Target End
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                  <CalendarIcon sx={{ fontSize: 12, color: "warning.main" }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12, color: "warning.dark" }}>
                    {new Date(site.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </Typography>
                </Stack>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
                Address
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ mt: 0.25 }}>
                <LocationIcon sx={{ fontSize: 12, color: "primary.main", mt: 0.25 }} />
                <MuiLink
                  href={gmaps}
                  target="_blank"
                  rel="noopener"
                  underline="hover"
                  sx={{ fontWeight: 500, fontSize: 12, color: "text.primary", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                >
                  {site.address}
                </MuiLink>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* ── QUICK ACTIONS ── */}
      <Box
        sx={{
          mb: { xs: 2, sm: 3 },
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: 0 },
        }}
      >
        <Stack direction="row" spacing={0.75} sx={{ minWidth: "max-content", pb: 0.5 }}>
          {[
            { label: t("site.dailyLogs"), tab: 1, color: "#2563eb" },
            { label: t("action.markAttendance"), tab: 2, color: "#059669" },
            { label: t("site.materials"), tab: 3, color: "#d97706" },
            { label: t("action.addExpense"), tab: 4, color: "#8b5cf6" },
            { label: t("site.milestones"), tab: 5, color: "#0891b2" },
          ].map((action) => (
            <Button
              key={action.label}
              onClick={() => setActiveTab(action.tab)}
              startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              size="small"
              sx={{
                textTransform: "none",
                fontWeight: 700,
                px: { xs: 1.25, sm: 2 },
                py: 0.75,
                borderRadius: 2,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                color: action.color,
                bgcolor: alpha(action.color, 0.08),
                border: "1px solid",
                borderColor: alpha(action.color, 0.2),
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: alpha(action.color, 0.15) },
              }}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* ── OPERATIONAL STATS ── */}
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: "block", fontSize: "0.65rem" }}>
        {t("site.operationalPulse")}
      </Typography>
      <Grid container spacing={{ xs: 1, sm: 1.5 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        {[
          { label: t("site.labourToday"), value: siteStats?.presentLabourToday ?? 0, sub: `of ${siteStats?.totalLabourAssigned ?? 0} assigned`, icon: <LabourIcon />, color: ACCENT.success },
          { label: t("site.dailyLogsCount"), value: siteStats?.logsCount ?? 0, sub: "Progress reports", icon: <LogIcon />, color: ACCENT.primary },
          { label: t("site.materialSpend"), value: formatINR(siteStats?.materialExpense || 0), sub: "Total outflow", icon: <MaterialIcon />, color: ACCENT.amber },
          {
            label: t("site.timeline"),
            value: endDateInfo?.label ?? (site.endDate ? `${calcDateProgress(site.startDate, site.endDate) ?? 0}%` : "Ongoing"),
            sub: site.endDate ? "Until target end" : "No end date",
            icon: <CalendarIcon />,
            color: ACCENT.purple,
          },
        ].map((stat) => (
          <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
            <KpiCard label={stat.label} value={stat.value} sub={stat.sub} icon={stat.icon} color={stat.color} variant="default" compact />
          </Grid>
        ))}
      </Grid>

      {/* ── FINANCIAL STATS ── */}
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: "block", fontSize: "0.65rem" }}>
        {t("site.financialStanding")}
      </Typography>
      <Grid container spacing={{ xs: 1, sm: 1.5 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        {[
          { label: t("site.paidByClient"), value: formatINR(siteStats?.totalIncome || 0), color: ACCENT.success },
          { label: t("site.totalExpense"), value: formatINR(siteStats?.totalExpense || 0), color: ACCENT.error },
          { label: t("site.labourCost"), value: formatINR(siteStats?.labourExpense || 0), color: ACCENT.purple },
          { label: t("site.currentBalance"), value: `${(siteStats?.balance || 0) >= 0 ? "+" : ""}${formatINR(siteStats?.balance || 0)}`, color: (siteStats?.balance || 0) >= 0 ? ACCENT.success : ACCENT.error },
        ].map((stat) => (
          <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
            <KpiCard label={stat.label} value={stat.value} color={stat.color} variant="soft" compact />
          </Grid>
        ))}
      </Grid>

      {/* ── TABS ── */}
      <Paper
        elevation={0}
        sx={{ borderRadius: { xs: 2, sm: 4 }, overflow: "hidden", border: "1px solid", borderColor: "divider" }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            bgcolor: "grey.50",
            borderBottom: 1,
            borderColor: "divider",
            minHeight: { xs: 48, sm: 56 },
            "& .MuiTab-root": {
              py: { xs: 0.75, sm: 1.5 },
              minHeight: { xs: 48, sm: 56 },
              fontWeight: 700,
              minWidth: { xs: 52, sm: "auto" },
              px: { xs: 1, sm: 2 },
              fontSize: { xs: "0.6rem", sm: "0.875rem" },
            },
            "& .MuiTab-iconWrapper": { mb: { xs: 0.25, sm: 0.5 } },
          }}
        >
          {[
            { icon: <OverviewIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, label: t("site.overview") },
            { icon: <LogIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, label: t("site.dailyLogs") },
            { icon: <LabourIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, label: isMobile ? "Labour" : t("site.labourAndAttendance") },
            { icon: <MaterialIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, label: t("site.materials") },
            { icon: <FinanceIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, label: t("site.finance") },
            { icon: <MilestonesIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, label: isMobile ? "Goals" : t("site.milestones") },
            { icon: <DocsIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />, label: t("site.documents") },
          ].map((tab) => (
            <Tab key={tab.label} icon={tab.icon} iconPosition="top" label={tab.label} />
          ))}
        </Tabs>

        <Box sx={{ p: { xs: 1, sm: 2.5 } }}>
          {activeTab === 0 && <OverviewTab site={site} siteStats={siteStats} />}
          {activeTab === 1 && <LogsTab siteId={site._id} />}
          {activeTab === 2 && <LabourTab siteId={site._id} />}
          {activeTab === 3 && <MaterialTab siteId={site._id} />}
          {activeTab === 4 && <FinanceTab siteId={site._id} />}
          {activeTab === 5 && <MilestonesTab siteId={site._id} />}
          {activeTab === 6 && <DocumentsTab siteId={site._id} />}
        </Box>
      </Paper>
    </Box>
  );
}

function InfoCell({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12, display: "block", mt: 0.25 }}>
        {value}
      </Typography>
    </>
  );
}

function InfoRow({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
  href?: string;
}) {
  if (!value && value !== 0) return null;
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "grey.100" }}>
      {icon && <Box sx={{ color: "primary.main", mt: 0.25, flexShrink: 0 }}>{icon}</Box>}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </Typography>
        {href ? (
          <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
            <MuiLink href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener" underline="hover" sx={{ color: "text.primary" }}>
              {value}
            </MuiLink>
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25, wordBreak: "break-word" }}>
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function OverviewTab({ site, siteStats }: { site: Site; siteStats: any }) {
  const theme = useTheme();
  const budgetUsed =
    site.estimatedBudget && site.estimatedBudget > 0
      ? Math.min(100, Math.round(((siteStats?.totalExpense || 0) / site.estimatedBudget) * 100))
      : 0;
  const timeProgress = calcDateProgress(site.startDate, site.endDate);
  const gmaps = mapsLink(site);

  const copyCoords = async () => {
    if (site.latitude != null && site.longitude != null) {
      try {
        await navigator.clipboard.writeText(`${site.latitude}, ${site.longitude}`);
        toast.success("Coordinates copied");
      } catch {
        toast.error("Copy failed");
      }
    }
  };

  return (
    <Box>
      <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
        {/* Site Details */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 3, borderColor: "grey.200" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Site Details
              </Typography>
              <Button
                size="small"
                startIcon={<MapIcon sx={{ fontSize: 14 }} />}
                component="a"
                href={gmaps}
                target="_blank"
                rel="noopener"
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem" }}
              >
                View Map
              </Button>
            </Stack>

            <InfoRow label="Site Name" value={site.name} />
            <InfoRow label="Client" value={site.clientName} />
            <InfoRow label="Contact" value={site.phoneNumber} icon={<PhoneIcon sx={{ fontSize: 15 }} />} href={`tel:${site.phoneNumber}`} />
            <InfoRow label="Address" value={site.address} icon={<LocationIcon sx={{ fontSize: 15 }} />} href={gmaps} />
            {site.city && <InfoRow label="City" value={site.city} icon={<LocationIcon sx={{ fontSize: 15 }} />} />}
            {site.latitude != null && site.longitude != null && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.25, borderBottom: "1px solid", borderColor: "grey.100" }}>
                <Box sx={{ color: "primary.main", flexShrink: 0 }}>
                  <LocationIcon sx={{ fontSize: 15 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Coordinates
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                    {site.latitude}, {site.longitude}
                  </Typography>
                </Box>
                <Tooltip title="Copy coordinates">
                  <IconButton size="small" onClick={copyCoords}>
                    <CopyIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            <Divider sx={{ my: 1.5 }} />
            <InfoRow label="Project Type" value={site.projectType || "Residential"} />
            <InfoRow label="Status" value={site.status} />
            <InfoRow label="Priority" value={site.priority || "Medium"} />
            <InfoRow label="Start Date" value={new Date(site.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} icon={<CalendarIcon sx={{ fontSize: 15 }} />} />
            {site.endDate && (
              <InfoRow label="Target End" value={new Date(site.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} icon={<CalendarIcon sx={{ fontSize: 15 }} />} />
            )}
            {site.estimatedBudget ? <InfoRow label="Estimated Budget" value={formatINR(site.estimatedBudget)} /> : null}
            <Divider sx={{ my: 1.5 }} />
            <InfoRow label="Supervisor" value={site.supervisor?.name || "Unassigned"} icon={<SupervisorIcon sx={{ fontSize: 15 }} />} />
            {site.supervisor?.phoneNumber && (
              <InfoRow label="Supervisor Contact" value={site.supervisor.phoneNumber} icon={<PhoneIcon sx={{ fontSize: 15 }} />} href={`tel:${site.supervisor.phoneNumber}`} />
            )}
            {site.engineer && (
              <InfoRow label="Engineer" value={(site.engineer as any)?.name || String(site.engineer)} icon={<EngineerIcon sx={{ fontSize: 15 }} />} />
            )}
            {site.engineer?.phoneNumber && (
              <InfoRow label="Engineer Contact" value={site.engineer.phoneNumber} icon={<PhoneIcon sx={{ fontSize: 15 }} />} href={`tel:${site.engineer.phoneNumber}`} />
            )}
            {site.notes && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ py: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <NotesIcon sx={{ fontSize: 15, color: "primary.main" }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Notes
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2, border: "1px dashed", borderColor: alpha(theme.palette.primary.main, 0.2), fontStyle: "italic", lineHeight: 1.7, whiteSpace: "pre-wrap" }}
                  >
                    {site.notes}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Progress & Summary */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={{ xs: 1.5, sm: 2 }}>
            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 3, borderColor: "grey.200" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
                Project Progress
              </Typography>
              <Stack spacing={2}>
                {/* Timeline */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Timeline</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: "primary.main" }}>
                      {timeProgress != null ? `${timeProgress}% Elapsed` : "Ongoing"}
                    </Typography>
                  </Stack>
                  <Box sx={{ height: 8, bgcolor: "grey.100", borderRadius: 4, overflow: "hidden" }}>
                    <Box
                      sx={{
                        height: "100%",
                        width: `${timeProgress ?? 50}%`,
                        bgcolor: timeProgress != null && timeProgress > 90 ? "error.main" : "primary.main",
                        borderRadius: 4,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </Box>
                  {site.endDate && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      {new Date(site.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} → {new Date(site.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </Typography>
                  )}
                </Box>

                {/* Budget */}
                {site.estimatedBudget ? (
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Budget Burn</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: budgetUsed > 90 ? "error.main" : "warning.main" }}>
                        {budgetUsed}% Spent
                      </Typography>
                    </Stack>
                    <Box sx={{ height: 8, bgcolor: "grey.100", borderRadius: 4, overflow: "hidden" }}>
                      <Box
                        sx={{
                          height: "100%",
                          width: `${Math.min(budgetUsed, 100)}%`,
                          bgcolor: budgetUsed > 90 ? "error.main" : budgetUsed > 70 ? "warning.main" : "success.main",
                          borderRadius: 4,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      {formatINR(siteStats?.totalExpense || 0)} of {formatINR(site.estimatedBudget)}
                    </Typography>
                  </Box>
                ) : null}

                {/* Balance */}
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: alpha((siteStats?.balance || 0) >= 0 ? "#10b981" : "#ef4444", 0.06),
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: alpha((siteStats?.balance || 0) >= 0 ? "#10b981" : "#ef4444", 0.2),
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Net Balance</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: (siteStats?.balance || 0) >= 0 ? "success.main" : "error.main" }}>
                    {(siteStats?.balance || 0) >= 0 ? "+" : ""}{formatINR(siteStats?.balance || 0)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 3, borderColor: "grey.200" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                Quick Summary
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: "Labour Assigned", value: siteStats?.totalLabourAssigned || 0 },
                  { label: "Present Today", value: siteStats?.presentLabourToday || 0 },
                  { label: "Daily Logs", value: siteStats?.logsCount || 0 },
                  { label: "Total Income", value: formatINR(siteStats?.totalIncome || 0) },
                  { label: "Total Expense", value: formatINR(siteStats?.totalExpense || 0) },
                  { label: "Material Spend", value: formatINR(siteStats?.materialExpense || 0) },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
