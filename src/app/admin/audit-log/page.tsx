"use client";

import { toast } from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import {
  History as HistoryIcon,
  Add as CreateIcon,
  Edit as UpdateIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Paid as PaymentIcon,
  CompareArrows as TransferIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import {
  Box,
  Chip,
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
import GenericTable from "@/components/common/GenericTable";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";

type Action = "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "PAYMENT" | "TRANSFER" | "LOGIN" | "LOGOUT";

interface Log {
  _id: string;
  userName: string;
  userRole: string;
  action: Action;
  resource: string;
  resourceId?: string;
  summary?: string;
  ip?: string;
  createdAt: string;
}

const ACTION_META: Record<Action, { label: string; color: "primary" | "warning" | "error" | "success" | "info" | "default"; icon: React.ReactNode }> = {
  CREATE: { label: "Create", color: "primary", icon: <CreateIcon fontSize="small" /> },
  UPDATE: { label: "Update", color: "info", icon: <UpdateIcon fontSize="small" /> },
  DELETE: { label: "Delete", color: "error", icon: <DeleteIcon fontSize="small" /> },
  APPROVE: { label: "Approve", color: "success", icon: <ApproveIcon fontSize="small" /> },
  REJECT: { label: "Reject", color: "error", icon: <RejectIcon fontSize="small" /> },
  PAYMENT: { label: "Payment", color: "success", icon: <PaymentIcon fontSize="small" /> },
  TRANSFER: { label: "Transfer", color: "warning", icon: <TransferIcon fontSize="small" /> },
  LOGIN: { label: "Login", color: "default", icon: <LoginIcon fontSize="small" /> },
  LOGOUT: { label: "Logout", color: "default", icon: <LogoutIcon fontSize="small" /> },
};

const RESOURCES = ["Site", "Transaction", "Invoice", "RaBill", "Quotation", "Vendor", "Material", "Labour", "Equipment", "Milestone", "Document"];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "ALL" as "ALL" | Action,
    resource: "ALL",
    from: "",
    to: "",
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "200" };
      if (filters.action !== "ALL") params.action = filters.action;
      if (filters.resource !== "ALL") params.resource = filters.resource;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await api.get(apiEndpoints.auditLogs.base, { params });
      setLogs(res.data.data || []);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const stats = useMemo(() => {
    const byAction: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    logs.forEach((l) => {
      byAction[l.action] = (byAction[l.action] || 0) + 1;
      byUser[l.userName || "Unknown"] = (byUser[l.userName || "Unknown"] || 0) + 1;
    });
    return { byAction, byUser };
  }, [logs]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions
        pageTitle="Audit Log"
        pageIcon={<HistoryIcon />}
        onRefreshAction={fetchLogs}
        actions={[]}
      />

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Action</InputLabel>
              <Select
                label="Action"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value as "ALL" | Action })}
              >
                <MenuItem value="ALL">All actions</MenuItem>
                {(Object.keys(ACTION_META) as Action[]).map((a) => (
                  <MenuItem key={a} value={a}>
                    {ACTION_META[a].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Resource</InputLabel>
              <Select
                label="Resource"
                value={filters.resource}
                onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
              >
                <MenuItem value="ALL">All resources</MenuItem>
                {RESOURCES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </Grid>
        </Grid>

        {/* Quick stats */}
        {logs.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }} useFlexGap>
            {Object.entries(stats.byAction).map(([a, c]) => (
              <Chip
                key={a}
                size="small"
                label={`${ACTION_META[a as Action]?.label || a}: ${c}`}
                color={ACTION_META[a as Action]?.color || "default"}
                sx={{ fontWeight: 700 }}
              />
            ))}
          </Stack>
        )}
      </Paper>

      <GenericTable
        mobileCard
        columns={[
          {
            id: "action",
            label: "Action",
            isPrimaryOnMobile: true,
            render: (v: Action) => (
              <Chip
                icon={ACTION_META[v]?.icon as React.ReactElement}
                label={ACTION_META[v]?.label || v}
                color={ACTION_META[v]?.color || "default"}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            ),
          },
          {
            id: "createdAt",
            label: "When",
            mobileLabel: "When",
            render: (v: string) => (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(v).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </Box>
            ),
          },
          {
            id: "userName",
            label: "User",
            mobileLabel: "User",
            render: (v: string, row: Log) => (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {v || "—"}
                </Typography>
                {row.userRole && (
                  <Typography variant="caption" color="text.secondary">
                    {row.userRole}
                  </Typography>
                )}
              </Box>
            ),
          },
          {
            id: "resource",
            label: "Resource",
            mobileLabel: "Module",
            render: (v: string) => (
              <Chip label={v} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            ),
          },
          {
            id: "summary",
            label: "Summary",
            mobileLabel: "Detail",
            render: (v: string) => v || "—",
          },
          {
            id: "ip",
            label: "IP",
            hiddenOnMobile: true,
            render: (v: string) => (
              <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.disabled" }}>
                {v || "—"}
              </Typography>
            ),
          },
        ]}
        data={logs}
        loading={loading}
        emptyMessage="No audit entries. Actions will appear here as users interact with the app."
      />
    </Box>
  );
}
