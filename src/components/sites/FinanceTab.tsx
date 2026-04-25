"use client";

import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useState } from "react";
import { Add as AddIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import GenericTable from "@/components/common/GenericTable";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";

interface Transaction {
  _id: string;
  type: "Income" | "Expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

const CATEGORIES = [
  "Material cost",
  "Labour wage",
  "Fuel",
  "Electricity",
  "Machinery rent",
  "Water",
  "Other",
];

export default function FinanceTab({ siteId }: { siteId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: "Expense",
    amount: "",
    category: "Other",
    description: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(apiEndpoints.finance.base);
      // Filter for this site
      const siteData = response.data.data.filter(
        (t: any) => t.siteId?._id === siteId
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

  const handleSubmit = async () => {
    if (!form.amount || !form.category) return;
    setSubmitting(true);
    try {
      await api.post(apiEndpoints.finance.base, {
        ...form,
        siteId,
        amount: Number(form.amount),
      });
      toast.success("Transaction recorded");
      setOpenDialog(false);
      setForm({
        type: "Expense",
        amount: "",
        category: "Other",
        description: "",
      });
      fetchData();
    } catch {
      toast.error("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpense = transactions
    .filter((t) => t.type === "Expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const labourExpense = transactions
    .filter((t) => t.type === "Expense" && t.category === "Labour wage")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: "success.50",
              border: "1px solid",
              borderColor: "success.100",
              borderRadius: 4,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: "success.dark", textTransform: 'uppercase' }}>
              Paid by Client (Income)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "success.main" }}>
              ₹{totalIncome.toLocaleString()}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: "error.50",
              border: "1px solid",
              borderColor: "error.100",
              borderRadius: 4,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: "error.dark", textTransform: 'uppercase' }}>
              Total Expenses
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "error.main" }}>
              ₹{totalExpense.toLocaleString()}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: "primary.50",
              border: "1px solid",
              borderColor: "primary.100",
              borderRadius: 4,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.dark", textTransform: 'uppercase' }}>
              Labour Expenses
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "primary.main" }}>
              ₹{labourExpense.toLocaleString()}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Site Cashbook
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Expense
        </Button>
      </Stack>

      <GenericTable
        columns={[
          {
            id: "date",
            label: "Date",
            render: (v) => new Date(v).toLocaleDateString(),
          },
          { id: "category", label: "Category" },
          {
            id: "amount",
            label: "Amount",
            render: (v, row) => (
              <Typography
                sx={{
                  fontWeight: 800,
                  color: row.type === "Income" ? "success.main" : "error.main",
                }}
              >
                {row.type === "Income" ? "+" : "-"}₹{v.toLocaleString()}
              </Typography>
            ),
          },
          { id: "description", label: "Description" },
        ]}
        data={transactions}
        loading={loading}
        emptyMessage="No financial transactions for this site."
      />

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Record Site Expense</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              select
              label="Transaction Type"
              fullWidth
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <MenuItem value="Expense">Expense (Payment Out)</MenuItem>
              <MenuItem value="Income">Income (Payment In)</MenuItem>
            </TextField>
            <TextField
              label="Amount (₹)"
              type="number"
              fullWidth
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <TextField
              select
              label="Category"
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
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !form.amount}
          >
            {submitting ? <CircularProgress size={24} /> : "Record"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
