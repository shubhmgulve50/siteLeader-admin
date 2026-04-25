"use client";

import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useState } from "react";
import {
  Add as AddIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Close as CloseIcon,
  MenuBook as CashBookIcon,
  ReceiptLong as ReceiptIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import GenericTable from "@/components/common/GenericTable";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN, formatINRFull } from "@/utils/format";
import KpiCard from "@/components/common/KpiCard";
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
  "Material cost",
  "Labour wage",
  "Fuel",
  "Electricity",
  "Machinery rent",
  "Water",
  "Client Payment",
  "Other",
];

const PAYMENT_MODES = ["Cash", "UPI", "Bank", "Cheque", "Other"];
const MAX_RECEIPTS = 5;
const MAX_MB = 5;

export default function FinanceTab({ siteId }: { siteId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const [form, setForm] = useState({
    type: "Expense" as "Expense" | "Income",
    amount: "",
    category: "Other",
    description: "",
    paymentMode: "Cash" as typeof PAYMENT_MODES[number],
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        toast.error(`${f.name}: not an image/PDF`);
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name}: over ${MAX_MB}MB`);
        continue;
      }
      valid.push(f);
    }
    const combined = [...receipts, ...valid].slice(0, MAX_RECEIPTS);
    if (receipts.length + valid.length > MAX_RECEIPTS) {
      toast(`Max ${MAX_RECEIPTS} receipts per entry`, { icon: "⚠️" });
    }
    setReceipts(combined);
    e.target.value = "";
  };

  const removeReceipt = (i: number) => setReceipts((prev) => prev.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setForm({
      type: "Expense",
      amount: "",
      category: "Other",
      description: "",
      paymentMode: "Cash",
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

  const totalExpense = transactions.filter((t) => t.type === "Expense").reduce((a, c) => a + c.amount, 0);
  const totalIncome = transactions.filter((t) => t.type === "Income").reduce((a, c) => a + c.amount, 0);
  const labourExpense = transactions
    .filter((t) => t.type === "Expense" && t.category === "Labour wage")
    .reduce((a, c) => a + c.amount, 0);

  const isImage = (url: string) => !url.toLowerCase().endsWith(".pdf");

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard label="Paid by Client" value={formatINRFull(totalIncome)} color={ACCENT.success} variant="soft" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard label="Total Expenses" value={formatINRFull(totalExpense)} color={ACCENT.error} variant="soft" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard label="Labour Expenses" value={formatINRFull(labourExpense)} color={ACCENT.purple} variant="soft" />
        </Grid>
      </Grid>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Site Cashbook
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="outlined"
            startIcon={<CashBookIcon />}
            onClick={() =>
              window.open(`/admin/sites/${siteId}/cashbook/print`, "_blank", "noopener")
            }
            sx={{ borderRadius: 2, fontWeight: 700, width: { xs: "100%", sm: "auto" } }}
          >
            Print Cash Book
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
          >
            Add Entry
          </Button>
        </Stack>
      </Stack>

      <GenericTable
        mobileCard
        columns={[
          { id: "date", label: "Date", render: (v: string) => formatDateIN(v) },
          { id: "category", label: "Category", isPrimaryOnMobile: true },
          { id: "paymentMode", label: "Mode", mobileLabel: "Mode", render: (v: string) => v || "—" },
          {
            id: "amount",
            label: "Amount",
            align: "right",
            isSecondaryBadge: true,
            render: (v: number, row: Transaction) => (
              <Typography sx={{ fontWeight: 800, color: row.type === "Income" ? "success.main" : "error.main" }}>
                {row.type === "Income" ? "+" : "−"} {formatINRFull(v)}
              </Typography>
            ),
          },
          { id: "description", label: "Notes", mobileLabel: "Notes" },
          {
            id: "receiptUrls",
            label: "Receipt",
            isActionColumn: true,
            render: (v: string[] | undefined) =>
              v && v.length > 0 ? (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title={`${v.length} receipt${v.length > 1 ? "s" : ""}`}>
                    <IconButton
                      size="small"
                      onClick={() => setLightbox({ images: v, index: 0 })}
                      color="primary"
                    >
                      <ReceiptIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    ×{v.length}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="caption" color="text.disabled">—</Typography>
              ),
          },
        ]}
        data={transactions}
        loading={loading}
        emptyMessage="No financial transactions for this site."
      />

      {/* Form */}
      <Dialog
        open={openDialog}
        onClose={() => !submitting && setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Record Transaction</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              size="small"
              label="Type"
              fullWidth
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "Expense" | "Income" })}
            >
              <MenuItem value="Expense">Expense (Payment Out)</MenuItem>
              <MenuItem value="Income">Income (Payment In)</MenuItem>
            </TextField>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                size="small"
                label="Amount (₹) *"
                type="number"
                fullWidth
                inputProps={{ inputMode: "decimal" }}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <TextField
                select
                size="small"
                label="Category *"
                fullWidth
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                size="small"
                label="Payment Mode"
                fullWidth
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value as typeof form.paymentMode })}
              >
                {PAYMENT_MODES.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Stack>
            <TextField
              label="Notes"
              size="small"
              fullWidth
              multiline
              rows={2}
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
                <Button
                  component="label"
                  size="small"
                  startIcon={<AddPhotoIcon />}
                  disabled={receipts.length >= MAX_RECEIPTS}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Add
                  <input
                    hidden
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    capture="environment"
                    onChange={pickReceipts}
                  />
                </Button>
              </Stack>
              {previews.length > 0 ? (
                <ImageList
                  cols={3}
                  gap={6}
                  sx={{
                    m: 0,
                    gridTemplateColumns: {
                      xs: "repeat(3, 1fr) !important",
                      sm: "repeat(4, 1fr) !important",
                    },
                  }}
                >
                  {previews.map((src, i) => {
                    const isPdf = receipts[i]?.type === "application/pdf";
                    return (
                      <ImageListItem
                        key={src}
                        sx={{
                          position: "relative",
                          borderRadius: 2,
                          overflow: "hidden",
                          aspectRatio: "1 / 1",
                          border: "1px solid",
                          borderColor: "grey.200",
                          bgcolor: isPdf ? "grey.100" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          "& img": { width: "100%", height: "100%", objectFit: "cover" },
                        }}
                      >
                        {isPdf ? (
                          <Box sx={{ textAlign: "center", p: 1 }}>
                            <ReceiptIcon sx={{ fontSize: 24 }} />
                            <Typography variant="caption" display="block" sx={{ fontSize: 9, fontWeight: 700 }}>
                              PDF
                            </Typography>
                          </Box>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={`receipt ${i + 1}`} />
                        )}
                        <IconButton
                          size="small"
                          onClick={() => removeReceipt(i)}
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
                    );
                  })}
                </ImageList>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    textAlign: "center",
                    border: "1px dashed",
                    borderColor: "grey.300",
                    borderRadius: 2,
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="caption">Attach bill photos or PDF (optional)</Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setOpenDialog(false);
              resetForm();
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || !form.amount}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : "Record"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox — also handles PDF via open-in-tab */}
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
          {lightbox && (() => {
            const url = lightbox.images[lightbox.index];
            if (isImage(url)) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={`receipt ${lightbox.index + 1}`}
                  style={{
                    width: "100%",
                    maxHeight: "80vh",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              );
            }
            return (
              <Box sx={{ p: 6, textAlign: "center", color: "#fff" }}>
                <ReceiptIcon sx={{ fontSize: 64 }} />
                <Typography variant="h6" sx={{ mt: 2 }}>PDF Receipt</Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => window.open(url, "_blank", "noopener")}
                >
                  Open PDF
                </Button>
              </Box>
            );
          })()}
          {lightbox && lightbox.images.length > 1 && (
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
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
