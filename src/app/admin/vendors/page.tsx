"use client";

import { toast } from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import {
  Add as AddIcon,
  CallOutlined as CallIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Paid as PaidIcon,
  ReceiptLong as BillIcon,
  Store as StoreIcon,
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
import { alpha } from "@mui/material/styles";
import GlassFab from "@/components/common/GlassFab";
import GenericTable from "@/components/common/GenericTable";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import { ROLE } from "@/constants/constants";
import api from "@/lib/axios";
import { formatINRFull } from "@/utils/format";
import { shareOnWhatsApp } from "@/utils/share";

type Category = "MATERIAL" | "LABOUR_CONTRACTOR" | "EQUIPMENT" | "TRANSPORT" | "SERVICE" | "OTHER";

interface Vendor {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  panNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  category: Category;
  paymentTermsDays: number;
  openingBalance: number;
  outstandingAmount: number;
  notes?: string;
  active: boolean;
  createdAt: string;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "MATERIAL", label: "Material Supplier" },
  { value: "LABOUR_CONTRACTOR", label: "Labour Contractor" },
  { value: "EQUIPMENT", label: "Equipment Rental" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "SERVICE", label: "Service Provider" },
  { value: "OTHER", label: "Other" },
];

const categoryLabel = (v?: string) => CATEGORIES.find((c) => c.value === v)?.label || v;

export default function VendorsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<"ALL" | Category>("ALL");

  const [ledgerDialog, setLedgerDialog] = useState<{ vendor: Vendor; mode: "payment" | "bill" } | null>(null);
  const [ledgerAmount, setLedgerAmount] = useState<number | string>("");
  const [ledgerBusy, setLedgerBusy] = useState(false);

  const defaultForm = () => ({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstin: "",
    panNumber: "",
    address: "",
    city: "",
    state: "",
    category: "MATERIAL" as Category,
    paymentTermsDays: 30,
    openingBalance: 0,
    notes: "",
    active: true,
  });

  const [form, setForm] = useState(defaultForm());

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const [vRes, pRes] = await Promise.all([
        api.get(apiEndpoints.vendors.base),
        api.get(apiEndpoints.adminProfile),
      ]);
      setVendors(vRes.data.data);
      setUserRole(pRes.data.data.role);
    } catch {
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const isBuilder = userRole === ROLE.BUILDER || userRole === ROLE.SUPER_ADMIN;

  const filtered = useMemo(() => {
    let list = vendors;
    if (catFilter !== "ALL") list = list.filter((v) => v.category === catFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(s) ||
          (v.phone || "").toLowerCase().includes(s) ||
          (v.gstin || "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [vendors, catFilter, search]);

  const totalOutstanding = vendors.reduce((s, v) => s + (v.outstandingAmount || 0), 0);

  const handleSave = async () => {
    if (!form.name) return toast.error("Name required");
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(apiEndpoints.vendors.byId(editing._id), form);
        toast.success("Vendor updated");
      } else {
        await api.post(apiEndpoints.vendors.base, form);
        toast.success("Vendor added");
      }
      setOpenForm(false);
      setEditing(null);
      setForm(defaultForm());
      fetchVendors();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (v: Vendor) => {
    setEditing(v);
    setForm({
      name: v.name,
      contactPerson: v.contactPerson || "",
      phone: v.phone || "",
      email: v.email || "",
      gstin: v.gstin || "",
      panNumber: v.panNumber || "",
      address: v.address || "",
      city: v.city || "",
      state: v.state || "",
      category: v.category,
      paymentTermsDays: v.paymentTermsDays || 30,
      openingBalance: v.openingBalance || 0,
      notes: v.notes || "",
      active: v.active,
    });
    setOpenForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vendor?")) return;
    try {
      await api.delete(apiEndpoints.vendors.byId(id));
      toast.success("Deleted");
      fetchVendors();
    } catch {
      toast.error("Delete failed");
    }
  };

  const submitLedger = async () => {
    if (!ledgerDialog || !ledgerAmount) return;
    setLedgerBusy(true);
    try {
      const endpoint =
        ledgerDialog.mode === "payment"
          ? apiEndpoints.vendors.payment(ledgerDialog.vendor._id)
          : apiEndpoints.vendors.bill(ledgerDialog.vendor._id);
      await api.post(endpoint, { amount: Number(ledgerAmount) });
      toast.success(ledgerDialog.mode === "payment" ? "Payment recorded" : "Bill recorded");
      setLedgerDialog(null);
      setLedgerAmount("");
      fetchVendors();
    } catch {
      toast.error("Operation failed");
    } finally {
      setLedgerBusy(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions
        pageTitle="Vendors"
        pageIcon={<StoreIcon />}
        onRefreshAction={fetchVendors}
        actions={[
          isBuilder && (
            <Button
              key="add"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditing(null);
                setForm(defaultForm());
                setOpenForm(true);
              }}
              sx={{ borderRadius: 2, px: 3, bgcolor: "white", color: "primary.main" }}
            >
              Add Vendor
            </Button>
          ),
        ].filter(Boolean)}
      />

      {/* Summary strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 3, borderColor: alpha("#0891b2", 0.3), bgcolor: alpha("#0891b2", 0.05) }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#0891b2", textTransform: "uppercase" }}>
              Total Vendors
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#0891b2" }}>
              {vendors.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 3, borderColor: alpha("#16a34a", 0.3), bgcolor: alpha("#16a34a", 0.05) }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#16a34a", textTransform: "uppercase" }}>
              Active
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#16a34a" }}>
              {vendors.filter((v) => v.active).length}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 3, borderColor: alpha("#b91c1c", 0.3), bgcolor: alpha("#b91c1c", 0.05) }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#b91c1c", textTransform: "uppercase" }}>
              Total Outstanding
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#b91c1c" }}>
              {formatINRFull(totalOutstanding)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter bar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <TextField
          size="small"
          placeholder="Search name / phone / GSTIN"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 300 } }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value as "ALL" | Category)}
          >
            <MenuItem value="ALL">All Categories</MenuItem>
            {CATEGORIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <GenericTable
        mobileCard
        columns={[
          {
            id: "name",
            label: "Name",
            isPrimaryOnMobile: true,
            render: (v: string, row: Vendor) => (
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{v}</Typography>
                {row.contactPerson && (
                  <Typography variant="caption" color="text.secondary">
                    {row.contactPerson}
                  </Typography>
                )}
              </Box>
            ),
          },
          { id: "category", label: "Category", mobileLabel: "Type", render: (v: string) => categoryLabel(v) },
          { id: "phone", label: "Phone", mobileLabel: "Phone", render: (v: string) => v || "—" },
          { id: "gstin", label: "GSTIN", hiddenOnMobile: true, render: (v: string) => v || "—" },
          {
            id: "paymentTermsDays",
            label: "Terms",
            hiddenOnMobile: true,
            render: (v: number) => (v ? `${v} days` : "—"),
          },
          {
            id: "outstandingAmount",
            label: "Outstanding",
            mobileLabel: "Due",
            align: "right",
            render: (v: number) => (
              <Typography sx={{ fontWeight: 800, color: v > 0 ? "error.main" : "text.secondary" }}>
                {formatINRFull(v || 0)}
              </Typography>
            ),
          },
          {
            id: "active",
            label: "Status",
            mobileLabel: "Status",
            render: (v: boolean) => (
              <Chip
                label={v ? "Active" : "Inactive"}
                size="small"
                color={v ? "success" : "default"}
                sx={{ fontWeight: 700 }}
              />
            ),
          },
          {
            id: "actions",
            label: "Actions",
            align: "right",
            isActionColumn: true,
            render: (_: unknown, row: Vendor) => (
              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                {row.phone && (
                  <Tooltip title="Call">
                    <IconButton size="small" component="a" href={`tel:${row.phone}`}>
                      <CallIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="WhatsApp">
                  <IconButton
                    size="small"
                    sx={{ color: "#25D366" }}
                    onClick={() =>
                      shareOnWhatsApp(
                        `Hi ${row.name}, ${row.outstandingAmount > 0 ? `outstanding balance: ${formatINRFull(row.outstandingAmount)}` : ""}`,
                        row.phone
                      )
                    }
                  >
                    <WhatsAppIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {isBuilder && (
                  <>
                    <Tooltip title="Record Bill (increase outstanding)">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => {
                          setLedgerDialog({ vendor: row, mode: "bill" });
                          setLedgerAmount("");
                        }}
                      >
                        <BillIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Record Payment (reduce outstanding)">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => {
                          setLedgerDialog({ vendor: row, mode: "payment" });
                          setLedgerAmount(row.outstandingAmount);
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
        data={filtered}
        loading={loading}
        emptyMessage="No vendors yet. Add your first supplier."
      />

      {/* Form dialog */}
      <Dialog
        open={openForm}
        onClose={() => !submitting && setOpenForm(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          component="div"
          sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h6" fontWeight={800}>
            {editing ? `Edit — ${editing.name}` : "Add Vendor"}
          </Typography>
          <IconButton onClick={() => setOpenForm(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "grey.50", p: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Vendor Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                >
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Contact Person"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="GSTIN"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="PAN"
                value={form.panNumber}
                onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Payment Terms (days)"
                value={form.paymentTermsDays}
                onChange={(e) => setForm({ ...form, paymentTermsDays: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Opening Balance ₹"
                value={form.openingBalance}
                onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
                disabled={!!editing}
                helperText={editing ? "Cannot change after creation; use Bill/Payment actions" : "Existing balance at onboarding"}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Address"
                multiline
                minRows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Notes"
                multiline
                minRows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenForm(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={submitting || !form.name} sx={{ px: 4, fontWeight: 800 }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : editing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ledger dialog */}
      <Dialog open={Boolean(ledgerDialog)} onClose={() => setLedgerDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {ledgerDialog?.mode === "payment" ? "Record Payment" : "Record Bill"}
        </DialogTitle>
        <DialogContent>
          {ledgerDialog && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {ledgerDialog.vendor.name} — Outstanding: {formatINRFull(ledgerDialog.vendor.outstandingAmount || 0)}
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Amount ₹"
                inputProps={{ inputMode: "decimal" }}
                value={ledgerAmount}
                onChange={(e) => setLedgerAmount(e.target.value)}
              />
              <Typography variant="caption" color="text.disabled">
                {ledgerDialog.mode === "payment"
                  ? "Reduces outstanding balance"
                  : "Increases outstanding balance"}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLedgerDialog(null)} disabled={ledgerBusy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={ledgerDialog?.mode === "payment" ? "success" : "warning"}
            onClick={submitLedger}
            disabled={ledgerBusy || !ledgerAmount}
          >
            {ledgerBusy ? <CircularProgress size={18} color="inherit" /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {isBuilder && (
        <GlassFab color="primary" onClick={() => { setEditing(null); setForm(defaultForm()); setOpenForm(true); }}>
          <AddIcon />
        </GlassFab>
      )}
    </Box>
  );
}
