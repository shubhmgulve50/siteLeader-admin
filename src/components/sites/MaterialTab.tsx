"use client";

import { toast } from "react-hot-toast";
import React, { useEffect, useState } from "react";
import {
  Add as AddIcon,
  Print as PrintIcon,
  WhatsApp as WhatsAppIcon,
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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import GenericTable from "@/components/common/GenericTable";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";

interface Material {
  _id: string;
  name: string;
  unit: string;
  currentStock: number;
}

interface MaterialLog {
  _id: string;
  materialId: { _id: string; name: string; unit: string };
  siteId?: { _id: string; name: string };
  type: "In" | "Out";
  quantity: number;
  description: string;
  issueSlipNumber?: string;
  issuedTo?: string;
  purpose?: string;
  vendorName?: string;
  invoiceReference?: string;
  createdAt: string;
  date?: string;
}

export default function MaterialTab({ siteId }: { siteId: string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    materialId: "",
    type: "Out" as "In" | "Out",
    quantity: "",
    description: "",
    issuedTo: "",
    purpose: "",
    vendorName: "",
    invoiceReference: "",
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, lRes] = await Promise.all([
        api.get(apiEndpoints.materials.base),
        api.get(apiEndpoints.materials.logs),
      ]);
      setMaterials(mRes.data.data);
      const siteLogs = lRes.data.data.filter(
        (l: MaterialLog) => l.siteId?._id === siteId
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
      toast.success(form.type === "Out" ? "Issue slip recorded" : "Stock in recorded");
      setOpenLogDialog(false);
      setForm({
        materialId: "",
        type: "Out",
        quantity: "",
        description: "",
        issuedTo: "",
        purpose: "",
        vendorName: "",
        invoiceReference: "",
      });
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const printSlip = (id: string) => {
    window.open(`/admin/material-slips/${id}/print`, "_blank", "noopener");
  };

  const shareSlip = (row: MaterialLog) => {
    const text = `*Material Issue Slip${row.issueSlipNumber ? ` ${row.issueSlipNumber}` : ""}*\nMaterial: ${row.materialId.name}\nQty: ${row.quantity} ${row.materialId.unit}\nIssued To: ${row.issuedTo || "—"}\nPurpose: ${row.purpose || "—"}\nDate: ${formatDateIN(row.date || row.createdAt)}`;
    shareOnWhatsApp(text);
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
          Material Usage &amp; Issue Slips
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenLogDialog(true)}
          sx={{ borderRadius: 2, width: { xs: "100%", sm: "auto" } }}
        >
          Add Material Log
        </Button>
      </Stack>

      <GenericTable
        mobileCard
        columns={[
          {
            id: "createdAt",
            label: "Date",
            hiddenOnMobile: true,
            render: (v: string) => formatDateIN(v),
          },
          {
            id: "materialId",
            label: "Material",
            isPrimaryOnMobile: true,
            render: (v: MaterialLog["materialId"]) => v?.name || "—",
          },
          {
            id: "type",
            label: "Type",
            isSecondaryBadge: true,
            render: (v: string) => (
              <Chip
                label={v === "In" ? "Stock In" : "Issued"}
                color={v === "In" ? "success" : "warning"}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            ),
          },
          {
            id: "quantity",
            label: "Qty",
            mobileLabel: "Qty",
            render: (v: number, row: MaterialLog) => `${v} ${row.materialId?.unit || ""}`,
          },
          {
            id: "issuedTo",
            label: "Issued To / Vendor",
            mobileLabel: "Issued To",
            render: (_: unknown, row: MaterialLog) => row.issuedTo || row.vendorName || "—",
          },
          {
            id: "issueSlipNumber",
            label: "Slip #",
            hiddenOnMobile: true,
            render: (v: string, row: MaterialLog) => v || (row.type === "In" ? "— (Stock-In)" : "—"),
          },
          { id: "purpose", label: "Purpose / Invoice", hiddenOnMobile: true, render: (_: unknown, row: MaterialLog) => row.purpose || row.invoiceReference || row.description || "—" },
          {
            id: "actions",
            label: "Actions",
            align: "right",
            isActionColumn: true,
            render: (_: unknown, row: MaterialLog) =>
              row.type === "Out" ? (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Tooltip title="Print Issue Slip">
                    <IconButton size="small" onClick={() => printSlip(row._id)}>
                      <PrintIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="WhatsApp">
                    <IconButton size="small" onClick={() => shareSlip(row)} sx={{ color: "#25D366" }}>
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ) : null,
          },
        ]}
        data={logs}
        loading={loading}
        emptyMessage="No material logs for this site."
      />

      <Dialog
        open={openLogDialog}
        onClose={() => !submitting && setOpenLogDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {form.type === "Out" ? "New Material Issue Slip" : "Record Stock Arrival"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Movement Type</InputLabel>
              <Select
                value={form.type}
                label="Movement Type"
                onChange={(e) => setForm({ ...form, type: e.target.value as "In" | "Out" })}
              >
                <MenuItem value="Out">Stock OUT (Issue to Site)</MenuItem>
                <MenuItem value="In">Stock IN (Purchase / Delivery)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Select Material *</InputLabel>
              <Select
                value={form.materialId}
                label="Select Material *"
                onChange={(e) => setForm({ ...form, materialId: e.target.value })}
              >
                {materials.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {m.name} ({m.unit}) — Stock: {m.currentStock}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Quantity *"
              type="number"
              fullWidth
              size="small"
              inputProps={{ inputMode: "decimal" }}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />

            {form.type === "Out" && (
              <>
                <TextField
                  label="Issued To (Contractor / Mistri / Person)"
                  fullWidth
                  size="small"
                  value={form.issuedTo}
                  onChange={(e) => setForm({ ...form, issuedTo: e.target.value })}
                />
                <TextField
                  label="Purpose / Work Description"
                  fullWidth
                  size="small"
                  placeholder="e.g. Slab casting — Block A, Plastering 2nd floor"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                />
              </>
            )}

            {form.type === "In" && (
              <>
                <TextField
                  label="Vendor Name"
                  fullWidth
                  size="small"
                  value={form.vendorName}
                  onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                />
                <TextField
                  label="Invoice / Bill Reference"
                  fullWidth
                  size="small"
                  value={form.invoiceReference}
                  onChange={(e) => setForm({ ...form, invoiceReference: e.target.value })}
                />
              </>
            )}

            <TextField
              label="Notes"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenLogDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.materialId || !form.quantity || submitting}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : form.type === "Out" ? "Issue & Print" : "Record Stock In"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
