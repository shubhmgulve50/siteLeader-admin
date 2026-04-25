"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  AccountBalance,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
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
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import GenericTable from "@/components/common/GenericTable";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";

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
    date: new Date().toISOString().split("T")[0],
  });

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
    if (tx) {
      setSelectedTx(tx);
      setFormData({
        type: tx.type,
        amount: tx.amount.toString(),
        category: tx.category,
        siteId: tx.siteId?._id || "",
        description: tx.description || "",
        date: tx.date.split("T")[0],
      });
    } else {
      setSelectedTx(null);
      setFormData({
        type: "Expense",
        amount: "",
        category: "Material Cost",
        siteId: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTx(null);
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.category) {
      toast.error("Amount and Category are required");
      return;
    }

    setDialogLoading(true);
    try {
      const payload = { ...formData, amount: Number(formData.amount) };
      if (selectedTx) {
        await api.put(apiEndpoints.finance.byId(selectedTx._id), payload);
        toast.success("Transaction updated");
      } else {
        await api.post(apiEndpoints.finance.base, payload);
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
        pageTitle="Finance Hub"
        pageIcon={<AccountBalance />}
        onRefreshAction={fetchData}
        actions={[
          <Button
            key="add-record"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              px: 3,
              bgcolor: "white",
              color: "primary.main",
              "&:hover": { bgcolor: alpha("#fff", 0.9) },
            }}
          >
            Add Record
          </Button>,
        ]}
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "success.light",
              bgcolor: alpha("#0AA38D", 0.05),
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ fontWeight: 700, color: "success.main" }}
              >
                Total Income
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: "success.dark" }}
              >
                ₹{(summary?.totalIncome || 0).toLocaleString()}
              </Typography>
            </Box>
            <TrendingUp sx={{ fontSize: 40, color: "success.main" }} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "error.light",
              bgcolor: alpha("#d32f2f", 0.05),
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ fontWeight: 700, color: "error.main" }}
              >
                Total Expense
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: "error.dark" }}
              >
                ₹{(summary?.totalExpense || 0).toLocaleString()}
              </Typography>
            </Box>
            <TrendingDown sx={{ fontSize: 40, color: "error.main" }} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "primary.light",
              bgcolor: alpha("#0AA38D", 0.1),
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                Net Balance
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: "primary.main" }}
              >
                ₹{(summary?.balance || 0).toLocaleString()}
              </Typography>
            </Box>
            <AccountBalance sx={{ fontSize: 40, color: "primary.main" }} />
          </Paper>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <GenericTable
        columns={[
          {
            id: "date",
            label: "Date",
            render: (v) => new Date(v).toLocaleDateString(),
          },
          {
            id: "type",
            label: "Type",
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
            render: (v) => (
              <Typography sx={{ fontWeight: 700 }}>
                ₹{v.toLocaleString()}
              </Typography>
            ),
          },
          { id: "category", label: "Category" },
          {
            id: "siteId",
            label: "Site Correlation",
            render: (v) => v?.name || "General / Office",
          },
          {
            id: "actions",
            label: "Actions",
            align: "right",
            render: (_: any, row: Transaction) => (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
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
        data={transactions}
        loading={loading}
        emptyMessage="No financial records found."
      />

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="xs"
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
    </Box>
  );
}
