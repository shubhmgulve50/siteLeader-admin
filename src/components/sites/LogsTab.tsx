"use client";

import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useState } from "react";
import {
  Add as AddIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Close as CloseIcon,
  EventNote as NoteIcon,
  PhotoLibrary as PhotoLibraryIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ImageList,
  ImageListItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";

interface DailyLog {
  _id: string;
  workDone: string;
  issues?: string;
  images?: string[];
  date: string;
  createdBy: { name: string };
  createdAt: string;
}

const MAX_PHOTOS = 10;
const MAX_PHOTO_MB = 5;

export default function LogsTab({ siteId }: { siteId: string }) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    workDone: "",
    issues: "",
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(apiEndpoints.sites.getLogs(siteId));
      setLogs(response.data.data);
    } catch {
      toast.error("Failed to load daily logs");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const handlePickPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name}: not an image`);
        continue;
      }
      if (f.size > MAX_PHOTO_MB * 1024 * 1024) {
        toast.error(`${f.name}: over ${MAX_PHOTO_MB}MB`);
        continue;
      }
      valid.push(f);
    }
    const combined = [...photos, ...valid].slice(0, MAX_PHOTOS);
    if (photos.length + valid.length > MAX_PHOTOS) {
      toast(`Max ${MAX_PHOTOS} photos per log`, { icon: "⚠️" });
    }
    setPhotos(combined);
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setForm({ workDone: "", issues: "" });
    setPhotos([]);
    setPreviews([]);
  };

  const handleSubmit = async () => {
    if (!form.workDone) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("siteId", siteId);
      fd.append("workDone", form.workDone);
      if (form.issues) fd.append("issues", form.issues);
      photos.forEach((f) => fd.append("images", f));

      await api.post(apiEndpoints.sites.logs, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: [(data, headers) => {
          // Let browser set multipart boundary automatically
          if (headers) delete (headers as Record<string, unknown>)["Content-Type"];
          return data;
        }],
      });
      toast.success("Daily log recorded");
      setOpenLogDialog(false);
      resetForm();
      fetchLogs();
    } catch {
      toast.error("Failed to save log");
    } finally {
      setSubmitting(false);
    }
  };

  const openLightbox = (images: string[], index: number) => {
    setLightbox({ images, index });
  };

  const lightboxPrev = () => {
    if (!lightbox) return;
    setLightbox({
      ...lightbox,
      index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length,
    });
  };

  const lightboxNext = () => {
    if (!lightbox) return;
    setLightbox({
      ...lightbox,
      index: (lightbox.index + 1) % lightbox.images.length,
    });
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Daily Progress Reports (DPR)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenLogDialog(true)}
          sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
        >
          Add Daily Log
        </Button>
      </Stack>

      <Stack spacing={2}>
        {logs.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No daily logs found for this site.
          </Typography>
        ) : (
          logs.map((log) => (
            <Card
              key={log._id}
              variant="outlined"
              sx={{ borderRadius: 3, borderColor: "grey.200" }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <NoteIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {new Date(log.date).toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor: "grey.100",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 700,
                      }}
                    >
                      Reported by {log.createdBy?.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        shareOnWhatsApp(
                          `*Daily Log — ${formatDateIN(log.date)}*\nWork: ${log.workDone}${log.issues ? `\nIssues: ${log.issues}` : ""}${log.images && log.images.length ? `\n${log.images.length} photo(s)` : ""}`
                        )
                      }
                      sx={{ color: "#25D366" }}
                    >
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.primary",
                    fontWeight: 500,
                    whiteSpace: "pre-line",
                  }}
                >
                  {log.workDone}
                </Typography>
                {log.issues && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: alpha("#f44336", 0.05),
                      borderRadius: 2,
                      border: "1px dashed",
                      borderColor: alpha("#f44336", 0.3),
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ fontWeight: 800, textTransform: "uppercase" }}
                    >
                      Issues / Constraints
                    </Typography>
                    <Typography
                      variant="body2"
                      color="error.dark"
                      sx={{ fontStyle: "italic" }}
                    >
                      {log.issues}
                    </Typography>
                  </Box>
                )}
                {log.images && log.images.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                      <PhotoLibraryIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {log.images.length} photo{log.images.length > 1 ? "s" : ""}
                      </Typography>
                    </Stack>
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
                      {log.images.map((src, i) => (
                        <ImageListItem
                          key={src + i}
                          sx={{
                            cursor: "pointer",
                            borderRadius: 2,
                            overflow: "hidden",
                            aspectRatio: "1 / 1",
                            "& img": { width: "100%", height: "100%", objectFit: "cover" },
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.02)" },
                          }}
                          onClick={() => openLightbox(log.images!, i)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`log photo ${i + 1}`} loading="lazy" />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* Add Log Dialog */}
      <Dialog
        open={openLogDialog}
        onClose={() => !submitting && setOpenLogDialog(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={typeof window !== "undefined" && window.innerWidth < 600}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Create Daily Log Entry
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Record the execution progress, any issues, and attach photos from site.
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Work Accomplished Today"
              fullWidth
              multiline
              rows={4}
              required
              value={form.workDone}
              onChange={(e) => setForm({ ...form, workDone: e.target.value })}
              placeholder="e.g. Completed foundations for Block A. Plastering started in Hall."
            />
            <TextField
              label="Issues / Escalations (if any)"
              fullWidth
              multiline
              rows={2}
              value={form.issues}
              onChange={(e) => setForm({ ...form, issues: e.target.value })}
              placeholder="e.g. Shortage of sand. Rain delayed the afternoon shift."
            />

            {/* Photos */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Photos <Typography component="span" variant="caption" color="text.secondary">
                    ({photos.length}/{MAX_PHOTOS}, up to {MAX_PHOTO_MB}MB each)
                  </Typography>
                </Typography>
                <Button
                  component="label"
                  size="small"
                  startIcon={<AddPhotoIcon />}
                  disabled={photos.length >= MAX_PHOTOS}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Add photos
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handlePickPhotos}
                  />
                </Button>
              </Stack>
              {previews.length > 0 ? (
                <ImageList
                  cols={4}
                  gap={6}
                  sx={{
                    m: 0,
                    gridTemplateColumns: {
                      xs: "repeat(3, 1fr) !important",
                      sm: "repeat(4, 1fr) !important",
                    },
                  }}
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
                          "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </ImageListItem>
                  ))}
                </ImageList>
              ) : (
                <Box
                  sx={{
                    p: 3,
                    textAlign: "center",
                    border: "1px dashed",
                    borderColor: "grey.300",
                    borderRadius: 2,
                    color: "text.secondary",
                  }}
                >
                  <PhotoLibraryIcon sx={{ fontSize: 32, opacity: 0.5 }} />
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    No photos attached
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setOpenLogDialog(false);
              resetForm();
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !form.workDone}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitting ? "Submitting..." : "Submit Report"}
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
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.images[lightbox.index]}
                alt={`photo ${lightbox.index + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  display: "block",
                }}
              />
              {lightbox.images.length > 1 && (
                <>
                  <Button
                    onClick={lightboxPrev}
                    sx={{
                      position: "absolute",
                      left: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#fff",
                      minWidth: 0,
                      p: 1.5,
                      bgcolor: "rgba(255,255,255,0.1)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                    }}
                  >
                    ‹
                  </Button>
                  <Button
                    onClick={lightboxNext}
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#fff",
                      minWidth: 0,
                      p: 1.5,
                      bgcolor: "rgba(255,255,255,0.1)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                    }}
                  >
                    ›
                  </Button>
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      bottom: 12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      color: "#fff",
                      bgcolor: "rgba(0,0,0,0.5)",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 700,
                    }}
                  >
                    {lightbox.index + 1} / {lightbox.images.length}
                  </Typography>
                </>
              )}
            </>
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
