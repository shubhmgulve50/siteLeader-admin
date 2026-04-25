"use client";

import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useState } from "react";
import {
  AdminPanelSettings as AdminIcon,
  CheckCircle as ApproveIcon,
  Block as BlockIcon,
  Cancel as DenyIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  FilterList as FilterIcon,
  LockOpen as ReinstateIcon,
  Search as SearchIcon,
  Settings as PermissionsIcon,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import api from "@/lib/axios";
import apiEndpoints from "@/constants/apiEndpoints";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";

// All modules builder can be granted
const ALL_MODULES = [
  { key: "sites",          label: "Sites" },
  { key: "labour",         label: "Labour" },
  { key: "materials",      label: "Materials" },
  { key: "equipment",      label: "Equipment" },
  { key: "finance",        label: "Finance" },
  { key: "invoices",       label: "Invoices" },
  { key: "quotations",     label: "Quotations" },
  { key: "ra_bills",       label: "RA Bills" },
  { key: "vendors",        label: "Vendors" },
  { key: "milestones",     label: "Milestones" },
  { key: "safety",         label: "Safety" },
  { key: "documents",      label: "Documents" },
  { key: "labour_advance", label: "Labour Advance" },
  { key: "audit_logs",     label: "Audit Logs" },
];

type VerifStatus = "ALL" | "PENDING" | "APPROVED" | "DENIED" | "SUSPENDED";

interface Builder {
  _id: string;
  name: string;
  email: string;
  verificationStatus: string | null;
  emailVerified: boolean;
  permissions: string[];
  createdAt: string;
}

function statusColor(s: string | null): "warning" | "success" | "error" | "default" {
  if (s === "PENDING") return "warning";
  if (s === "APPROVED") return "success";
  if (s === "DENIED" || s === "SUSPENDED") return "error";
  return "default";
}

export default function SuperAdminPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [userRole, setUserRole] = useState<string>("");
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<VerifStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Deny dialog
  const [denyDialog, setDenyDialog] = useState<Builder | null>(null);
  const [denyReason, setDenyReason] = useState("");

  // Permissions dialog
  const [permDialog, setPermDialog] = useState<Builder | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [permLoading, setPermLoading] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<Builder | null>(null);

  // Check role access
  useEffect(() => {
    api.get(apiEndpoints.adminProfile)
      .then((r) => setUserRole(r.data.data.role))
      .catch(() => {});
  }, []);

  const fetchBuilders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (filterTab !== "ALL") params.verificationStatus = filterTab;
      if (search.trim()) params.search = search.trim();
      const res = await api.get(apiEndpoints.superAdmin.builders, { params });
      setBuilders(res.data.data.builders);
      setTotal(res.data.data.total);
    } catch {
      toast.error("Failed to fetch builders");
    } finally {
      setLoading(false);
    }
  }, [filterTab, search]);

  useEffect(() => {
    if (userRole === "SUPER_ADMIN") fetchBuilders();
  }, [fetchBuilders, userRole]);

  const runAction = async (label: string, fn: () => Promise<void>) => {
    setActionLoading(label);
    try {
      await fn();
      toast.success(`${label} successful`);
      fetchBuilders();
    } catch {
      toast.error(`${label} failed`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = (b: Builder) =>
    runAction("Approve", () => api.post(apiEndpoints.superAdmin.approve(b._id)));

  const handleDenySubmit = async () => {
    if (!denyDialog) return;
    await runAction("Deny", () => api.post(apiEndpoints.superAdmin.deny(denyDialog._id), { reason: denyReason }));
    setDenyDialog(null);
    setDenyReason("");
  };

  const handleSuspend = (b: Builder) =>
    runAction("Suspend", () => api.post(apiEndpoints.superAdmin.suspend(b._id)));

  const handleReinstate = (b: Builder) =>
    runAction("Reinstate", () => api.post(apiEndpoints.superAdmin.reinstate(b._id)));

  const handleVerifyEmail = (b: Builder) =>
    runAction("Verify email", () => api.post(apiEndpoints.superAdmin.verifyEmail(b._id)));

  const openPermDialog = (b: Builder) => {
    setPermDialog(b);
    setSelectedPerms(b.permissions ?? []);
  };

  const handleSavePerms = async () => {
    if (!permDialog) return;
    setPermLoading(true);
    try {
      await api.put(apiEndpoints.superAdmin.permissions(permDialog._id), { permissions: selectedPerms });
      toast.success("Permissions updated");
      fetchBuilders();
      setPermDialog(null);
    } catch {
      toast.error("Failed to update permissions");
    } finally {
      setPermLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteDialog) return;
    await runAction("Delete", () => api.delete(apiEndpoints.superAdmin.delete(deleteDialog._id)));
    setDeleteDialog(null);
  };

  if (userRole && userRole !== "SUPER_ADMIN") {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Access denied. Super Admin only.</Alert>
      </Box>
    );
  }

  const tabs: { label: string; value: VerifStatus; color?: string }[] = [
    { label: "Pending", value: "PENDING", color: "#f59e0b" },
    { label: "Approved", value: "APPROVED", color: "#16a34a" },
    { label: "Denied", value: "DENIED", color: "#dc2626" },
    { label: "Suspended", value: "SUSPENDED", color: "#7c3aed" },
    { label: "All", value: "ALL" },
  ];

  return (
    <Box>
      <PageHeaderWithActions
        pageIcon={<AdminIcon />}
        pageTitle="Builder Management"
        showSearch={false}
      />

      {/* Stats row */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        {tabs.slice(0, 4).map((t) => (
          <Grid size={{ xs: 6, sm: 3 }} key={t.value}>
            <Paper
              elevation={0}
              onClick={() => setFilterTab(t.value)}
              sx={{
                p: { xs: 1.25, sm: 2 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: filterTab === t.value ? alpha(t.color!, 0.5) : "divider",
                bgcolor: filterTab === t.value ? alpha(t.color!, 0.06) : "background.paper",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", color: t.color, fontSize: "0.6rem" }}>
                {t.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: t.color, lineHeight: 1.1, mt: 0.25, fontSize: { xs: "1.25rem", sm: "1.75rem" } }}>
                —
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filter bar */}
      <Paper elevation={0} sx={{ mb: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={0} alignItems="stretch">
          <Tabs
            value={filterTab}
            onChange={(_, v) => setFilterTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              flex: 1,
              borderBottom: { xs: "1px solid", sm: "none" },
              borderColor: "divider",
              minHeight: 44,
              "& .MuiTab-root": { minHeight: 44, fontWeight: 700, fontSize: "0.75rem", py: 1 },
            }}
          >
            {tabs.map((t) => <Tab key={t.value} value={t.value} label={t.label} />)}
          </Tabs>
          <Box sx={{ px: 2, py: 1, borderLeft: { sm: "1px solid" }, borderColor: "divider" }}>
            <TextField
              size="small"
              placeholder="Search name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchBuilders()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment>,
              }}
              sx={{ width: { xs: "100%", sm: 200 } }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Builder list */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : builders.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <FilterIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary" fontWeight={600}>No builders found</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {builders.map((b) => (
            <BuilderCard
              key={b._id}
              builder={b}
              isMobile={isMobile}
              actionLoading={actionLoading}
              onApprove={handleApprove}
              onDeny={() => setDenyDialog(b)}
              onSuspend={handleSuspend}
              onReinstate={handleReinstate}
              onVerifyEmail={handleVerifyEmail}
              onPermissions={openPermDialog}
              onDelete={() => setDeleteDialog(b)}
            />
          ))}
          <Typography variant="caption" color="text.disabled" sx={{ textAlign: "center", pb: 1 }}>
            {builders.length} of {total} builders
          </Typography>
        </Stack>
      )}

      {/* Deny dialog */}
      <Dialog open={!!denyDialog} onClose={() => setDenyDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Deny Builder</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Denying <strong>{denyDialog?.name}</strong>. Provide a reason (optional).
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            placeholder="e.g. Incomplete registration details..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDenyDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDenySubmit} disabled={!!actionLoading}>
            {actionLoading === "Deny" ? <CircularProgress size={16} /> : "Deny"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions dialog */}
      <Dialog open={!!permDialog} onClose={() => setPermDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Module Permissions — {permDialog?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
            Select which modules this builder can access.
          </Typography>
          <FormGroup>
            <Grid container spacing={0}>
              {ALL_MODULES.map((m) => (
                <Grid size={{ xs: 6, sm: 4 }} key={m.key}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedPerms.includes(m.key)}
                        onChange={(e) =>
                          setSelectedPerms((prev) =>
                            e.target.checked ? [...prev, m.key] : prev.filter((p) => p !== m.key)
                          )
                        }
                        color="primary"
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{m.label}</Typography>}
                  />
                </Grid>
              ))}
            </Grid>
          </FormGroup>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button size="small" onClick={() => setSelectedPerms(ALL_MODULES.map((m) => m.key))}>
              Select All
            </Button>
            <Button size="small" color="inherit" onClick={() => setSelectedPerms([])}>
              Clear All
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPermDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePerms} disabled={permLoading}>
            {permLoading ? <CircularProgress size={16} /> : "Save Permissions"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>Delete Builder</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 1 }}>
            This permanently deletes <strong>{deleteDialog?.name}</strong> and all their team members. Cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteSubmit} disabled={!!actionLoading}>
            {actionLoading === "Delete" ? <CircularProgress size={16} /> : "Delete Forever"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

interface BuilderCardProps {
  builder: Builder;
  isMobile: boolean;
  actionLoading: string | null;
  onApprove: (b: Builder) => void;
  onDeny: (b: Builder) => void;
  onSuspend: (b: Builder) => void;
  onReinstate: (b: Builder) => void;
  onVerifyEmail: (b: Builder) => void;
  onPermissions: (b: Builder) => void;
  onDelete: (b: Builder) => void;
}

function BuilderCard({ builder: b, actionLoading, onApprove, onDeny, onSuspend, onReinstate, onVerifyEmail, onPermissions, onDelete }: BuilderCardProps) {
  const isPending = b.verificationStatus === "PENDING";
  const isApproved = b.verificationStatus === "APPROVED";
  const isDeniedOrSuspended = b.verificationStatus === "DENIED" || b.verificationStatus === "SUSPENDED";

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
        {/* Avatar + info */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
          <Avatar
            sx={{
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              bgcolor: "primary.main",
              fontSize: { xs: 16, sm: 18 },
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {b.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: { xs: "0.85rem", sm: "0.95rem" } }}>
                {b.name}
              </Typography>
              <Chip
                label={b.verificationStatus ?? "NONE"}
                color={statusColor(b.verificationStatus)}
                size="small"
                sx={{ fontWeight: 700, fontSize: "0.6rem", height: 20 }}
              />
              {b.emailVerified ? (
                <Chip label="Email ✓" size="small" color="success" variant="outlined" sx={{ fontSize: "0.55rem", height: 18, fontWeight: 700 }} />
              ) : (
                <Chip label="Email ✗" size="small" color="error" variant="outlined" sx={{ fontSize: "0.55rem", height: 18, fontWeight: 700 }} />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, fontSize: "0.7rem" }}>
              {b.email}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
              Joined {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </Typography>
          </Box>
        </Stack>

        {/* Action buttons */}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.75 }}>
          {isPending && (
            <>
              <Tooltip title="Approve">
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={actionLoading === "Approve" ? <CircularProgress size={12} color="inherit" /> : <ApproveIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onApprove(b)}
                  disabled={!!actionLoading}
                  sx={{ fontWeight: 700, fontSize: "0.7rem", py: 0.5, px: 1.25, minWidth: 0 }}
                >
                  Approve
                </Button>
              </Tooltip>
              <Tooltip title="Deny">
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DenyIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onDeny(b)}
                  disabled={!!actionLoading}
                  sx={{ fontWeight: 700, fontSize: "0.7rem", py: 0.5, px: 1.25, minWidth: 0 }}
                >
                  Deny
                </Button>
              </Tooltip>
            </>
          )}

          {isApproved && (
            <Tooltip title="Suspend builder access">
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<BlockIcon sx={{ fontSize: 14 }} />}
                onClick={() => onSuspend(b)}
                disabled={!!actionLoading}
                sx={{ fontWeight: 700, fontSize: "0.7rem", py: 0.5, px: 1.25, minWidth: 0 }}
              >
                Suspend
              </Button>
            </Tooltip>
          )}

          {isDeniedOrSuspended && (
            <Tooltip title="Reinstate to Approved">
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<ReinstateIcon sx={{ fontSize: 14 }} />}
                onClick={() => onReinstate(b)}
                disabled={!!actionLoading}
                sx={{ fontWeight: 700, fontSize: "0.7rem", py: 0.5, px: 1.25, minWidth: 0 }}
              >
                Reinstate
              </Button>
            </Tooltip>
          )}

          {!b.emailVerified && (
            <Tooltip title="Manually verify email">
              <IconButton
                size="small"
                color="info"
                onClick={() => onVerifyEmail(b)}
                disabled={!!actionLoading}
                sx={{ border: "1px solid", borderColor: "info.main", borderRadius: 1.5, p: 0.5 }}
              >
                <EmailIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}

          {isApproved && (
            <Tooltip title="Manage module permissions">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onPermissions(b)}
                sx={{ border: "1px solid", borderColor: "primary.main", borderRadius: 1.5, p: 0.5 }}
              >
                <PermissionsIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Delete builder permanently">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(b)}
              sx={{ border: "1px solid", borderColor: alpha("#dc2626", 0.4), borderRadius: 1.5, p: 0.5 }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Permissions preview (approved only) */}
      {isApproved && b.permissions.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mr: 0.5 }}>
              Modules:
            </Typography>
            {b.permissions.map((p) => (
              <Chip key={p} label={p} size="small" sx={{ fontSize: "0.55rem", height: 18, fontWeight: 600 }} />
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
}
