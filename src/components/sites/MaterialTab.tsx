"use client";

import { toast } from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { Add as AddIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import GenericTable from "@/components/common/GenericTable";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";

interface Material {
  _id: string;
  name: string;
  unit: string;
  currentStock: number;
}

interface MaterialLog {
  _id: string;
  materialId: { name: string; unit: string };
  type: "In" | "Out";
  quantity: number;
  description: string;
  createdAt: string;
}

export default function MaterialTab({ siteId }: { siteId: string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    materialId: "",
    type: "Out",
    quantity: "",
    description: "",
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, lRes] = await Promise.all([
        api.get(apiEndpoints.materials.base),
        api.get(apiEndpoints.materials.logs),
      ]);
      setMaterials(mRes.data.data);
      // Filter logs for this site
      const siteLogs = lRes.data.data.filter(
        (l: any) => l.siteId?._id === siteId
      );
      setLogs(siteLogs);
    } catch {
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.materialId || !form.quantity) return;
    setSubmitting(true);
    try {
      await api.post(apiEndpoints.materials.log, {
        ...form,
        siteId,
        quantity: Number(form.quantity),
      });
      toast.success("Material movement logged");
      setOpenLogDialog(false);
      setForm({ materialId: "", type: "Out", quantity: "", description: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Material Usage & Logs
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenLogDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Material Log
        </Button>
      </Stack>

      <GenericTable
        columns={[
          {
            id: "createdAt",
            label: "Date",
            render: (v) => new Date(v).toLocaleString(),
          },
          { id: "materialId", label: "Material", render: (v) => v.name },
          {
            id: "type",
            label: "Type",
            render: (v) => (
              <Chip
                label={v === "In" ? "Stock In" : "Stock Out"}
                color={v === "In" ? "success" : "warning"}
                size="small"
              />
            ),
          },
          {
            id: "quantity",
            label: "Quantity",
            render: (v, row) => `${v} ${row.materialId.unit}`,
          },
          { id: "description", label: "Notes" },
        ]}
        data={logs}
        loading={loading}
        emptyMessage="No material logs for this site."
      />

      <Dialog
        open={openLogDialog}
        onClose={() => setOpenLogDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Log Material Movement
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Material</InputLabel>
              <Select
                value={form.materialId}
                label="Select Material"
                onChange={(e) =>
                  setForm({ ...form, materialId: e.target.value })
                }
              >
                {materials.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {m.name} ({m.unit}) - Stock: {m.currentStock}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Movement Type</InputLabel>
              <Select
                value={form.type}
                label="Movement Type"
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <MenuItem value="In">Stock IN (Purchase/Add)</MenuItem>
                <MenuItem value="Out">Stock OUT (Usage/Consume)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <TextField
              label="Notes / Reason"
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
          <Button onClick={() => setOpenLogDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.materialId || !form.quantity || submitting}
          >
            {submitting ? <CircularProgress size={24} /> : "Record Movement"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
