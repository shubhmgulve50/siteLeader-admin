"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Paid as PaidIcon,
  Print as PrintIcon,
  ReceiptLong as InvoiceIcon,
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
} from "@mui/material";
import GenericTable from "@/components/common/GenericTable";
import GlassFab from "@/components/common/GlassFab";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import { ROLE } from "@/constants/constants";
import api from "@/lib/axios";
import { useT } from "@/i18n/LocaleProvider";
import { formatDateIN, formatINRFull } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";

type GstType = "NONE" | "CGST_SGST" | "IGST";

interface InvoiceItem {
  description: string;
  hsnCode?: string;
  quantity: number | string;
  unit: string;
  rate: number | string;
  amount: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  type: string;
  clientName: string;
  clientAddress?: string;
  clientGstin?: string;
  clientEmail?: string;
  clientPhone?: string;
  placeOfSupply?: string;
  siteId?: { _id: string; name: string } | string;
  items: InvoiceItem[];
  subTotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstType: GstType;
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  roundOff: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
  issueDate: string;
  dueDate?: string;
  notes?: string;
  termsConditions?: string;
  createdAt: string;
}

interface Site {
  _id: string;
  name: string;
}

const UNITS = ["Sq.Ft", "Sq.Mt", "Cu.Mt", "Brass", "Bags", "Nos", "Kg", "MT", "RMT", "Lump Sum"];

export default function InvoicesPage() {
  const t = useT();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [openPayment, setOpenPayment] = useState(false);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number | string>("");

  const emptyItem = (): InvoiceItem => ({
    description: "",
    hsnCode: "",
    quantity: 1,
    unit: "Nos",
    rate: 0,
    amount: 0,
  });

  const defaultForm = () => ({
    type: "TAX_INVOICE" as const,
    clientName: "",
    clientAddress: "",
    clientGstin: "",
    clientEmail: "",
    clientPhone: "",
    placeOfSupply: "",
    siteId: "",
    gstType: "CGST_SGST" as GstType,
    cgstPercentage: 9,
    sgstPercentage: 9,
    igstPercentage: 18,
    discountAmount: 0,
    issueDate: new Date().toISOString().substring(0, 10),
    dueDate: "",
    notes: "",
    termsConditions: "",
    items: [emptyItem()],
  });

  const [formData, setFormData] = useState(defaultForm());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [iRes, sRes, pRes] = await Promise.all([
        api.get(apiEndpoints.invoices.base),
        api.get(apiEndpoints.sites.base),
        api.get(apiEndpoints.adminProfile),
      ]);
      setInvoices(iRes.data.data);
      setSites(sRes.data.data);
      setUserRole(pRes.data.data.role);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isBuilder = userRole === ROLE.BUILDER || userRole === ROLE.SUPER_ADMIN;

  const addItem = () => setFormData({ ...formData, items: [...formData.items, emptyItem()] });
  const removeItem = (i: number) => {
    if (formData.items.length === 1) return;
    setFormData({ ...formData, items: formData.items.filter((_, idx) => idx !== i) });
  };
  const updateItem = (i: number, field: keyof InvoiceItem, v: unknown) => {
    const items = [...formData.items];
    (items[i] as unknown as Record<string, unknown>)[field as string] = v;
    items[i].amount = (Number(items[i].quantity) || 0) * (Number(items[i].rate) || 0);
    setFormData({ ...formData, items });
  };

  const subTotal = formData.items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.rate) || 0),
    0
  );
  const taxable = Math.max(0, subTotal - Number(formData.discountAmount || 0));
  const cgst = formData.gstType === "CGST_SGST" ? (taxable * Number(formData.cgstPercentage)) / 100 : 0;
  const sgst = formData.gstType === "CGST_SGST" ? (taxable * Number(formData.sgstPercentage)) / 100 : 0;
  const igst = formData.gstType === "IGST" ? (taxable * Number(formData.igstPercentage)) / 100 : 0;
  const tax = cgst + sgst + igst;
  const preRound = taxable + tax;
  const grand = Math.round(preRound);

  const handleSave = async () => {
    if (!formData.clientName) return toast.error("Client name required");
    setSubmitting(true);
    try {
      if (selected) {
        await api.put(apiEndpoints.invoices.byId(selected._id), formData);
        toast.success("Invoice updated");
      } else {
        await api.post(apiEndpoints.invoices.base, formData);
        toast.success("Invoice created");
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

  const handleEdit = (inv: Invoice) => {
    setSelected(inv);
    setFormData({
      type: (inv.type as "TAX_INVOICE") || "TAX_INVOICE",
      clientName: inv.clientName,
      clientAddress: inv.clientAddress || "",
      clientGstin: inv.clientGstin || "",
      clientEmail: inv.clientEmail || "",
      clientPhone: inv.clientPhone || "",
      placeOfSupply: inv.placeOfSupply || "",
      siteId: typeof inv.siteId === "object" && inv.siteId ? inv.siteId._id : "",
      gstType: inv.gstType || "CGST_SGST",
      cgstPercentage: inv.cgstPercentage ?? 9,
      sgstPercentage: inv.sgstPercentage ?? 9,
      igstPercentage: inv.igstPercentage ?? 18,
      discountAmount: inv.discountAmount || 0,
      issueDate: inv.issueDate ? inv.issueDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
      dueDate: inv.dueDate ? inv.dueDate.substring(0, 10) : "",
      notes: inv.notes || "",
      termsConditions: inv.termsConditions || "",
      items: inv.items.map((it) => ({
        description: it.description,
        hsnCode: it.hsnCode || "",
        quantity: Number(it.quantity) || 0,
        unit: it.unit,
        rate: Number(it.rate) || 0,
        amount: it.amount,
      })),
    });
    setOpenForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      await api.delete(apiEndpoints.invoices.byId(id));
      toast.success("Invoice deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleRecordPayment = async () => {
    if (!payInvoice || !payAmount) return;
    try {
      await api.post(apiEndpoints.invoices.payment(payInvoice._id), { amount: Number(payAmount) });
      toast.success("Payment recorded");
      setOpenPayment(false);
      setPayInvoice(null);
      setPayAmount("");
      fetchData();
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const paymentColor = (s: string) =>
    s === "PAID" ? "success" : s === "PARTIAL" ? "warning" : s === "OVERDUE" ? "error" : "default";

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions
        pageTitle={t("page.invoicesTitle")}
        pageIcon={<InvoiceIcon />}
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
              {t("action.newInvoice")}
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
            id: "invoiceNumber",
            label: "Invoice #",
            mobileLabel: "Inv #",
            render: (v: string) => (
              <Typography sx={{ fontWeight: 700, color: "primary.main" }}>{v}</Typography>
            ),
          },
          { id: "clientGstin", label: "GSTIN", hiddenOnMobile: true, render: (v: string) => v || "—" },
          {
            id: "siteId",
            label: "Site",
            hiddenOnMobile: true,
            render: (v: Invoice["siteId"]) => (typeof v === "object" && v ? v.name : "—"),
          },
          {
            id: "issueDate",
            label: "Date",
            mobileLabel: "Date",
            render: (v: string) => formatDateIN(v),
          },
          {
            id: "totalAmount",
            label: "Total",
            mobileLabel: "Amount",
            align: "right",
            render: (v: number) => (
              <Typography sx={{ fontWeight: 800 }}>{formatINRFull(v)}</Typography>
            ),
          },
          {
            id: "paymentStatus",
            label: "Status",
            mobileLabel: "Status",
            render: (v: string) => (
              <Chip label={v} size="small" color={paymentColor(v)} sx={{ fontWeight: 700 }} />
            ),
          },
          {
            id: "actions",
            label: "Actions",
            align: "right",
            isActionColumn: true,
            render: (_: unknown, row: Invoice) => (
              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                <Tooltip title="Print / PDF">
                  <IconButton
                    size="small"
                    onClick={() => window.open(`/admin/invoices/${row._id}/print`, "_blank", "noopener")}
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="WhatsApp">
                  <IconButton
                    size="small"
                    onClick={() =>
                      shareOnWhatsApp(
                        `*Invoice ${row.invoiceNumber}*\nClient: ${row.clientName}\nAmount: ${formatINRFull(row.totalAmount)}\nDue: ${row.dueDate ? formatDateIN(row.dueDate) : "—"}`
                      )
                    }
                    sx={{ color: "#25D366" }}
                  >
                    <WhatsAppIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {isBuilder && (
                  <>
                    <Tooltip title="Record Payment">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => {
                          setPayInvoice(row);
                          setPayAmount(row.totalAmount - (row.paidAmount || 0));
                          setOpenPayment(true);
                        }}
                      >
                        <PaidIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
        data={invoices}
        loading={loading}
        emptyMessage="No invoices yet. Create your first GST invoice."
      />

      {/* Invoice form */}
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
            {selected ? `Edit Invoice — ${selected.invoiceNumber}` : "New Tax Invoice"}
          </Typography>
          <IconButton onClick={() => setOpenForm(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, bgcolor: "grey.50" }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ mb: 2, textTransform: "uppercase" }}>
              Client Details
            </Typography>
            <Grid container spacing={2}>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Address"
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
                  label="Phone"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Link to Site (optional)</InputLabel>
                  <Select
                    label="Link to Site (optional)"
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                  >
                    <MenuItem value="">— None —</MenuItem>
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
                  fullWidth
                  size="small"
                  label="Place of Supply"
                  placeholder="e.g. Maharashtra"
                  value={formData.placeOfSupply}
                  onChange={(e) => setFormData({ ...formData, placeOfSupply: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
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
              <Grid size={{ xs: 6, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Due Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ textTransform: "uppercase" }}>
                Line Items
              </Typography>
              <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={addItem}>
                Add Item
              </Button>
            </Stack>
            <Stack spacing={1.5}>
              {formData.items.map((it, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Description *"
                        value={it.description}
                        onChange={(e) => updateItem(i, "description", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="HSN/SAC"
                        value={it.hsnCode || ""}
                        onChange={(e) => updateItem(i, "hsnCode", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Qty"
                        inputProps={{ inputMode: "decimal" }}
                        value={it.quantity}
                        onChange={(e) => updateItem(i, "quantity", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 1 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Unit</InputLabel>
                        <Select
                          label="Unit"
                          value={it.unit}
                          onChange={(e) => updateItem(i, "unit", e.target.value)}
                        >
                          {UNITS.map((u) => (
                            <MenuItem key={u} value={u}>
                              {u}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, md: 1.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Rate ₹"
                        inputProps={{ inputMode: "decimal" }}
                        value={it.rate}
                        onChange={(e) => updateItem(i, "rate", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 10, md: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Amount"
                        value={`₹${it.amount.toLocaleString("en-IN")}`}
                        InputProps={{ readOnly: true, sx: { fontWeight: 700, bgcolor: "grey.50" } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 2, md: 0.5 }} sx={{ display: "flex", alignItems: "center" }}>
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
              ))}
            </Stack>
          </Paper>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ mb: 2, textTransform: "uppercase" }}>
                  GST &amp; Discount
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
                        <MenuItem value="NONE">No GST</MenuItem>
                        <MenuItem value="CGST_SGST">CGST + SGST (intra-state)</MenuItem>
                        <MenuItem value="IGST">IGST (inter-state)</MenuItem>
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
                      label="Discount ₹"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Notes (optional)"
                      multiline
                      minRows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Terms &amp; Conditions (optional)"
                      multiline
                      minRows={2}
                      value={formData.termsConditions}
                      onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, borderRadius: 2, bgcolor: "primary.main", color: "white" }}>
                <Stack spacing={1.25}>
                  <Row label="Sub Total" value={formatINRFull(subTotal)} />
                  {Number(formData.discountAmount) > 0 && (
                    <Row label="Discount" value={`− ${formatINRFull(Number(formData.discountAmount))}`} />
                  )}
                  <Row label="Taxable Value" value={formatINRFull(taxable)} />
                  {formData.gstType === "CGST_SGST" && (
                    <>
                      <Row label={`CGST @ ${formData.cgstPercentage}%`} value={formatINRFull(cgst)} />
                      <Row label={`SGST @ ${formData.sgstPercentage}%`} value={formatINRFull(sgst)} />
                    </>
                  )}
                  {formData.gstType === "IGST" && (
                    <Row label={`IGST @ ${formData.igstPercentage}%`} value={formatINRFull(igst)} />
                  )}
                  {Math.abs(grand - preRound) > 0 && (
                    <Row label="Round Off" value={formatINRFull(grand - preRound)} />
                  )}
                  <Divider sx={{ bgcolor: "rgba(255,255,255,0.25)" }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <Typography variant="h6" fontWeight={500}>Grand Total</Typography>
                    <Typography variant="h4" fontWeight={900}>{formatINRFull(grand)}</Typography>
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
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
            sx={{ px: 4, fontWeight: 800 }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : selected ? "Update" : "Save Invoice"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={openPayment} onClose={() => setOpenPayment(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Record Payment</DialogTitle>
        <DialogContent>
          {payInvoice && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {payInvoice.invoiceNumber} — {payInvoice.clientName}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Total</Typography>
                <Typography fontWeight={700}>{formatINRFull(payInvoice.totalAmount)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Already Paid</Typography>
                <Typography fontWeight={700}>{formatINRFull(payInvoice.paidAmount || 0)}</Typography>
              </Box>
              <TextField
                fullWidth
                type="number"
                label="Payment Received ₹"
                inputProps={{ inputMode: "decimal" }}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayment(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleRecordPayment}>
            Record
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
