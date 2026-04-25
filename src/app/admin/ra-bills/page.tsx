"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Description as RaIcon,
  Edit as EditIcon,
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
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
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
import { ROLE } from "@/constants/constants";
import api from "@/lib/axios";
import { formatDateIN, formatINRFull } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";

type GstType = "NONE" | "CGST_SGST" | "IGST";

interface RaItem {
  description: string;
  itemNumber?: string;
  unit: string;
  contractQty: number;
  rate: number;
  previousCumulativeQty: number;
  cumulativeQty: number;
  currentQty: number;
  cumulativeAmount: number;
  previousAmount: number;
  currentAmount: number;
  hsnCode?: string;
}

interface RaBill {
  _id: string;
  raNumber: string;
  raSequence: number;
  clientName: string;
  clientAddress?: string;
  clientGstin?: string;
  siteId: { _id: string; name: string } | string;
  quotationId?: { _id: string; quotationNumber: string } | string;
  items: RaItem[];
  cumulativeGrossValue: number;
  previouslyBilled: number;
  thisBillGross: number;
  retentionPercentage: number;
  retentionAmount: number;
  mobilizationAdjustment: number;
  securityDepositAmount: number;
  otherDeductions: number;
  otherDeductionsNote?: string;
  taxableAmount: number;
  gstType: GstType;
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  tdsPercentage: number;
  tdsAmount: number;
  totalAmount: number;
  issueDate: string;
  status: string;
  notes?: string;
}

interface Site {
  _id: string;
  name: string;
}

interface Quotation {
  _id: string;
  quotationNumber: string;
  siteId?: { _id: string } | string;
}

const STATUS_COLORS: Record<string, "default" | "primary" | "warning" | "success" | "info"> = {
  DRAFT: "default",
  SUBMITTED: "info",
  CERTIFIED: "warning",
  PAID: "success",
};

export default function RaBillsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [bills, setBills] = useState<RaBill[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<RaBill | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyItem = (): RaItem => ({
    description: "",
    itemNumber: "",
    unit: "Nos",
    contractQty: 0,
    rate: 0,
    previousCumulativeQty: 0,
    cumulativeQty: 0,
    currentQty: 0,
    cumulativeAmount: 0,
    previousAmount: 0,
    currentAmount: 0,
    hsnCode: "",
  });

  const defaultForm = () => ({
    clientName: "",
    clientAddress: "",
    clientGstin: "",
    siteId: "",
    quotationId: "",
    issueDate: new Date().toISOString().substring(0, 10),
    periodFrom: "",
    periodTo: "",
    retentionPercentage: 5,
    mobilizationAdjustment: 0,
    securityDepositAmount: 0,
    otherDeductions: 0,
    otherDeductionsNote: "",
    tdsPercentage: 0,
    gstType: "CGST_SGST" as GstType,
    cgstPercentage: 9,
    sgstPercentage: 9,
    igstPercentage: 18,
    notes: "",
    status: "DRAFT",
    items: [emptyItem()],
  });

  const [formData, setFormData] = useState(defaultForm());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, sRes, qRes, pRes] = await Promise.all([
        api.get(apiEndpoints.raBills.base),
        api.get(apiEndpoints.sites.base),
        api.get(apiEndpoints.quotations.base),
        api.get(apiEndpoints.adminProfile),
      ]);
      setBills(rRes.data.data);
      setSites(sRes.data.data);
      setQuotations(qRes.data.data);
      setUserRole(pRes.data.data.role);
    } catch {
      toast.error("Failed to load RA bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isBuilder = userRole === ROLE.BUILDER || userRole === ROLE.SUPER_ADMIN;

  const recomputeItem = (it: RaItem): RaItem => {
    const rate = Number(it.rate) || 0;
    const cum = Number(it.cumulativeQty) || 0;
    const prev = Number(it.previousCumulativeQty) || 0;
    const cur = Math.max(0, cum - prev);
    return {
      ...it,
      rate,
      cumulativeQty: cum,
      previousCumulativeQty: prev,
      currentQty: cur,
      cumulativeAmount: cum * rate,
      previousAmount: prev * rate,
      currentAmount: cur * rate,
    };
  };

  const updateItem = (i: number, field: keyof RaItem, v: unknown) => {
    const items = [...formData.items];
    (items[i] as unknown as Record<string, unknown>)[field as string] = v;
    items[i] = recomputeItem(items[i]);
    setFormData({ ...formData, items });
  };

  const addItem = () => setFormData({ ...formData, items: [...formData.items, emptyItem()] });
  const removeItem = (i: number) => {
    if (formData.items.length === 1) return;
    setFormData({ ...formData, items: formData.items.filter((_, idx) => idx !== i) });
  };

  const handleSeedFromQuotation = async () => {
    if (!formData.siteId) return toast.error("Select a site first");
    const params: Record<string, string> = { siteId: formData.siteId };
    if (formData.quotationId) params.quotationId = formData.quotationId;
    try {
      const res = await api.get(apiEndpoints.raBills.seed, { params });
      const seed = res.data.data;
      if (!seed.items || seed.items.length === 0) {
        return toast.error("No items to seed. Pick a quotation with items.");
      }
      setFormData({ ...formData, items: seed.items.map(recomputeItem) });
      toast.success(
        `Seeded ${seed.items.length} items${seed.priorBillsCount ? ` (previous qty filled from ${seed.priorBillsCount} RA bill${seed.priorBillsCount > 1 ? "s" : ""})` : ""}`
      );
    } catch {
      toast.error("Seed failed");
    }
  };

  // Live totals
  const processed = formData.items.map(recomputeItem);
  const cumGross = processed.reduce((s, it) => s + it.cumulativeAmount, 0);
  const prevBilled = processed.reduce((s, it) => s + it.previousAmount, 0);
  const thisGross = processed.reduce((s, it) => s + it.currentAmount, 0);
  const retention = (thisGross * Number(formData.retentionPercentage || 0)) / 100;
  const mobAdj = Number(formData.mobilizationAdjustment || 0);
  const sd = Number(formData.securityDepositAmount || 0);
  const other = Number(formData.otherDeductions || 0);
  const taxable = Math.max(0, thisGross - retention - mobAdj - sd - other);
  const cgst = formData.gstType === "CGST_SGST" ? (taxable * Number(formData.cgstPercentage)) / 100 : 0;
  const sgst = formData.gstType === "CGST_SGST" ? (taxable * Number(formData.sgstPercentage)) / 100 : 0;
  const igst = formData.gstType === "IGST" ? (taxable * Number(formData.igstPercentage)) / 100 : 0;
  const tax = cgst + sgst + igst;
  const tds = ((taxable + tax) * Number(formData.tdsPercentage || 0)) / 100;
  const net = Math.max(0, taxable + tax - tds);

  const handleSave = async () => {
    if (!formData.clientName || !formData.siteId) {
      return toast.error("Client name and site required");
    }
    setSubmitting(true);
    try {
      if (selected) {
        await api.put(apiEndpoints.raBills.byId(selected._id), formData);
        toast.success("RA Bill updated");
      } else {
        await api.post(apiEndpoints.raBills.base, formData);
        toast.success("RA Bill created");
      }
      setOpenForm(false);
      setSelected(null);
      setFormData(defaultForm());
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (b: RaBill) => {
    setSelected(b);
    setFormData({
      clientName: b.clientName,
      clientAddress: b.clientAddress || "",
      clientGstin: b.clientGstin || "",
      siteId: typeof b.siteId === "object" && b.siteId ? b.siteId._id : String(b.siteId),
      quotationId:
        typeof b.quotationId === "object" && b.quotationId ? b.quotationId._id : String(b.quotationId || ""),
      issueDate: b.issueDate ? b.issueDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
      periodFrom: "",
      periodTo: "",
      retentionPercentage: b.retentionPercentage || 0,
      mobilizationAdjustment: b.mobilizationAdjustment || 0,
      securityDepositAmount: b.securityDepositAmount || 0,
      otherDeductions: b.otherDeductions || 0,
      otherDeductionsNote: b.otherDeductionsNote || "",
      tdsPercentage: b.tdsPercentage || 0,
      gstType: b.gstType || "CGST_SGST",
      cgstPercentage: b.cgstPercentage ?? 9,
      sgstPercentage: b.sgstPercentage ?? 9,
      igstPercentage: b.igstPercentage ?? 18,
      notes: b.notes || "",
      status: b.status || "DRAFT",
      items: b.items.map(recomputeItem),
    });
    setOpenForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this RA bill?")) return;
    try {
      await api.delete(apiEndpoints.raBills.byId(id));
      toast.success("Deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions
        pageTitle="Running Account (RA) Bills"
        pageIcon={<RaIcon />}
        onRefreshAction={fetchData}
        actions={[
          isBuilder && (
            <Button
              key="new"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelected(null);
                setFormData(defaultForm());
                setOpenForm(true);
              }}
              sx={{ borderRadius: 2, px: 3, bgcolor: "white", color: "primary.main" }}
            >
              New RA Bill
            </Button>
          ),
        ].filter(Boolean)}
      />

      <GenericTable
        mobileCard
        columns={[
          {
            id: "clientName",
            label: "Client",
            isPrimaryOnMobile: true,
          },
          {
            id: "raNumber",
            label: "RA #",
            mobileLabel: "RA #",
            render: (v: string, row: RaBill) => (
              <Box>
                <Typography sx={{ fontWeight: 700, color: "primary.main" }}>{v}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Sequence #{row.raSequence}
                </Typography>
              </Box>
            ),
          },
          {
            id: "siteId",
            label: "Site",
            hiddenOnMobile: true,
            render: (v: RaBill["siteId"]) => (typeof v === "object" && v ? v.name : "—"),
          },
          { id: "issueDate", label: "Date", mobileLabel: "Date", render: (v: string) => formatDateIN(v) },
          {
            id: "thisBillGross",
            label: "This Period",
            hiddenOnMobile: true,
            align: "right",
            render: (v: number) => formatINRFull(v),
          },
          {
            id: "totalAmount",
            label: "Net Payable",
            mobileLabel: "Payable",
            align: "right",
            render: (v: number) => (
              <Typography sx={{ fontWeight: 800 }}>{formatINRFull(v)}</Typography>
            ),
          },
          {
            id: "status",
            label: "Status",
            mobileLabel: "Status",
            isSecondaryBadge: true,
            render: (v: string) => (
              <Chip label={v} size="small" color={STATUS_COLORS[v] || "default"} sx={{ fontWeight: 700 }} />
            ),
          },
          {
            id: "actions",
            label: "Actions",
            align: "right",
            isActionColumn: true,
            render: (_: unknown, row: RaBill) => (
              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                <Tooltip title="Print / PDF">
                  <IconButton
                    size="small"
                    onClick={() => window.open(`/admin/ra-bills/${row._id}/print`, "_blank", "noopener")}
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="WhatsApp">
                  <IconButton
                    size="small"
                    onClick={() =>
                      shareOnWhatsApp(
                        `*RA Bill ${row.raNumber}*\nClient: ${row.clientName}\nThis Period: ${formatINRFull(row.thisBillGross)}\nNet Payable: ${formatINRFull(row.totalAmount)}`
                      )
                    }
                    sx={{ color: "#25D366" }}
                  >
                    <WhatsAppIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {isBuilder && (
                  <>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(row)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(row._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            ),
          },
        ]}
        data={bills}
        loading={loading}
        emptyMessage="No RA bills yet. Start with your first progress bill."
      />

      <Dialog
        open={openForm}
        onClose={() => !submitting && setOpenForm(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 4, maxHeight: "92vh" } }}
      >
        <DialogTitle
          component="div"
          sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h6" fontWeight={800}>
            {selected ? `Edit RA Bill — ${selected.raNumber}` : "New Running Account Bill"}
          </Typography>
          <IconButton onClick={() => setOpenForm(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, bgcolor: "grey.50" }}>
          {/* Project + client */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ mb: 2, textTransform: "uppercase" }}>
              Project &amp; Client
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Site *</InputLabel>
                  <Select
                    label="Site *"
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                  >
                    {sites.map((s) => (
                      <MenuItem key={s._id} value={s._id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Quotation (for seed)</InputLabel>
                  <Select
                    label="Quotation (for seed)"
                    value={formData.quotationId}
                    onChange={(e) => setFormData({ ...formData, quotationId: e.target.value })}
                  >
                    <MenuItem value="">— None —</MenuItem>
                    {quotations.map((q) => (
                      <MenuItem key={q._id} value={q._id}>
                        {q.quotationNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", alignItems: "center" }}>
                <Button variant="outlined" onClick={handleSeedFromQuotation} sx={{ fontWeight: 700 }}>
                  Seed Items from Quotation
                </Button>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Client Name *"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Client GSTIN"
                  value={formData.clientGstin}
                  onChange={(e) => setFormData({ ...formData, clientGstin: e.target.value.toUpperCase() })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Client Address"
                  multiline
                  minRows={2}
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Issue Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Period From"
                  InputLabelProps={{ shrink: true }}
                  value={formData.periodFrom}
                  onChange={(e) => setFormData({ ...formData, periodFrom: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Period To"
                  InputLabelProps={{ shrink: true }}
                  value={formData.periodTo}
                  onChange={(e) => setFormData({ ...formData, periodTo: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="DRAFT">Draft</MenuItem>
                    <MenuItem value="SUBMITTED">Submitted</MenuItem>
                    <MenuItem value="CERTIFIED">Certified</MenuItem>
                    <MenuItem value="PAID">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Items */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ textTransform: "uppercase" }}>
                Executed Work Items (Cumulative)
              </Typography>
              <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={addItem}>
                Add Item
              </Button>
            </Stack>
            <Stack spacing={1}>
              {formData.items.map((it, i) => {
                const r = recomputeItem(it);
                return (
                  <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Grid container spacing={1.5} alignItems="center">
                      <Grid size={{ xs: 4, md: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Item #"
                          value={it.itemNumber || ""}
                          onChange={(e) => updateItem(i, "itemNumber", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 8, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Description *"
                          value={it.description}
                          onChange={(e) => updateItem(i, "description", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 4, md: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Unit"
                          value={it.unit}
                          onChange={(e) => updateItem(i, "unit", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 4, md: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Contract Qty"
                          value={it.contractQty}
                          onChange={(e) => updateItem(i, "contractQty", Number(e.target.value))}
                        />
                      </Grid>
                      <Grid size={{ xs: 4, md: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Rate ₹"
                          value={it.rate}
                          onChange={(e) => updateItem(i, "rate", Number(e.target.value))}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, md: 1.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Prev. Cum. Qty"
                          value={it.previousCumulativeQty}
                          onChange={(e) => updateItem(i, "previousCumulativeQty", Number(e.target.value))}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, md: 1.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="This Cum. Qty"
                          value={it.cumulativeQty}
                          onChange={(e) => updateItem(i, "cumulativeQty", Number(e.target.value))}
                        />
                      </Grid>
                      <Grid size={{ xs: 10, md: 1.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Current Amt"
                          value={`₹${r.currentAmount.toLocaleString("en-IN")}`}
                          InputProps={{ readOnly: true, sx: { fontWeight: 700, bgcolor: "grey.50" } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 2, md: 0.5 }}>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => removeItem(i)}
                          disabled={formData.items.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>

          {/* Deductions + GST + totals */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ mb: 2, textTransform: "uppercase" }}>
                  Deductions &amp; Taxes
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Retention %"
                      value={formData.retentionPercentage}
                      onChange={(e) => setFormData({ ...formData, retentionPercentage: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Mobilization Recovery ₹"
                      value={formData.mobilizationAdjustment}
                      onChange={(e) => setFormData({ ...formData, mobilizationAdjustment: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Security Deposit ₹"
                      value={formData.securityDepositAmount}
                      onChange={(e) => setFormData({ ...formData, securityDepositAmount: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Other Deductions ₹"
                      value={formData.otherDeductions}
                      onChange={(e) => setFormData({ ...formData, otherDeductions: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Other Deductions Note"
                      value={formData.otherDeductionsNote}
                      onChange={(e) => setFormData({ ...formData, otherDeductionsNote: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>GST Type</InputLabel>
                      <Select
                        label="GST Type"
                        value={formData.gstType}
                        onChange={(e) => setFormData({ ...formData, gstType: e.target.value as GstType })}
                      >
                        <MenuItem value="NONE">No GST</MenuItem>
                        <MenuItem value="CGST_SGST">CGST + SGST</MenuItem>
                        <MenuItem value="IGST">IGST</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {formData.gstType === "CGST_SGST" && (
                    <>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="CGST %"
                          value={formData.cgstPercentage}
                          onChange={(e) => setFormData({ ...formData, cgstPercentage: Number(e.target.value) })}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="SGST %"
                          value={formData.sgstPercentage}
                          onChange={(e) => setFormData({ ...formData, sgstPercentage: Number(e.target.value) })}
                        />
                      </Grid>
                    </>
                  )}
                  {formData.gstType === "IGST" && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="IGST %"
                        value={formData.igstPercentage}
                        onChange={(e) => setFormData({ ...formData, igstPercentage: Number(e.target.value) })}
                      />
                    </Grid>
                  )}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="TDS %"
                      value={formData.tdsPercentage}
                      onChange={(e) => setFormData({ ...formData, tdsPercentage: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Notes"
                      multiline
                      minRows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, borderRadius: 2, bgcolor: "primary.main", color: "white" }}>
                <Stack spacing={1.25}>
                  <Row label="Cumulative Gross Value" value={formatINRFull(cumGross)} />
                  <Row label="Previously Billed" value={`− ${formatINRFull(prevBilled)}`} />
                  <Divider sx={{ bgcolor: "rgba(255,255,255,0.25)" }} />
                  <Row label="This Period Gross" value={formatINRFull(thisGross)} />
                  {retention > 0 && <Row label={`Retention @ ${formData.retentionPercentage}%`} value={`− ${formatINRFull(retention)}`} />}
                  {mobAdj > 0 && <Row label="Mobilization Recovery" value={`− ${formatINRFull(mobAdj)}`} />}
                  {sd > 0 && <Row label="Security Deposit" value={`− ${formatINRFull(sd)}`} />}
                  {other > 0 && <Row label="Other Deductions" value={`− ${formatINRFull(other)}`} />}
                  <Divider sx={{ bgcolor: "rgba(255,255,255,0.25)" }} />
                  <Row label="Taxable" value={formatINRFull(taxable)} />
                  {formData.gstType === "CGST_SGST" && (
                    <>
                      <Row label={`CGST @ ${formData.cgstPercentage}%`} value={formatINRFull(cgst)} />
                      <Row label={`SGST @ ${formData.sgstPercentage}%`} value={formatINRFull(sgst)} />
                    </>
                  )}
                  {formData.gstType === "IGST" && <Row label={`IGST @ ${formData.igstPercentage}%`} value={formatINRFull(igst)} />}
                  {tds > 0 && <Row label={`TDS @ ${formData.tdsPercentage}%`} value={`− ${formatINRFull(tds)}`} />}
                  <Divider sx={{ bgcolor: "rgba(255,255,255,0.25)" }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <Typography variant="h6" fontWeight={500}>Net Payable</Typography>
                    <Typography variant="h4" fontWeight={900}>{formatINRFull(net)}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "grey.100" }}>
          <Button onClick={() => setOpenForm(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ px: 4, fontWeight: 800 }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : selected ? "Update" : "Save RA Bill"}
          </Button>
        </DialogActions>
      </Dialog>

      {isBuilder && (
        <GlassFab color="primary" onClick={() => { setSelected(null); setOpenForm(true); }}>
          <AddIcon />
        </GlassFab>
      )}
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Typography fontSize={14}>{label}</Typography>
      <Typography fontWeight={600}>{value}</Typography>
    </Box>
  );
}
