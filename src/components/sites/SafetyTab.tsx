"use client";

import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useState } from "react";
import {
  Add as AddIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  HealthAndSafety as SafetyIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN } from "@/utils/format";

type Severity = "NEAR_MISS" | "FIRST_AID" | "MEDICAL" | "LOST_TIME" | "FATAL";
type Category = "FALL" | "STRUCK_BY" | "ELECTRICAL" | "FIRE" | "CHEMICAL" | "MACHINERY" | "HEAT_STROKE" | "OTHER";
type Status = "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";

interface Incident {
  _id: string;
  siteId: string;
  incidentNumber?: string;
  severity: Severity;
  category: Category;
  date: string;
  location?: string;
  personInvolved?: string;
  personRole?: string;
  description: string;
  immediateAction?: string;
  rootCause?: string;
  correctiveAction?: string;
  reportedBy?: string;
  images: string[];
  lostDays?: number;
  status: Status;
  createdAt: string;
}

const SEVERITY_META: Record<Severity, { label: string; color: "default" | "warning" | "info" | "error" | "success" }> = {
  NEAR_MISS: { label: "Near Miss", color: "info" },
  FIRST_AID: { label: "First Aid", color: "warning" },
  MEDICAL: { label: "Medical Treatment", color: "error" },
  LOST_TIME: { label: "Lost Time", color: "error" },
  FATAL: { label: "Fatal", color: "error" },
};

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "FALL", label: "Fall from height" },
  { value: "STRUCK_BY", label: "Struck by object" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "FIRE", label: "Fire" },
  { value: "CHEMICAL", label: "Chemical exposure" },
  { value: "MACHINERY", label: "Machinery" },
  { value: "HEAT_STROKE", label: "Heat stroke" },
  { value: "OTHER", label: "Other" },
];

const STATUS_COLORS: Record<Status, "warning" | "info" | "success" | "default"> = {
  OPEN: "warning",
  INVESTIGATING: "info",
  RESOLVED: "success",
  CLOSED: "default",
};

export default function SafetyTab({ siteId }: { siteId: string }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState({ total: 0, nearMiss: 0, recordable: 0, lostDays: 0, open: 0 });
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    severity: "NEAR_MISS" as Severity,
    category: "OTHER" as Category,
    date: new Date().toISOString().substring(0, 10),
    location: "",
    personInvolved: "",
    personRole: "",
    description: "",
    immediateAction: "",
    rootCause: "",
    correctiveAction: "",
    reportedBy: "",
    lostDays: 0,
    status: "OPEN" as Status,
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(apiEndpoints.safetyIncidents.base, { params: { siteId } });
      setIncidents(res.data.data || []);
      setStats(res.data.stats || { total: 0, nearMiss: 0, recordable: 0, lostDays: 0, open: 0 });
    } catch {
      toast.error("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const pickPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 5 * 1024 * 1024) continue;
      valid.push(f);
    }
    setPhotos((prev) => [...prev, ...valid].slice(0, 6));
    e.target.value = "";
  };

  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setForm({
      severity: "NEAR_MISS",
      category: "OTHER",
      date: new Date().toISOString().substring(0, 10),
      location: "",
      personInvolved: "",
      personRole: "",
      description: "",
      immediateAction: "",
      rootCause: "",
      correctiveAction: "",
      reportedBy: "",
      lostDays: 0,
      status: "OPEN",
    });
    setPhotos([]);
  };

  const handleSave = async () => {
    if (!form.description) return toast.error("Description required");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("siteId", siteId);
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      photos.forEach((f) => fd.append("images", f));

      await api.post(apiEndpoints.safetyIncidents.base, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: [(data, headers) => {
          if (headers) delete (headers as Record<string, unknown>)["Content-Type"];
          return data;
        }],
      });
      toast.success("Incident reported");
      setOpenForm(false);
      resetForm();
      fetchIncidents();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: Status) => {
    try {
      await api.put(apiEndpoints.safetyIncidents.byId(id), { status });
      toast.success(`Status → ${status}`);
      fetchIncidents();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this incident?")) return;
    try {
      await api.delete(apiEndpoints.safetyIncidents.byId(id));
      toast.success("Deleted");
      fetchIncidents();
    } catch {
      toast.error("Delete failed");
    }
  };

  const daysSinceLast = incidents[0]
    ? Math.floor((Date.now() - new Date(incidents[0].date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) return <CircularProgress />;

  return (
    <Box>
      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 3,
              borderColor: alpha("#16a34a", 0.3),
              bgcolor: alpha("#16a34a", 0.05),
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#16a34a", textTransform: "uppercase" }}>
              Days Safe
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: "#16a34a", lineHeight: 1 }}>
              {daysSinceLast != null ? daysSinceLast : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Since last incident
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "info.main", textTransform: "uppercase" }}>
              Near Miss
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: "info.main", lineHeight: 1 }}>
              {stats.nearMiss}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "error.main", textTransform: "uppercase" }}>
              Recordable
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: "error.main", lineHeight: 1 }}>
              {stats.recordable}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lost days: {stats.lostDays}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "warning.main", textTransform: "uppercase" }}>
              Open Items
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: "warning.main", lineHeight: 1 }}>
              {stats.open}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Safety Incidents
        </Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
          sx={{ borderRadius: 2, fontWeight: 700, width: { xs: "100%", sm: "auto" } }}
        >
          Report Incident
        </Button>
      </Stack>

      {/* Incident list */}
      {incidents.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ p: 5, textAlign: "center", borderRadius: 3, borderStyle: "dashed" }}
        >
          <SafetyIcon sx={{ fontSize: 48, color: "success.main" }} />
          <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>
            No incidents reported
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keep it that way. Report near-misses too — prevents bigger accidents.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {incidents.map((inc) => {
            const meta = SEVERITY_META[inc.severity];
            return (
              <Card
                key={inc._id}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderLeft: "4px solid",
                  borderLeftColor:
                    meta.color === "error" ? "error.main" : meta.color === "warning" ? "warning.main" : "info.main",
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "flex-start", md: "center" }}
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 800, color: "text.disabled" }}>
                        {inc.incidentNumber || "—"}
                      </Typography>
                      <Chip label={meta.label} color={meta.color} size="small" sx={{ fontWeight: 700 }} />
                      <Chip label={CATEGORIES.find((c) => c.value === inc.category)?.label || inc.category} size="small" variant="outlined" />
                      <Chip label={inc.status} color={STATUS_COLORS[inc.status]} size="small" sx={{ fontWeight: 700 }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDateIN(inc.date)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      {inc.status !== "CLOSED" && (
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={inc.status}
                            onChange={(e) => updateStatus(inc._id, e.target.value as Status)}
                          >
                            <MenuItem value="OPEN">Open</MenuItem>
                            <MenuItem value="INVESTIGATING">Investigating</MenuItem>
                            <MenuItem value="RESOLVED">Resolved</MenuItem>
                            <MenuItem value="CLOSED">Closed</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                      <IconButton size="small" color="error" onClick={() => handleDelete(inc._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, whiteSpace: "pre-line" }}>
                    {inc.description}
                  </Typography>

                  <Grid container spacing={1}>
                    {inc.location && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Location:</strong> {inc.location}
                        </Typography>
                      </Grid>
                    )}
                    {inc.personInvolved && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Person:</strong> {inc.personInvolved}
                          {inc.personRole && ` (${inc.personRole})`}
                        </Typography>
                      </Grid>
                    )}
                    {inc.immediateAction && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Immediate action:</strong> {inc.immediateAction}
                        </Typography>
                      </Grid>
                    )}
                    {inc.rootCause && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Root cause:</strong> {inc.rootCause}
                        </Typography>
                      </Grid>
                    )}
                    {inc.correctiveAction && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Corrective action:</strong> {inc.correctiveAction}
                        </Typography>
                      </Grid>
                    )}
                    {(inc.lostDays || 0) > 0 && (
                      <Grid size={{ xs: 12 }}>
                        <Chip
                          icon={<WarningIcon />}
                          label={`${inc.lostDays} lost days`}
                          color="error"
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>
                    )}
                  </Grid>

                  {inc.images && inc.images.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <ImageList
                        cols={4}
                        gap={6}
                        sx={{
                          m: 0,
                          gridTemplateColumns: {
                            xs: "repeat(3, 1fr) !important",
                            sm: "repeat(4, 1fr) !important",
                            md: "repeat(6, 1fr) !important",
                          },
                        }}
                      >
                        {inc.images.map((src, i) => (
                          <ImageListItem
                            key={src + i}
                            sx={{
                              cursor: "pointer",
                              borderRadius: 2,
                              overflow: "hidden",
                              aspectRatio: "1 / 1",
                              "& img": { width: "100%", height: "100%", objectFit: "cover" },
                            }}
                            onClick={() => setLightbox({ images: inc.images, index: i })}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`incident ${i + 1}`} loading="lazy" />
                          </ImageListItem>
                        ))}
                      </ImageList>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Form dialog */}
      <Dialog open={openForm} onClose={() => !submitting && setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "error.main", color: "white" }}>
          <Typography variant="h6" fontWeight={800}>
            Report Safety Incident
          </Typography>
          <IconButton onClick={() => setOpenForm(false)} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity *</InputLabel>
                <Select
                  label="Severity *"
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}
                >
                  {(Object.keys(SEVERITY_META) as Severity[]).map((s) => (
                    <MenuItem key={s} value={s}>
                      {SEVERITY_META[s].label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                >
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date *"
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Location on Site"
                placeholder="e.g. 2nd floor east wing"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Person Involved"
                value={form.personInvolved}
                onChange={(e) => setForm({ ...form, personInvolved: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Role"
                placeholder="Mason, Helper..."
                value={form.personRole}
                onChange={(e) => setForm({ ...form, personRole: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="What happened? *"
                required
                multiline
                minRows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Immediate Action Taken"
                multiline
                minRows={2}
                value={form.immediateAction}
                onChange={(e) => setForm({ ...form, immediateAction: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Root Cause (if known)"
                multiline
                minRows={2}
                value={form.rootCause}
                onChange={(e) => setForm({ ...form, rootCause: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Corrective Action"
                multiline
                minRows={2}
                value={form.correctiveAction}
                onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Lost Days"
                value={form.lostDays}
                onChange={(e) => setForm({ ...form, lostDays: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Reported By"
                value={form.reportedBy}
                onChange={(e) => setForm({ ...form, reportedBy: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                >
                  <MenuItem value="OPEN">Open</MenuItem>
                  <MenuItem value="INVESTIGATING">Investigating</MenuItem>
                  <MenuItem value="RESOLVED">Resolved</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Photos ({photos.length}/6)
                </Typography>
                <Button
                  component="label"
                  size="small"
                  startIcon={<AddPhotoIcon />}
                  disabled={photos.length >= 6}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Add
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={pickPhotos}
                  />
                </Button>
              </Stack>
              {previews.length > 0 && (
                <ImageList
                  cols={4}
                  gap={6}
                  sx={{ m: 0, gridTemplateColumns: { xs: "repeat(3, 1fr) !important", sm: "repeat(6, 1fr) !important" } }}
                >
                  {previews.map((src, i) => (
                    <ImageListItem
                      key={src}
                      sx={{
                        position: "relative",
                        borderRadius: 2,
                        overflow: "hidden",
                        aspectRatio: "1 / 1",
                        "& img": { width: "100%", height: "100%", objectFit: "cover" },
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`preview ${i + 1}`} />
                      <IconButton
                        size="small"
                        onClick={() => removePhoto(i)}
                        sx={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          bgcolor: "rgba(0,0,0,0.55)",
                          color: "#fff",
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenForm(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSave}
            disabled={submitting || !form.description}
            sx={{ px: 4 }}
          >
            {submitting ? <CircularProgress size={18} color="inherit" /> : "Submit Report"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox */}
      <Dialog
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.92)", boxShadow: "none" } }}
      >
        <Box sx={{ position: "relative", minHeight: { xs: "60vh", md: "80vh" } }}>
          <IconButton
            onClick={() => setLightbox(null)}
            sx={{ position: "absolute", top: 8, right: 8, color: "#fff", zIndex: 2, bgcolor: "rgba(255,255,255,0.1)" }}
          >
            <CloseIcon />
          </IconButton>
          {lightbox && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox.images[lightbox.index]}
              alt={`incident ${lightbox.index + 1}`}
              style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
