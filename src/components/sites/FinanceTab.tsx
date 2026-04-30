"use client";

import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useState } from "react";
import {
  Add as AddIcon,
  AddPhotoAlternate as AddPhotoIcon,
  ArrowDownward as IncomeIcon,
  ArrowUpward as ExpenseIcon,
  Close as CloseIcon,
  MenuBook as CashBookIcon,
  Receipt as ReceiptIcon,
  ReceiptLong as ReceiptLongIcon,
  Search as SearchIcon,
  SwapVert as BalanceIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ImageList,
  ImageListItem,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN, formatINRFull } from "@/utils/format";
import { ACCENT } from "@/styles/tokens";

interface Transaction {
  _id: string;
  type: "Income" | "Expense";
  amount: number;
  category: string;
  description: string;
  paymentMode?: string;
  date: string;
  siteId?: { _id: string; name: string };
  receiptUrls?: string[];
}

const CATEGORIES = [
  "Material cost", "Labour wage", "Fuel", "Electricity",
  "Machinery rent", "Water", "Client Payment", "Other",
];
const PAYMENT_MODES = ["Cash", "UPI", "Bank", "Cheque", "Other"];
const MAX_RECEIPTS = 5;
const MAX_MB = 5;

type FilterType = "All" | "Income" | "Expense";
const FILTERS: FilterType[] = ["All", "Income", "Expense"];
const FILTER_COLORS: Record<FilterType, string> = {
  All: ACCENT.success,
  Income: ACCENT.success,
  Expense: ACCENT.error,
};

export default function FinanceTab({ siteId }: { siteId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("All");
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const [form, setForm] = useState({
    type: "Expense" as "Expense" | "Income",
    amount: "",
    category: "Other",
    description: "",
    paymentMode: "Cash" as (typeof PAYMENT_MODES)[number],
    date: new Date().toISOString().substring(0, 10),
  });
  const [receipts, setReceipts] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(apiEndpoints.finance.base);
      const siteData = response.data.data.filter(
        (t: Transaction) => t.siteId?._id === siteId
      );
      setTransactions(siteData);
    } catch {
      toast.error("Failed to load financial records");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const urls = receipts.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [receipts]);

  const pickReceipts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
        toast.error(`${f.name}: not an image/PDF`); continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name}: over ${MAX_MB}MB`); continue;
      }
      valid.push(f);
    }
    const combined = [...receipts, ...valid].slice(0, MAX_RECEIPTS);
    if (receipts.length + valid.length > MAX_RECEIPTS)
      toast(`Max ${MAX_RECEIPTS} receipts per entry`, { icon: "⚠️" });
    setReceipts(combined);
    e.target.value = "";
  };

  const removeReceipt = (i: number) =>
    setReceipts((prev) => prev.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setForm({
      type: "Expense", amount: "", category: "Other",
      description: "", paymentMode: "Cash",
      date: new Date().toISOString().substring(0, 10),
    });
    setReceipts([]);
    setPreviews([]);
  };

  const handleSubmit = async () => {
    if (!form.amount || !form.category) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("type", form.type);
      fd.append("amount", String(form.amount));
      fd.append("category", form.category);
      fd.append("description", form.description);
      fd.append("paymentMode", form.paymentMode);
      fd.append("date", form.date);
      fd.append("siteId", siteId);
      receipts.forEach((f) => fd.append("receipts", f));
      await api.post(apiEndpoints.finance.base, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: [(data, headers) => {
          if (headers) delete (headers as Record<string, unknown>)["Content-Type"];
          return data;
        }],
      });
      toast.success("Transaction recorded");
      setOpenDialog(false);
      resetForm();
      fetchData();
    } catch {
      toast.error("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((a, c) => a + c.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "Expense")
    .reduce((a, c) => a + c.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const filtered = transactions.filter((t) => {
    if (filter !== "All" && t.type !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.category.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.paymentMode || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isImage = (url: string) => !url.toLowerCase().endsWith(".pdf");

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      {/* ── Finance Summary ───────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5, mb: 3, borderRadius: 3,
          border: "1px solid", borderColor: "grey.200",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="subtitle1" fontWeight={800} mb={2.5}>
          Finance Summary
        </Typography>
        <Stack direction="row" justifyContent="space-around" alignItems="flex-start" flexWrap="wrap" gap={1.5}>
          {/* Total Income */}
          <Box textAlign="center" minWidth={64}>
            <Box sx={{
              width: 32, height: 32, borderRadius: "50%",
              bgcolor: alpha(ACCENT.success, 0.15),
              display: "flex", alignItems: "center", justifyContent: "center",
              mx: "auto", mb: 0.75,
            }}>
              <IncomeIcon sx={{ color: ACCENT.success, fontSize: 16 }} />
            </Box>
            <Typography variant="body2" fontWeight={800} color={ACCENT.success} lineHeight={1.3}>
              ₹{totalIncome.toLocaleString("en-IN")}
            </Typography>
            <Typography variant="caption" color="text.secondary" lineHeight={1.3} display="block">
              Total Income
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

          {/* Total Expense */}
          <Box textAlign="center" minWidth={64}>
            <Box sx={{
              width: 32, height: 32, borderRadius: "50%",
              bgcolor: alpha(ACCENT.error, 0.12),
              display: "flex", alignItems: "center", justifyContent: "center",
              mx: "auto", mb: 0.75,
            }}>
              <ExpenseIcon sx={{ color: ACCENT.error, fontSize: 16 }} />
            </Box>
            <Typography variant="body2" fontWeight={800} color={ACCENT.error} lineHeight={1.3}>
              ₹{totalExpense.toLocaleString("en-IN")}
            </Typography>
            <Typography variant="caption" color="text.secondary" lineHeight={1.3} display="block">
              Total Expense
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

          {/* Net Balance */}
          <Box textAlign="center" minWidth={64}>
            <Box sx={{
              width: 32, height: 32, borderRadius: "50%",
              bgcolor: alpha(netBalance >= 0 ? ACCENT.success : ACCENT.error, 0.12),
              display: "flex", alignItems: "center", justifyContent: "center",
              mx: "auto", mb: 0.75,
            }}>
              <BalanceIcon sx={{ color: netBalance >= 0 ? ACCENT.success : ACCENT.error, fontSize: 16 }} />
            </Box>
            <Typography
              variant="body2" fontWeight={800} lineHeight={1.3}
              color={netBalance >= 0 ? ACCENT.success : ACCENT.error}
            >
              {netBalance >= 0 ? "+" : "−"}₹{Math.abs(netBalance).toLocaleString("en-IN")}
            </Typography>
            <Typography variant="caption" color="text.secondary" lineHeight={1.3} display="block">
              Net Balance
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* ── Toolbar ───────────────────────────────────────── */}
      <Stack spacing={1.5} sx={{ mb: 2.5 }}>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search category, notes, mode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch("")} edge="end">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
        />

        {/* Filter chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Chip
                key={f}
                label={f}
                onClick={() => setFilter(f)}
                size="medium"
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 0.5,
                  ...(active
                    ? {
                        bgcolor: FILTER_COLORS[f],
                        color: "#fff",
                        border: "1.5px solid transparent",
                        "&:hover": { bgcolor: FILTER_COLORS[f], opacity: 0.9 },
                      }
                    : {
                        bgcolor: "transparent",
                        border: "1.5px solid",
                        borderColor:
                          f === "Income" ? ACCENT.success
                          : f === "Expense" ? ACCENT.error
                          : "grey.400",
                        color:
                          f === "Income" ? ACCENT.success
                          : f === "Expense" ? ACCENT.error
                          : "text.secondary",
                        "&:hover": { bgcolor: alpha(FILTER_COLORS[f], 0.06) },
                      }),
                }}
              />
            );
          })}
        </Stack>

        {/* Action row: count + Print + Add Entry */}
        <Stack direction="row" spacing={1} alignItems="stretch">
          <Box
            sx={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 0.5, px: 1.5, borderRadius: 2,
              bgcolor: alpha(ACCENT.info, 0.1),
              border: "1px solid", borderColor: alpha(ACCENT.info, 0.3),
              flexShrink: 0, minWidth: 72,
            }}
          >
            <Typography variant="body2" fontWeight={800} color={ACCENT.info}>
              {filtered.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">entries</Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<CashBookIcon />}
            onClick={() => window.open(`/admin/sites/${siteId}/cashbook/print`, "_blank", "noopener")}
            size="medium"
            sx={{ borderRadius: 2, fontWeight: 700, flex: 1, whiteSpace: "nowrap" }}
          >
            Print
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            size="medium"
            sx={{ borderRadius: 2, fontWeight: 700, flex: 1, whiteSpace: "nowrap" }}
          >
            Add Entry
          </Button>
        </Stack>
      </Stack>

      {/* ── Transaction Cards ─────────────────────────────── */}
      {filtered.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4, textAlign: "center", borderRadius: 3,
            border: "1px dashed", borderColor: "grey.300",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No{filter !== "All" ? ` ${filter}` : ""} transactions for this site.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((t) => {
            const isIncome = t.type === "Income";
            const accentColor = isIncome ? ACCENT.success : ACCENT.error;
            return (
              <Paper
                key={t._id}
                elevation={0}
                sx={{
                  p: 1.25,
                  borderRadius: 2.5,
                  border: "1px solid",
                  borderColor: alpha(accentColor, 0.25),
                  bgcolor: alpha(accentColor, 0.05),
                  borderLeft: "4px solid",
                  borderLeftColor: accentColor,
                  transition: "box-shadow 0.15s",
                  "&:hover": { boxShadow: `0 2px 12px ${alpha(accentColor, 0.15)}` },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.25}>
                  <Box flex={1} pr={1}>
                    <Typography variant="body2" fontWeight={700} color="text.primary" lineHeight={1.4}>
                      {t.category}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.paymentMode || "—"}
                    </Typography>
                  </Box>
                  <Box textAlign="right" flexShrink={0}>
                    <Typography variant="body2" fontWeight={800} color={accentColor} lineHeight={1.4}>
                      {isIncome ? "+" : "−"} {formatINRFull(t.amount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateIN(t.date)}
                    </Typography>
                  </Box>
                </Stack>

                {(t.description || (t.receiptUrls && t.receiptUrls.length > 0)) && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ fontStyle: "italic", flex: 1, pr: 1 }}>
                      {t.description || ""}
                    </Typography>
                    {t.receiptUrls && t.receiptUrls.length > 0 && (
                      <Tooltip title={`${t.receiptUrls.length} receipt${t.receiptUrls.length > 1 ? "s" : ""}`}>
                        <Stack
                          direction="row" alignItems="center" spacing={0.5}
                          onClick={() => setLightbox({ images: t.receiptUrls!, index: 0 })}
                          sx={{ cursor: "pointer", color: accentColor, "&:hover": { opacity: 0.75 } }}
                        >
                          <ReceiptLongIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption" fontWeight={700}>×{t.receiptUrls.length}</Typography>
                        </Stack>
                      </Tooltip>
                    )}
                  </Stack>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* ── Add Entry Dialog ──────────────────────────────── */}
      <Dialog open={openDialog} onClose={() => !submitting && setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Record Transaction</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select size="small" label="Type" fullWidth
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "Expense" | "Income" })}>
              <MenuItem value="Expense">Expense (Payment Out)</MenuItem>
              <MenuItem value="Income">Income (Payment In)</MenuItem>
            </TextField>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField size="small" label="Amount (₹) *" type="number" fullWidth
                inputProps={{ inputMode: "decimal" }}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <TextField select size="small" label="Category *" fullWidth
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField select size="small" label="Payment Mode" fullWidth
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value as typeof form.paymentMode })}>
                {PAYMENT_MODES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
              <TextField size="small" label="Date" type="date" fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Stack>
            <TextField label="Notes" size="small" fullWidth multiline rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {/* Receipts */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Receipts{" "}
                  <Typography component="span" variant="caption" color="text.secondary">
                    ({receipts.length}/{MAX_RECEIPTS}, ≤{MAX_MB}MB each)
                  </Typography>
                </Typography>
                <Button component="label" size="small" startIcon={<AddPhotoIcon />}
                  disabled={receipts.length >= MAX_RECEIPTS}
                  sx={{ textTransform: "none", fontWeight: 700 }}>
                  Add
                  <input hidden type="file" accept="image/*,application/pdf"
                    multiple capture="environment" onChange={pickReceipts} />
                </Button>
              </Stack>
              {previews.length > 0 ? (
                <ImageList cols={3} gap={6} sx={{
                  m: 0,
                  gridTemplateColumns: {
                    xs: "repeat(3, 1fr) !important",
                    sm: "repeat(4, 1fr) !important",
                  },
                }}>
                  {previews.map((src, i) => {
                    const isPdf = receipts[i]?.type === "application/pdf";
                    return (
                      <ImageListItem key={src} sx={{
                        position: "relative", borderRadius: 2, overflow: "hidden",
                        aspectRatio: "1 / 1", border: "1px solid", borderColor: "grey.200",
                        bgcolor: isPdf ? "grey.100" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        "& img": { width: "100%", height: "100%", objectFit: "cover" },
                      }}>
                        {isPdf ? (
                          <Box sx={{ textAlign: "center", p: 1 }}>
                            <ReceiptIcon sx={{ fontSize: 24 }} />
                            <Typography variant="caption" display="block" sx={{ fontSize: 9, fontWeight: 700 }}>PDF</Typography>
                          </Box>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={`receipt ${i + 1}`} />
                        )}
                        <IconButton size="small" onClick={() => removeReceipt(i)}
                          sx={{
                            position: "absolute", top: 2, right: 2,
                            bgcolor: "rgba(0,0,0,0.55)", color: "#fff",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                          }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </ImageListItem>
                    );
                  })}
                </ImageList>
              ) : (
                <Box sx={{
                  p: 2, textAlign: "center", border: "1px dashed",
                  borderColor: "grey.300", borderRadius: 2, color: "text.secondary",
                }}>
                  <Typography variant="caption">Attach bill photos or PDF (optional)</Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setOpenDialog(false); resetForm(); }} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || !form.amount}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : "Record"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Lightbox ──────────────────────────────────────── */}
      <Dialog open={Boolean(lightbox)} onClose={() => setLightbox(null)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.92)", boxShadow: "none" } }}>
        <Box sx={{ position: "relative", minHeight: { xs: "60vh", md: "80vh" } }}>
          <IconButton onClick={() => setLightbox(null)}
            sx={{ position: "absolute", top: 8, right: 8, color: "#fff", zIndex: 2, bgcolor: "rgba(255,255,255,0.1)" }}>
            <CloseIcon />
          </IconButton>
          {lightbox && (() => {
            const url = lightbox.images[lightbox.index];
            if (isImage(url)) return (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={`receipt ${lightbox.index + 1}`}
                style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }} />
            );
            return (
              <Box sx={{ p: 6, textAlign: "center", color: "#fff" }}>
                <ReceiptIcon sx={{ fontSize: 64 }} />
                <Typography variant="h6" sx={{ mt: 2 }}>PDF Receipt</Typography>
                <Button variant="contained" sx={{ mt: 2 }}
                  onClick={() => window.open(url, "_blank", "noopener")}>
                  Open PDF
                </Button>
              </Box>
            );
          })()}
          {lightbox && lightbox.images.length > 1 && (
            <Typography variant="caption" sx={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              color: "#fff", bgcolor: "rgba(0,0,0,0.5)", px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 700,
            }}>
              {lightbox.index + 1} / {lightbox.images.length}
            </Typography>
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
