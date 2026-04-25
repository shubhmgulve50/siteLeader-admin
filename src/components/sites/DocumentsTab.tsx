"use client";

import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useState } from "react";
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  OpenInNew as OpenIcon,
  FilterList as FilterIcon,
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
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN } from "@/utils/format";

type Category = "DRAWING" | "CONTRACT" | "APPROVAL" | "INVOICE" | "PHOTO" | "REPORT" | "OTHER";

interface SiteDocument {
  _id: string;
  siteId: string;
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
  category: Category;
  description?: string;
  uploadedBy?: { _id: string; name: string };
  createdAt: string;
}

const CATEGORIES: { value: Category; label: string; color: "default" | "info" | "secondary" | "success" | "warning" | "primary" | "error" }[] = [
  { value: "DRAWING", label: "Drawing", color: "info" },
  { value: "CONTRACT", label: "Contract", color: "secondary" },
  { value: "APPROVAL", label: "Approval", color: "success" },
  { value: "INVOICE", label: "Invoice", color: "warning" },
  { value: "PHOTO", label: "Photo", color: "primary" },
  { value: "REPORT", label: "Report", color: "default" },
  { value: "OTHER", label: "Other", color: "default" },
];

const MAX_MB = 20;

const formatSize = (bytes?: number): string => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const iconFor = (mimeType?: string) => {
  if (!mimeType) return <FileIcon />;
  if (mimeType.startsWith("image/")) return <ImageIcon />;
  if (mimeType === "application/pdf") return <PdfIcon />;
  return <FileIcon />;
};

export default function DocumentsTab({ siteId }: { siteId: string }) {
  const [docs, setDocs] = useState<SiteDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | Category>("ALL");

  const [openUpload, setOpenUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "DRAWING" as Category,
    description: "",
  });
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(apiEndpoints.siteDocuments.base, { params: { siteId } });
      setDocs(res.data.data || []);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`File over ${MAX_MB}MB`);
      return;
    }
    setFile(f);
    setForm((prev) => ({ ...prev, name: prev.name || f.name }));
    setOpenUpload(true);
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("siteId", siteId);
      fd.append("name", form.name || file.name);
      fd.append("category", form.category);
      if (form.description) fd.append("description", form.description);
      await api.post(apiEndpoints.siteDocuments.base, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: [(data, headers) => {
          if (headers) delete (headers as Record<string, unknown>)["Content-Type"];
          return data;
        }],
      });
      toast.success("Document uploaded");
      setOpenUpload(false);
      setFile(null);
      setForm({ name: "", category: "DRAWING", description: "" });
      fetchDocs();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api.delete(apiEndpoints.siteDocuments.byId(id));
      toast.success("Deleted");
      fetchDocs();
    } catch {
      toast.error("Delete failed");
    }
  };

  const openDoc = (d: SiteDocument) => {
    if (d.mimeType?.startsWith("image/")) {
      setLightbox(d.url);
    } else {
      window.open(d.url, "_blank", "noopener");
    }
  };

  const filtered = filter === "ALL" ? docs : docs.filter((d) => d.category === filter);

  const counts: Record<string, number> = { ALL: docs.length };
  CATEGORIES.forEach((c) => {
    counts[c.value] = docs.filter((d) => d.category === c.value).length;
  });

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Site Documents
        </Typography>
        <Button
          component="label"
          variant="contained"
          startIcon={<UploadIcon />}
          sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
        >
          Upload Document
          <input hidden type="file" accept="image/*,application/pdf" onChange={pickFile} />
        </Button>
      </Stack>

      {/* Filter */}
      <Box sx={{ mb: 2, overflowX: "auto", pb: 1 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => v && setFilter(v)}
          size="small"
          sx={{ flexWrap: "nowrap", "& .MuiToggleButton-root": { whiteSpace: "nowrap", px: 1.5 } }}
        >
          <ToggleButton value="ALL">
            <FilterIcon fontSize="small" sx={{ mr: 0.5 }} />
            All ({counts.ALL})
          </ToggleButton>
          {CATEGORIES.map((c) => (
            <ToggleButton key={c.value} value={c.value} disabled={counts[c.value] === 0}>
              {c.label} ({counts[c.value]})
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {filtered.length === 0 ? (
        <Box
          sx={{
            p: 4,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "grey.300",
            borderRadius: 3,
            color: "text.secondary",
          }}
        >
          <FileIcon sx={{ fontSize: 48, opacity: 0.5 }} />
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
            No documents {filter !== "ALL" ? `in "${filter}" category` : "yet"}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((d) => {
            const meta = CATEGORIES.find((c) => c.value === d.category) ?? CATEGORIES[6];
            const isImage = d.mimeType?.startsWith("image/");
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={d._id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: "grey.200",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
                  }}
                >
                  <Box
                    sx={{
                      aspectRatio: "16 / 9",
                      bgcolor: "grey.100",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      overflow: "hidden",
                      "& img": { width: "100%", height: "100%", objectFit: "cover" },
                    }}
                    onClick={() => openDoc(d)}
                  >
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.url} alt={d.name} loading="lazy" />
                    ) : (
                      <Box sx={{ color: "text.secondary", fontSize: 48 }}>
                        {iconFor(d.mimeType)}
                      </Box>
                    )}
                  </Box>
                  <CardContent sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Chip label={meta.label} size="small" color={meta.color} sx={{ fontWeight: 700 }} />
                      <Typography variant="caption" color="text.disabled">
                        {formatSize(d.size)}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, wordBreak: "break-word" }}>
                      {d.name}
                    </Typography>
                    {d.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        {d.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.disabled" sx={{ mt: "auto", pt: 1 }}>
                      {formatDateIN(d.createdAt)}
                      {d.uploadedBy?.name && ` • ${d.uploadedBy.name}`}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                      <Tooltip title="Open">
                        <IconButton size="small" color="primary" onClick={() => openDoc(d)}>
                          <OpenIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => remove(d._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Upload dialog */}
      <Dialog open={openUpload} onClose={() => !uploading && setOpenUpload(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Upload Document</DialogTitle>
        <DialogContent>
          {file && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "grey.50",
                border: "1px solid",
                borderColor: "grey.200",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box sx={{ fontSize: 32, color: "primary.main", display: "flex" }}>
                {iconFor(file.type)}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: "break-word" }}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatSize(file.size)}
                </Typography>
              </Box>
            </Box>
          )}
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Display Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
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
            <TextField
              fullWidth
              size="small"
              label="Description (optional)"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setOpenUpload(false);
              setFile(null);
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? <CircularProgress size={18} color="inherit" /> : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image lightbox */}
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
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
              zIndex: 2,
              bgcolor: "rgba(255,255,255,0.1)",
            }}
          >
            <DeleteIcon sx={{ display: "none" }} />
            ✕
          </IconButton>
          {lightbox && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox}
              alt="document"
              style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
