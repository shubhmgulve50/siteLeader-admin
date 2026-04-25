"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  AccountBalance,
  Add as AddIcon,
  AddPhotoAlternate as AddPhotoIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ReceiptLong as ReceiptIcon,
  TrendingDown,
  TrendingUp,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
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
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import GenericTable from "@/components/common/GenericTable";
import GlassFab from "@/components/common/GlassFab";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { useT } from "@/i18n/LocaleProvider";
import KpiCard from "@/components/common/KpiCard";
import { ACCENT, HEADER_BTN_SX } from "@/styles/tokens";

interface Site {
  _id: string;
  name: string;
}

interface Transaction {
  _id: string;
  type: "Income" | "Expense";
  amount: number;
  category: string;
  siteId: Site | null;
  description: string;
  paymentMode?: string;
  receiptUrls?: string[];
  approvalStatus?: "AUTO_APPROVED" | "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdBy?: { _id: string; name: string };
  date: string;
  createdAt: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface User {
  _id: string;
  role: string;
  name: string;
}

const CATEGORIES = [
  "Client Payment",
  "Material Cost",
  "Labour Wage",
  "Fuel",
  "Office Rent",
  "Marketing",
  "Other",
];

export default function FinancePage() {
  const t = useT();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [filterType, setFilterType] = useState<"all" | "Income" | "Expense" | "PENDING">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    type: "Expense",
    amount: "",
    category: "Material Cost",
    siteId: "",
    description: "",
    paymentMode: "Cash",
    date: new Date().toISOString().split("T")[0],
  });
  const [newReceipts, setNewReceipts] = useState<File[]>([]);
  const [newReceiptPreviews, setNewReceiptPreviews] = useState<string[]>([]);
  const [existingReceipts, setExistingReceipts] = useState<string[]>([]);
  const [removeUrls, setRemoveUrls] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const [userRole, setUserRole] = useState<string>("");
  const [rejectDialog, setRejectDialog] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    api
      .get(apiEndpoints.adminProfile)
      .then((r) => setUserRole(r.data.data.role))
      .catch(() => {});
  }, []);

  const isBuilderRole = userRole === "BUILDER" || userRole === "SUPER_ADMIN";

  const handleApprove = async (id: string) => {
    try {
      await api.post(apiEndpoints.finance.approve(id));
      toast.success("Approved");
      fetchData();
    } catch {
      toast.error("Approval failed");
    }
  };

  const submitReject = async () => {
    if (!rejectDialog) return;
    try {
      await api.post(apiEndpoints.finance.reject(rejectDialog._id), { reason: rejectReason });
      toast.success("Rejected");
      setRejectDialog(null);
      setRejectReason("");
      fetchData();
    } catch {
      toast.error("Rejection failed");
    }
  };

  const checkUser = async () => {
    try {
      const response = await api.get(apiEndpoints.adminProfile);
      setUser(response.data.data);
    } catch {
      /* Handle silently */
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, siteRes] = await Promise.all([
        api.get(apiEndpoints.finance.base),
        api.get(apiEndpoints.sites.base),
      ]);
      setTransactions(txRes.data.data || []);
      setSummary(
        txRes.data.summary || { totalIncome: 0, totalExpense: 0, balance: 0 }
      );
      setSites(siteRes.data.data || []);
      setError(null);
    } catch (err: unknown) {
      setError("Failed to fetch financial data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
    fetchData();
  }, []);

  const handleOpenDialog = (tx?: Transaction) => {
    setNewReceipts([]);
    setNewReceiptPreviews([]);
    setRemoveUrls([]);
    if (tx) {
      setSelectedTx(tx);
      setFormData({
        type: tx.type,
        amount: tx.amount.toString(),
        category: tx.category,
        siteId: tx.siteId?._id || "",
        description: tx.description || "",
        paymentMode: tx.paymentMode || "Cash",
        date: tx.date.split("T")[0],
      });
      setExistingReceipts(tx.receiptUrls || []);
    } else {
      setSelectedTx(null);
      setFormData({
        type: "Expense",
        amount: "",
        category: "Material Cost",
        siteId: "",
        description: "",
        paymentMode: "Cash",
        date: new Date().toISOString().split("T")[0],
      });
      setExistingReceipts([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTx(null);
    setNewReceipts([]);
    setNewReceiptPreviews([]);
    setExistingReceipts([]);
    setRemoveUrls([]);
  };

  const pickReceipts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = existingReceipts.filter((u) => !removeUrls.includes(u)).length + newReceipts.length;
    const room = 5 - total;
    if (room <= 0) {
      toast("Max 5 receipts per entry", { icon: "⚠️" });
      e.target.value = "";
      return;
    }
    const valid: File[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
        toast.error(`${f.name}: not an image/PDF`);
        continue;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: over 5MB`);
        continue;
      }
      valid.push(f);
      if (valid.length >= room) break;
    }
    const combined = [...newReceipts, ...valid];
    setNewReceipts(combined);
    setNewReceiptPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return combined.map((f) => URL.createObjectURL(f));
    });
    e.target.value = "";
  };

  const removeNewReceipt = (i: number) => {
    setNewReceipts((prev) => prev.filter((_, idx) => idx !== i));
    setNewReceiptPreviews((prev) => {
      const url = prev[i];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const toggleRemoveExisting = (url: string) => {
    setRemoveUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const isImage = (url: string) => !url.toLowerCase().endsWith(".pdf");

  const handleSubmit = async () => {
    if (!formData.amount || !formData.category) {
      toast.error("Amount and Category are required");
      return;
    }

    setDialogLoading(true);
    try {
      const fd = new FormData();
      fd.append("type", formData.type);
      fd.append("amount", String(Number(formData.amount)));
      fd.append("category", formData.category);
      if (formData.siteId) fd.append("siteId", formData.siteId);
      fd.append("description", formData.description);
      fd.append("paymentMode", formData.paymentMode);
      fd.append("date", formData.date);
      newReceipts.forEach((f) => fd.append("receipts", f));
      removeUrls.forEach((u) => fd.append("removeReceipt", u));

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: [(data: unknown, headers: unknown) => {
          if (headers) delete (headers as Record<string, unknown>)["Content-Type"];
          return data;
        }],
      };

      if (selectedTx) {
        await api.put(apiEndpoints.finance.byId(selectedTx._id), fd, config);
        toast.success("Transaction updated");
      } else {
        await api.post(apiEndpoints.finance.base, fd, config);
        toast.success("Transaction recorded");
      }
      handleCloseDialog();
      fetchData();
    } catch (err: unknown) {
      toast.error("Operation failed");
      console.error(err);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.delete(apiEndpoints.finance.byId(id));
      toast.success("Deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions
        pageTitle={t("page.financeTitle")}
        pageIcon={<AccountBalance />}
        onRefreshAction={fetchData}
        handleSearch={(q) => setSearchQuery(q)}
        actions={[
          <Button
            key="add-record"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ ...HEADER_BTN_SX, display: { xs: "none", md: "inline-flex" } }}
          >
            {t("action.addEntry")}
          </Button>,
        ]}
      />

      <Grid container spacing={{ xs: 1.5, md: 3 }} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, md: 4 }}>
          <KpiCard
            label="Total Income"
            value={`₹${(summary?.totalIncome || 0).toLocaleString()}`}
            icon={<TrendingUp />}
            color={ACCENT.success}
            variant="soft"
            compact={isMobile}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <KpiCard
            label="Total Expense"
            value={`₹${(summary?.totalExpense || 0).toLocaleString()}`}
            icon={<TrendingDown />}
            color={ACCENT.error}
            variant="soft"
            compact={isMobile}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            label="Net Balance"
            value={`₹${(summary?.balance || 0).toLocaleString()}`}
            icon={<AccountBalance />}
            color={ACCENT.primary}
            variant="soft"
            compact={isMobile}
          />
        </Grid>
      </Grid>

      {/* Filter chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        {(["all", "Income", "Expense", "PENDING"] as const).map((f) => (
          <Chip
            key={f}
            label={f === "all" ? "All" : f === "PENDING" ? "Pending" : f}
            onClick={() => setFilterType(f)}
            color={
              filterType === f
                ? f === "Income"
                  ? "success"
                  : f === "Expense"
                    ? "error"
                    : f === "PENDING"
                      ? "warning"
                      : "primary"
                : "default"
            }
            variant={filterType === f ? "filled" : "outlined"}
            size="small"
            sx={{ fontWeight: 600, cursor: "pointer" }}
          />
        ))}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <GenericTable
        mobileCard
        columns={[
          {
            id: "date",
            label: "Date",
            mobileLabel: "Date",
            render: (v) => new Date(v).toLocaleDateString(),
          },
          {
            id: "type",
            label: "Type",
            mobileLabel: "Type",
            isSecondaryBadge: true,
            render: (v) => (
              <Chip
                label={v}
                color={v === "Income" ? "success" : "error"}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            ),
          },
          {
            id: "amount",
            label: "Amount",
            mobileLabel: "Amount",
            render: (v) => (
              <Typography sx={{ fontWeight: 700 }}>
                ₹{v.toLocaleString()}
              </Typography>
            ),
          },
          { id: "category", label: "Category", isPrimaryOnMobile: true },
          {
            id: "siteId",
            label: "Site Correlation",
            mobileLabel: "Site",
            render: (v) => v?.name || "General / Office",
          },
          {
            id: "approvalStatus",
            label: "Approval",
            mobileLabel: "Approval",
            render: (v: Transaction["approvalStatus"], row: Transaction) => {
              if (!v || v === "AUTO_APPROVED") {
                return <Typography variant="caption" color="text.disabled">—</Typography>;
              }
              const color: "warning" | "success" | "error" =
                v === "PENDING" ? "warning" : v === "APPROVED" ? "success" : "error";
              return (
                <Tooltip title={row.rejectionReason || ""}>
                  <Chip label={v} size="small" color={color} sx={{ fontWeight: 700 }} />
                </Tooltip>
              );
            },
          },
          {
            id: "receiptUrls",
            label: "Receipt",
            isActionColumn: true,
            render: (v: string[] | undefined) =>
              v && v.length > 0 ? (
                <Tooltip title={`${v.length} receipt${v.length > 1 ? "s" : ""}`}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setLightbox({ images: v, index: 0 })}
                  >
                    <ReceiptIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Typography variant="caption" color="text.disabled">—</Typography>
              ),
          },
          {
            id: "actions",
            label: "Actions",
            align: "right",
            isActionColumn: true,
            render: (_: any, row: Transaction) => (
              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                {isBuilderRole && row.approvalStatus === "PENDING" && (
                  <>
                    <Tooltip title="Approve">
                      <IconButton color="success" size="small" onClick={() => handleApprove(row._id)}>
                        <ApproveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => {
                          setRejectDialog(row);
                          setRejectReason("");
                        }}
                      >
                        <RejectIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                <IconButton
                  color="primary"
                  onClick={() => handleOpenDialog(row)}
                  size="small"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDelete(row._id)}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ),
          },
        ]}
        data={transactions.filter((tx) => {
          if (filterType !== "all") {
            if (filterType === "PENDING" && tx.approvalStatus !== "PENDING") return false;
            if (filterType !== "PENDING" && tx.type !== filterType) return false;
          }
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return (
            tx.category.toLowerCase().includes(q) ||
            (tx.description || "").toLowerCase().includes(q) ||
            (tx.siteId?.name || "").toLowerCase().includes(q)
          );
        })}
        loading={loading}
        emptyMessage="No financial records found."
      />

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedTx ? "Edit Record" : "New Transaction"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}
          >
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as string })
                }
              >
                <MenuItem value="Income">Income (+)</MenuItem>
                <MenuItem value="Expense">Expense (-)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Amount (₹)"
              type="number"
              fullWidth
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as string,
                  })
                }
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Site Correlation</InputLabel>
              <Select
                value={formData.siteId}
                label="Site Correlation"
                onChange={(e) =>
                  setFormData({ ...formData, siteId: e.target.value as string })
                }
              >
                <MenuItem value="">General / None</MenuItem>
                {sites.map((site) => (
                  <MenuItem key={site._id} value={site._id}>
                    {site.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Transaction Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Payment Mode</InputLabel>
              <Select
                value={formData.paymentMode}
                label="Payment Mode"
                onChange={(e) =>
                  setFormData({ ...formData, paymentMode: e.target.value as string })
                }
              >
                {["Cash", "UPI", "Bank", "Cheque", "Other"].map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              placeholder="Enter payment details..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            {/* Receipts */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Receipts{" "}
                  <Typography component="span" variant="caption" color="text.secondary">
                    ({existingReceipts.filter((u) => !removeUrls.includes(u)).length + newReceipts.length}/5, ≤5MB each)
                  </Typography>
                </Typography>
                <Button
                  component="label"
                  size="small"
                  startIcon={<AddPhotoIcon />}
                  disabled={
                    existingReceipts.filter((u) => !removeUrls.includes(u)).length + newReceipts.length >= 5
                  }
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
              {(existingReceipts.length > 0 || newReceiptPreviews.length > 0) ? (
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
                  {existingReceipts.map((url) => {
                    const marked = removeUrls.includes(url);
                    const pdf = !isImage(url);
                    return (
                      <ImageListItem
                        key={url}
                        sx={{
                          position: "relative",
                          borderRadius: 2,
                          overflow: "hidden",
                          aspectRatio: "1 / 1",
                          border: "1px solid",
                          borderColor: marked ? "error.main" : "grey.200",
                          opacity: marked ? 0.4 : 1,
                          bgcolor: pdf ? "grey.100" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          "& img": { width: "100%", height: "100%", objectFit: "cover" },
                        }}
                      >
                        {pdf ? (
                          <Box sx={{ textAlign: "center", p: 1 }}>
                            <ReceiptIcon sx={{ fontSize: 24 }} />
                            <Typography variant="caption" display="block" sx={{ fontSize: 9, fontWeight: 700 }}>
                              PDF
                            </Typography>
                          </Box>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="receipt" />
                        )}
                        <IconButton
                          size="small"
                          onClick={() => toggleRemoveExisting(url)}
                          sx={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            bgcolor: marked ? "error.main" : "rgba(0,0,0,0.55)",
                            color: "#fff",
                            "&:hover": { bgcolor: marked ? "error.dark" : "rgba(0,0,0,0.75)" },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </ImageListItem>
                    );
                  })}
                  {newReceiptPreviews.map((src, i) => {
                    const pdf = newReceipts[i]?.type === "application/pdf";
                    return (
                      <ImageListItem
                        key={src}
                        sx={{
                          position: "relative",
                          borderRadius: 2,
                          overflow: "hidden",
                          aspectRatio: "1 / 1",
                          border: "2px dashed",
                          borderColor: "success.main",
                          bgcolor: pdf ? "grey.100" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          "& img": { width: "100%", height: "100%", objectFit: "cover" },
                        }}
                      >
                        {pdf ? (
                          <Box sx={{ textAlign: "center", p: 1 }}>
                            <ReceiptIcon sx={{ fontSize: 24 }} />
                            <Typography variant="caption" display="block" sx={{ fontSize: 9, fontWeight: 700 }}>
                              PDF
                            </Typography>
                          </Box>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="preview" />
                        )}
                        <IconButton
                          size="small"
                          onClick={() => removeNewReceipt(i)}
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={dialogLoading}
            sx={{ px: 4 }}
          >
            {dialogLoading ? (
              <CircularProgress size={24} />
            ) : selectedTx ? (
              "Apply Changes"
            ) : (
              "Save Record"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={Boolean(rejectDialog)} onClose={() => setRejectDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Reject Transaction</DialogTitle>
        <DialogContent>
          {rejectDialog && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {rejectDialog.category} — ₹{rejectDialog.amount.toLocaleString("en-IN")}
                {rejectDialog.createdBy?.name && ` — by ${rejectDialog.createdBy.name}`}
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Reason for rejection"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={submitReject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox for receipts */}
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
            <>
              <Button
                onClick={() =>
                  setLightbox((lb) =>
                    lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : null
                  )
                }
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
                onClick={() =>
                  setLightbox((lb) =>
                    lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : null
                  )
                }
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
        </Box>
      </Dialog>

      <GlassFab color="primary" onClick={() => handleOpenDialog()}>
        <AddIcon />
      </GlassFab>
    </Box>
  );
}
