"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  Add as AddIcon,
  CheckCircle as ApproveIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Description as DocIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  useMediaQuery,
  useTheme,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import GlassFab from "@/components/common/GlassFab";
import GenericTable from "@/components/common/GenericTable";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import { ROLE } from "@/constants/constants";
import api from "@/lib/axios";
import { useT } from "@/i18n/LocaleProvider";
import { formatINRFull } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";
import { HEADER_BTN_SX, WA_GREEN } from "@/styles/tokens";

type GstType = "NONE" | "CGST_SGST" | "IGST";

interface QuotationItem {
  sectionTitle?: string;
  itemNumber?: string;
  description: string;
  quantity: number | string;
  unit: string;
  materialRate?: number | string;
  labourRate?: number | string;
  equipmentRate?: number | string;
  otherRate?: number | string;
  rate: number | string;
  amount: number;
  hsnCode?: string;
  notes?: string;
}

interface Quotation {
  _id: string;
  quotationNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  siteId: { _id: string; name: string };
  totalAmount: number;
  status: string;
  createdAt: string;
  items: QuotationItem[];
  subTotal: number;
  discountAmount?: number;
  gstType?: GstType;
  cgstPercentage?: number;
  sgstPercentage?: number;
  igstPercentage?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxPercentage: number;
  taxAmount?: number;
  validUntil?: string;
  revisionNumber?: number;
}

interface Site {
  _id: string;
  name: string;
}

export default function QuotationsPage() {
  const t = useT();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  // Dialogs
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  const emptyItem = (): QuotationItem => ({
    sectionTitle: "",
    itemNumber: "",
    description: "",
    quantity: 1,
    unit: "Sq.Ft",
    materialRate: 0,
    labourRate: 0,
    equipmentRate: 0,
    otherRate: 0,
    rate: 0,
    amount: 0,
    hsnCode: "",
    notes: "",
  });

  const defaultForm = () => ({
    clientName: "",
    clientAddress: "",
    siteId: "",
    gstType: "NONE" as GstType,
    cgstPercentage: 9,
    sgstPercentage: 9,
    igstPercentage: 18,
    taxPercentage: 0,
    discountAmount: 0,
    validUntil: "",
    items: [emptyItem()],
  });

  const [formData, setFormData] = useState(defaultForm());
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, sRes, pRes] = await Promise.all([
        api.get(apiEndpoints.quotations.base),
        api.get(apiEndpoints.sites.base),
        api.get(apiEndpoints.adminProfile),
      ]);
      setQuotations(qRes.data.data);
      setSites(sRes.data.data);
      setUserRole(pRes.data.data.role);
    } catch {
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isBuilder = userRole === ROLE.BUILDER || userRole === ROLE.SUPER_ADMIN;

  // Form Logic
  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, emptyItem()] });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const recomputeItem = (it: QuotationItem): QuotationItem => {
    const m = Number(it.materialRate) || 0;
    const l = Number(it.labourRate) || 0;
    const e = Number(it.equipmentRate) || 0;
    const o = Number(it.otherRate) || 0;
    const breakdown = m + l + e + o;
    const rate = breakdown > 0 ? breakdown : Number(it.rate) || 0;
    const qty = Number(it.quantity) || 0;
    return { ...it, rate, amount: qty * rate };
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: unknown) => {
    const newItems = [...formData.items];
    (newItems[index] as unknown as Record<string, unknown>)[field as string] = value;
    newItems[index] = recomputeItem(newItems[index]);
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () =>
    formData.items.reduce((acc, item) => {
      const recomputed = recomputeItem(item);
      return acc + recomputed.amount;
    }, 0);

  const taxableAmount = Math.max(0, calculateSubtotal() - Number(formData.discountAmount || 0));
  const taxBreakup = (() => {
    if (formData.gstType === "CGST_SGST") {
      const cgst = (taxableAmount * Number(formData.cgstPercentage || 0)) / 100;
      const sgst = (taxableAmount * Number(formData.sgstPercentage || 0)) / 100;
      return { label: "GST", amount: cgst + sgst, cgst, sgst, igst: 0 };
    }
    if (formData.gstType === "IGST") {
      const igst = (taxableAmount * Number(formData.igstPercentage || 0)) / 100;
      return { label: "IGST", amount: igst, cgst: 0, sgst: 0, igst };
    }
    const simple = (taxableAmount * Number(formData.taxPercentage || 0)) / 100;
    return { label: "Tax", amount: simple, cgst: 0, sgst: 0, igst: 0 };
  })();
  const grandTotal = taxableAmount + taxBreakup.amount;

  const handleEdit = (q: Quotation) => {
    setSelectedQuote(q);
    setFormData({
      clientName: q.clientName,
      clientAddress: q.clientAddress || "",
      siteId: q.siteId?._id || "",
      gstType: q.gstType || "NONE",
      cgstPercentage: q.cgstPercentage ?? 9,
      sgstPercentage: q.sgstPercentage ?? 9,
      igstPercentage: q.igstPercentage ?? 18,
      taxPercentage: q.taxPercentage || 0,
      discountAmount: q.discountAmount || 0,
      validUntil: q.validUntil ? q.validUntil.substring(0, 10) : "",
      items: q.items.map((item) => ({
        sectionTitle: item.sectionTitle || "",
        itemNumber: item.itemNumber || "",
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unit: item.unit,
        materialRate: Number(item.materialRate) || 0,
        labourRate: Number(item.labourRate) || 0,
        equipmentRate: Number(item.equipmentRate) || 0,
        otherRate: Number(item.otherRate) || 0,
        rate: Number(item.rate) || 0,
        amount: item.amount,
        hsnCode: item.hsnCode || "",
        notes: item.notes || "",
      })),
    });
    setOpenForm(true);
  };

  const handleSave = async () => {
    if (!formData.clientName || !formData.siteId) {
      return toast.error("Client and Site are required");
    }
    setDialogLoading(true);
    try {
      if (selectedQuote) {
        await api.put(
          apiEndpoints.quotations.byId(selectedQuote._id),
          formData
        );
        toast.success("Quotation updated");
      } else {
        await api.post(apiEndpoints.quotations.base, formData);
        toast.success("Quotation created");
      }
      setOpenForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Check your inputs");
    } finally {
      setDialogLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(apiEndpoints.quotations.byId(id), { status });
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quotation?")) return;
    try {
      await api.delete(apiEndpoints.quotations.byId(id));
      toast.success("Quotation deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions
        pageTitle={t("page.quotationsTitle")}
        pageIcon={<DocIcon />}
        onRefreshAction={fetchData}
        handleSearch={(q) => setSearchQuery(q)}
        actions={[
          isBuilder && (
            <Button
              key="new-quotation"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedQuote(null);
                setFormData(defaultForm());
                setOpenForm(true);
              }}
              sx={{ ...HEADER_BTN_SX, display: { xs: "none", md: "inline-flex" } }}
            >
              {t("action.newQuotation")}
            </Button>
          ),
        ].filter(Boolean)}
      />

      <GenericTable
        mobileCard
        columns={[
          {
            id: "quotationNumber",
            label: "Quote #",
            mobileLabel: "Quote #",
            render: (v) => (
              <Typography sx={{ fontWeight: 700, color: "primary.main" }}>
                {v}
              </Typography>
            ),
          },
          {
            id: "clientName",
            label: "Client",
            isPrimaryOnMobile: true,
            render: (v) => (
              <Typography sx={{ fontWeight: 500 }}>{v}</Typography>
            ),
          },
          { id: "siteId", label: "Site", mobileLabel: "Site", render: (v) => v?.name || "N/A" },
          {
            id: "totalAmount",
            label: "Grand Total",
            mobileLabel: "Total",
            render: (v) => (
              <Typography sx={{ fontWeight: 800 }}>
                ₹{v.toLocaleString()}
              </Typography>
            ),
          },
          {
            id: "status",
            label: "Status",
            isSecondaryBadge: true,
            render: (v) => (
              <Chip
                label={v}
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor:
                    v === "Approved"
                      ? "success.light"
                      : v === "Sent"
                        ? "info.light"
                        : "grey.100",
                  color:
                    v === "Approved"
                      ? "success.dark"
                      : v === "Sent"
                        ? "info.dark"
                        : "grey.700",
                  fontSize: "0.7rem",
                }}
              />
            ),
          },
          {
            id: "actions",
            label: "Actions",
            align: "right",
            isActionColumn: true,
            render: (_: any, row: Quotation) => (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    sx={{ color: "info.main", bgcolor: (t) => alpha(t.palette.info.main, 0.1), borderRadius: 2 }}
                    onClick={() => {
                      setSelectedQuote(row);
                      setOpenView(true);
                    }}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print / PDF">
                  <IconButton
                    size="small"
                    sx={{ color: "text.secondary", bgcolor: (t) => alpha(t.palette.text.secondary, 0.08), borderRadius: 2 }}
                    onClick={() =>
                      window.open(`/admin/quotations/${row._id}/print`, "_blank", "noopener")
                    }
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="WhatsApp">
                  <IconButton
                    size="small"
                    sx={{ color: WA_GREEN, bgcolor: alpha(WA_GREEN, 0.1), borderRadius: 2 }}
                    onClick={() =>
                      shareOnWhatsApp(
                        `*Quotation ${row.quotationNumber}*\nTo: ${row.clientName}\nTotal: ${formatINRFull(row.totalAmount)}`
                      )
                    }
                  >
                    <WhatsAppIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {isBuilder && (
                  <>
                    <Tooltip title="Edit Quotation">
                      <IconButton
                        size="small"
                        sx={{ color: "primary.main", bgcolor: (t) => alpha(t.palette.primary.main, 0.1), borderRadius: 2 }}
                        onClick={() => handleEdit(row)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Approve">
                      <IconButton
                        size="small"
                        sx={{ color: "success.main", bgcolor: (t) => alpha(t.palette.success.main, 0.1), borderRadius: 2 }}
                        onClick={() => updateStatus(row._id, "Approved")}
                      >
                        <ApproveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        sx={{ color: "error.main", bgcolor: (t) => alpha(t.palette.error.main, 0.1), borderRadius: 2 }}
                        onClick={() => handleDelete(row._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            ),
          },
        ]}
        data={quotations.filter((q) =>
          !searchQuery ||
          q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        loading={loading}
        emptyMessage="No Quotations Found. Start by creating your first project estimate."
      />

      {/* REFINED CREATE/EDIT FORM */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        fullWidth
        maxWidth="lg"
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, maxHeight: isMobile ? "100vh" : "90vh" } }}
      >
        <DialogTitle
          component="div"
          sx={{
            p: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" component="div" fontWeight={800}>
            {selectedQuote ? "Update Quotation" : "Generate Quotation"}
          </Typography>
          <IconButton
            onClick={() => setOpenForm(false)}
            size="small"
            sx={{ bgcolor: "grey.100" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4, bgcolor: "grey.50" }}>
          {/* Section 1: Client & Site Info */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.200",
              mb: 4,
            }}
          >
            <Typography
              variant="subtitle2"
              color="primary"
              fontWeight={700}
              sx={{ mb: 2, textTransform: "uppercase" }}
            >
              Client & Project Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Client Name"
                  fullWidth
                  variant="outlined"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Project Site</InputLabel>
                  <Select
                    label="Select Project Site"
                    value={formData.siteId}
                    onChange={(e) =>
                      setFormData({ ...formData, siteId: e.target.value })
                    }
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
                <TextField
                  label="Client Address"
                  fullWidth
                  variant="outlined"
                  placeholder="Street, City..."
                  value={formData.clientAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, clientAddress: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Section 2: Items Grid */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="subtitle2"
                color="primary"
                fontWeight={700}
                sx={{ textTransform: "uppercase" }}
              >
                Bill of Quantities (BOQ)
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={handleAddItem}
                sx={{ borderRadius: 2 }}
              >
                Add Scope
              </Button>
            </Box>

            <Stack spacing={1.5}>
              {formData.items.map((item, idx) => {
                const recomputed = recomputeItem(item);
                const breakdown =
                  Number(item.materialRate || 0) +
                  Number(item.labourRate || 0) +
                  Number(item.equipmentRate || 0) +
                  Number(item.otherRate || 0);
                return (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: "grey.200",
                      bgcolor: "white",
                      transition: "0.2s",
                      "&:hover": { borderColor: "primary.light" },
                    }}
                  >
                    {/* Row 1: Section + Item# + HSN + delete */}
                    <Grid container spacing={1.5} sx={{ mb: 1 }}>
                      <Grid size={{ xs: 12, sm: 5, md: 5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Section (optional)"
                          placeholder="e.g. Civil Work"
                          value={item.sectionTitle || ""}
                          onChange={(e) => handleItemChange(idx, "sectionTitle", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 4, sm: 2, md: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Item #"
                          placeholder="1.1"
                          value={item.itemNumber || ""}
                          onChange={(e) => handleItemChange(idx, "itemNumber", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 8, sm: 3, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="HSN/SAC"
                          placeholder="9954"
                          value={item.hsnCode || ""}
                          onChange={(e) => handleItemChange(idx, "hsnCode", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2, md: 2 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={formData.items.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>

                    {/* Row 2: Description (full width) */}
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      label="Description of Work"
                      placeholder="e.g. RCC M25 concrete work including formwork, reinforcement..."
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      sx={{ mb: 1 }}
                    />

                    {/* Row 3: Qty + Unit + Rate + Amount */}
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Qty"
                          inputProps={{ inputMode: "decimal" }}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Unit</InputLabel>
                          <Select
                            label="Unit"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                          >
                            {["Sq.Ft", "Sq.Mt", "Cu.Mt", "Brass", "Bags", "Nos", "Kg", "MT", "RMT", "Lump Sum"].map((u) => (
                              <MenuItem key={u} value={u}>
                                {u}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label={breakdown > 0 ? "Rate (auto from analysis)" : "Rate (₹)"}
                          inputProps={{ inputMode: "decimal" }}
                          value={recomputed.rate}
                          disabled={breakdown > 0}
                          onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3, md: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Amount"
                          value={`₹${recomputed.amount.toLocaleString("en-IN")}`}
                          InputProps={{ readOnly: true, sx: { fontWeight: 700, bgcolor: "grey.50" } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          endIcon={<ExpandMoreIcon
                            sx={{
                              transform: expandedAnalysis === idx ? "rotate(180deg)" : "none",
                              transition: "transform 0.2s",
                            }}
                          />}
                          onClick={() => setExpandedAnalysis(expandedAnalysis === idx ? null : idx)}
                          sx={{ textTransform: "none", fontWeight: 700, height: 40 }}
                        >
                          Analysis
                        </Button>
                      </Grid>
                    </Grid>

                    {/* Rate analysis (collapsible) */}
                    <Accordion
                      expanded={expandedAnalysis === idx}
                      onChange={() => setExpandedAnalysis(expandedAnalysis === idx ? null : idx)}
                      disableGutters
                      elevation={0}
                      sx={{ mt: 1, bgcolor: "transparent", "&:before": { display: "none" } }}
                    >
                      <AccordionSummary sx={{ display: "none" }} />
                      <AccordionDetails sx={{ p: 0, pt: 1 }}>
                        <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", mb: 1, display: "block" }}>
                            Rate Analysis (per {item.unit || "unit"}) — filling these auto-computes rate
                          </Typography>
                          <Grid container spacing={1.5}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Material ₹"
                                inputProps={{ inputMode: "decimal" }}
                                value={item.materialRate ?? 0}
                                onChange={(e) => handleItemChange(idx, "materialRate", e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Labour ₹"
                                inputProps={{ inputMode: "decimal" }}
                                value={item.labourRate ?? 0}
                                onChange={(e) => handleItemChange(idx, "labourRate", e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Equipment ₹"
                                inputProps={{ inputMode: "decimal" }}
                                value={item.equipmentRate ?? 0}
                                onChange={(e) => handleItemChange(idx, "equipmentRate", e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Overhead+Profit ₹"
                                inputProps={{ inputMode: "decimal" }}
                                value={item.otherRate ?? 0}
                                onChange={(e) => handleItemChange(idx, "otherRate", e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Notes (optional)"
                                placeholder="Specification / brand / remarks"
                                value={item.notes || ""}
                                onChange={(e) => handleItemChange(idx, "notes", e.target.value)}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Paper>
                );
              })}
            </Stack>

            <Grid container spacing={2} sx={{ mt: 3 }}>
              {/* Left: GST + discount + validity controls */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "grey.200" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: "primary.main", textTransform: "uppercase" }}>
                    Tax &amp; Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>GST Type</InputLabel>
                        <Select
                          label="GST Type"
                          value={formData.gstType}
                          onChange={(e) =>
                            setFormData({ ...formData, gstType: e.target.value as GstType })
                          }
                        >
                          <MenuItem value="NONE">No GST / Simple Tax %</MenuItem>
                          <MenuItem value="CGST_SGST">CGST + SGST (intra-state)</MenuItem>
                          <MenuItem value="IGST">IGST (inter-state)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {formData.gstType === "NONE" && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Tax %"
                          inputProps={{ inputMode: "decimal" }}
                          value={formData.taxPercentage}
                          onChange={(e) => setFormData({ ...formData, taxPercentage: Number(e.target.value) })}
                        />
                      </Grid>
                    )}
                    {formData.gstType === "CGST_SGST" && (
                      <>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="CGST %"
                            inputProps={{ inputMode: "decimal" }}
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
                            inputProps={{ inputMode: "decimal" }}
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
                          inputProps={{ inputMode: "decimal" }}
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
                        label="Discount ₹"
                        inputProps={{ inputMode: "decimal" }}
                        value={formData.discountAmount}
                        onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Valid Until"
                        InputLabelProps={{ shrink: true }}
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Right: totals */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: "primary.main",
                    color: "white",
                    borderRadius: 3,
                    height: "100%",
                  }}
                >
                  <Stack spacing={1.5}>
                    <Row label="Sub Total" value={formatINRFull(calculateSubtotal())} />
                    {Number(formData.discountAmount) > 0 && (
                      <Row label="Discount" value={`− ${formatINRFull(Number(formData.discountAmount))}`} />
                    )}
                    {formData.gstType === "CGST_SGST" && (
                      <>
                        <Row label={`CGST @ ${formData.cgstPercentage}%`} value={formatINRFull(taxBreakup.cgst)} />
                        <Row label={`SGST @ ${formData.sgstPercentage}%`} value={formatINRFull(taxBreakup.sgst)} />
                      </>
                    )}
                    {formData.gstType === "IGST" && (
                      <Row label={`IGST @ ${formData.igstPercentage}%`} value={formatINRFull(taxBreakup.igst)} />
                    )}
                    {formData.gstType === "NONE" && Number(formData.taxPercentage) > 0 && (
                      <Row label={`Tax @ ${formData.taxPercentage}%`} value={formatINRFull(taxBreakup.amount)} />
                    )}
                    <Divider sx={{ bgcolor: "rgba(255,255,255,0.25)" }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <Typography variant="h6" fontWeight={500}>Grand Total</Typography>
                      <Typography variant="h4" fontWeight={900}>{formatINRFull(grandTotal)}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "grey.100" }}>
          <Button
            onClick={() => setOpenForm(false)}
            sx={{ color: "text.secondary", fontWeight: 700 }}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={dialogLoading}
            sx={{ px: 4, borderRadius: 3, fontWeight: 800 }}
          >
            {dialogLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Finalize & Save Quotation"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG (Already aligned, minor polish) */}
      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle
          component="div"
          sx={{
            p: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <Typography variant="h6" component="div" fontWeight={800}>
            DETAILED ESTIMATE: {selectedQuote?.quotationNumber}
          </Typography>
          <IconButton
            onClick={() => setOpenView(false)}
            size="small"
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {selectedQuote && (
            <Stack spacing={4}>
              <Box>
                <Grid container>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="overline" color="text.secondary">
                      BILL TO
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {selectedQuote.clientName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedQuote.clientAddress}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                    <Typography variant="overline" color="text.secondary">
                      PROJECT SITE
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {selectedQuote.siteId?.name}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 2,
                    fontWeight: 800,
                    color: "primary.main",
                    borderBottom: "2px solid",
                    borderColor: "primary.light",
                    pb: 0.5,
                    display: "inline-block",
                  }}
                >
                  WORK SCOPE & PRICING
                </Typography>
                <Stack spacing={2}>
                  {selectedQuote.items.map((item, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {item.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.quantity} {item.unit} @ ₹{item.rate}
                        </Typography>
                      </Box>
                      <Typography fontWeight={700}>
                        ₹{item.amount.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50" }}
              >
                <Stack spacing={1}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ₹{selectedQuote.subTotal.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Tax ({selectedQuote.taxPercentage}%)
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ₹
                      {(
                        selectedQuote.totalAmount - selectedQuote.subTotal
                      ).toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="subtitle1" fontWeight={800}>
                      GRAND TOTAL
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      color="primary.main"
                    >
                      ₹{selectedQuote.totalAmount.toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, flexDirection: { xs: "column", sm: "row" }, gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => {
              if (selectedQuote)
                window.open(`/admin/quotations/${selectedQuote._id}/print`, "_blank", "noopener");
            }}
            sx={{ borderRadius: 3, py: 1.25, fontWeight: 800 }}
          >
            Print / PDF
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<WhatsAppIcon sx={{ color: WA_GREEN }} />}
            onClick={() => {
              if (!selectedQuote) return;
              const text = `*Quotation ${selectedQuote.quotationNumber}*\nTo: ${selectedQuote.clientName}\nTotal: ${formatINRFull(selectedQuote.totalAmount)}`;
              shareOnWhatsApp(text);
            }}
            sx={{ borderRadius: 3, py: 1.25, fontWeight: 800 }}
          >
            WhatsApp
          </Button>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => {
              updateStatus(selectedQuote!._id, "Sent");
              setOpenView(false);
            }}
            sx={{ borderRadius: 3, py: 1.25, fontWeight: 800 }}
          >
            Mark as Sent
          </Button>
        </DialogActions>
      </Dialog>

      {isBuilder && (
        <GlassFab
          color="primary"
          onClick={() => {
            setSelectedQuote(null);
            setFormData(defaultForm());
            setOpenForm(true);
          }}
        >
          <AddIcon />
        </GlassFab>
      )}
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", opacity: 0.85 }}>
      <Typography fontSize={14}>{label}</Typography>
      <Typography fontWeight={600}>{value}</Typography>
    </Box>
  );
}
