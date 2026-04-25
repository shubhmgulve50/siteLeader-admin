"use client";

import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useState } from "react";
import {
  Add as AddIcon,
  CheckCircle as DoneIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Flag as FlagIcon,
  PlayCircle as InProgressIcon,
  Block as BlockedIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN } from "@/utils/format";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

interface Milestone {
  _id: string;
  siteId: string;
  title: string;
  description?: string;
  plannedDate?: string;
  completedDate?: string;
  weight: number;
  progress: number;
  status: Status;
  order: number;
}

const STATUS_META: Record<Status, { label: string; color: "success" | "warning" | "error" | "default"; icon: React.ReactNode }> = {
  NOT_STARTED: { label: "Not Started", color: "default", icon: <FlagIcon fontSize="small" /> },
  IN_PROGRESS: { label: "In Progress", color: "warning", icon: <InProgressIcon fontSize="small" /> },
  COMPLETED: { label: "Completed", color: "success", icon: <DoneIcon fontSize="small" /> },
  BLOCKED: { label: "Blocked", color: "error", icon: <BlockedIcon fontSize="small" /> },
};

export default function MilestonesTab({ siteId }: { siteId: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [overall, setOverall] = useState(0);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    plannedDate: "",
    weight: 0,
    progress: 0,
    status: "NOT_STARTED" as Status,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(apiEndpoints.milestones.base, { params: { siteId } });
      setMilestones(res.data.data || []);
      setOverall(res.data.overallProgress || 0);
    } catch {
      toast.error("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      plannedDate: "",
      weight: 0,
      progress: 0,
      status: "NOT_STARTED",
    });
    setOpenForm(true);
  };

  const openEdit = (m: Milestone) => {
    setEditing(m);
    setForm({
      title: m.title,
      description: m.description || "",
      plannedDate: m.plannedDate ? m.plannedDate.substring(0, 10) : "",
      weight: m.weight || 0,
      progress: m.progress || 0,
      status: m.status,
    });
    setOpenForm(true);
  };

  const saveMilestone = async () => {
    if (!form.title) return toast.error("Title required");
    setSubmitting(true);
    try {
      const payload = { ...form, siteId };
      if (editing) {
        await api.put(apiEndpoints.milestones.byId(editing._id), payload);
        toast.success("Milestone updated");
      } else {
        await api.post(apiEndpoints.milestones.base, payload);
        toast.success("Milestone added");
      }
      setOpenForm(false);
      fetchMilestones();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const quickProgress = async (m: Milestone, progress: number) => {
    try {
      await api.put(apiEndpoints.milestones.byId(m._id), { progress });
      fetchMilestones();
    } catch {
      toast.error("Update failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    try {
      await api.delete(apiEndpoints.milestones.byId(id));
      toast.success("Deleted");
      fetchMilestones();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      {/* Overall progress strip */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          borderColor: "grey.200",
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.success.main, 0.05)})`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary" }}>
              Overall Site Progress (weighted)
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: "primary.main", lineHeight: 1 }}>
              {overall}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {milestones.filter((m) => m.status === "COMPLETED").length} / {milestones.length} milestones completed
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Add Milestone
          </Button>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={overall}
          sx={{ mt: 2, height: 10, borderRadius: 5 }}
        />
      </Paper>

      {/* Milestone list */}
      {milestones.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 3,
            borderStyle: "dashed",
            borderColor: "grey.300",
          }}
        >
          <FlagIcon sx={{ fontSize: 48, color: "grey.400" }} />
          <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>
            No milestones yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Break the project into checkpoints (e.g. Excavation, Foundation, RCC, Brickwork, Finishing).
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            Add First Milestone
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {milestones.map((m, idx) => {
            const meta = STATUS_META[m.status];
            return (
              <Card
                key={m._id}
                variant="outlined"
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 3,
                  borderColor: m.status === "COMPLETED" ? "success.light" : "grey.200",
                  borderLeft: "4px solid",
                  borderLeftColor:
                    m.status === "COMPLETED"
                      ? "success.main"
                      : m.status === "IN_PROGRESS"
                        ? "warning.main"
                        : m.status === "BLOCKED"
                          ? "error.main"
                          : "grey.400",
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.disabled", fontWeight: 700 }}>
                        #{idx + 1}
                      </Typography>
                      <Chip
                        icon={meta.icon as React.ReactElement}
                        label={meta.label}
                        size="small"
                        color={meta.color}
                        sx={{ fontWeight: 700 }}
                      />
                      {m.weight > 0 && (
                        <Chip
                          label={`weight ${m.weight}%`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      {m.title}
                    </Typography>
                    {m.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {m.description}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
                      {m.plannedDate && (
                        <Typography variant="caption" color="text.secondary">
                          Planned: <strong>{formatDateIN(m.plannedDate)}</strong>
                        </Typography>
                      )}
                      {m.completedDate && (
                        <Typography variant="caption" color="success.main">
                          ✓ Completed: <strong>{formatDateIN(m.completedDate)}</strong>
                        </Typography>
                      )}
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={m.progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: "grey.200",
                            "& .MuiLinearProgress-bar": {
                              bgcolor:
                                m.progress >= 100
                                  ? "success.main"
                                  : m.status === "BLOCKED"
                                    ? "error.main"
                                    : "primary.main",
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 900, minWidth: 48, textAlign: "right" }}>
                        {m.progress}%
                      </Typography>
                    </Stack>
                    {m.status !== "COMPLETED" && (
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: "wrap" }}>
                        {[25, 50, 75, 100].map((p) => (
                          <Button
                            key={p}
                            size="small"
                            variant="outlined"
                            onClick={() => quickProgress(m, p)}
                            disabled={m.progress === p}
                            sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 11, fontWeight: 700 }}
                          >
                            {p}%
                          </Button>
                        ))}
                      </Stack>
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Stack direction="row" justifyContent={{ xs: "flex-start", md: "flex-end" }} spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => openEdit(m)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => remove(m._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Grid>
                </Grid>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Form dialog */}
      <Dialog open={openForm} onClose={() => !submitting && setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editing ? "Edit Milestone" : "Add Milestone"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Title *"
              placeholder="e.g. Foundation complete"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="Description"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Planned Date"
                InputLabelProps={{ shrink: true }}
                value={form.plannedDate}
                onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                >
                  {(Object.keys(STATUS_META) as Status[]).map((s) => (
                    <MenuItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Progress: {form.progress}%
              </Typography>
              <Slider
                value={form.progress}
                onChange={(_, v) => setForm({ ...form, progress: v as number })}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: "0" },
                  { value: 25, label: "25" },
                  { value: 50, label: "50" },
                  { value: 75, label: "75" },
                  { value: 100, label: "100" },
                ]}
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Weight (importance in overall site %): {form.weight}
              </Typography>
              <Slider
                value={form.weight}
                onChange={(_, v) => setForm({ ...form, weight: v as number })}
                min={0}
                max={100}
                step={5}
                sx={{ mt: 0.5 }}
              />
              <Typography variant="caption" color="text.disabled">
                Overall site % is computed as weighted average of all milestone progress. Leave 0 for equal weighting.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenForm(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveMilestone} disabled={submitting || !form.title}>
            {submitting ? <CircularProgress size={18} color="inherit" /> : editing ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
