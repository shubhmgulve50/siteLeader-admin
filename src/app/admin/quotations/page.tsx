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
  Send as SendIcon,
  Visibility as ViewIcon,
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
import { alpha } from "@mui/material/styles";
import GenericTable from "@/components/common/GenericTable";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import { ROLE } from "@/constants/constants";
import api from "@/lib/axios";

interface QuotationItem {
  description: string;
  quantity: number | string;
  unit: string;
  rate: number | string;
  amount: number;
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
  taxPercentage: number;
  subTotal: number;
}

interface Site {
  _id: string;
  name: string;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  // Dialogs
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientName: "",
    clientAddress: "",
    siteId: "",
    taxPercentage: 0,
    items: [
      { description: "", quantity: 1, unit: "Sq.Ft", rate: 0, amount: 0 },
    ],
  });

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
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: "", quantity: 1, unit: "Sq.Ft", rate: 0, amount: 0 },
      ],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;

    if (field === "quantity" || field === "rate") {
      newItems[index].amount =
        Number(newItems[index].quantity) * Number(newItems[index].rate);
    }
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce(
      (acc, item) => acc + Number(item.quantity) * Number(item.rate),
      0
    );
  };

  const handleEdit = (q: Quotation) => {
    setSelectedQuote(q);
    setFormData({
      clientName: q.clientName,
      clientAddress: q.clientAddress || "",
      siteId: q.siteId?._id || "",
      taxPercentage: q.taxPercentage || 0,
      items: q.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unit: item.unit,
        rate: Number(item.rate) || 0,
        amount: item.amount,
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
        pageTitle="Quotations Hub"
        pageIcon={<DocIcon />}
        onRefreshAction={fetchData}
        actions={[
          isBuilder && (
            <Button
              key="new-quotation"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedQuote(null);
                setFormData({
                  clientName: "",
                  clientAddress: "",
                  siteId: "",
                  taxPercentage: 0,
                  items: [
                    {
                      description: "",
                      quantity: 1,
                      unit: "Sq.Ft",
                      rate: 0,
                      amount: 0,
                    },
                  ],
                });
                setOpenForm(true);
              }}
              sx={{
                borderRadius: 2,
                px: 3,
                bgcolor: "white",
                color: "primary.main",
                "&:hover": { bgcolor: alpha("#fff", 0.9) },
              }}
            >
              New Quotation
            </Button>
          ),
        ].filter(Boolean)}
      />

      <GenericTable
        columns={[
          {
            id: "quotationNumber",
            label: "Quote #",
            render: (v) => (
              <Typography sx={{ fontWeight: 700, color: "primary.main" }}>
                {v}
              </Typography>
            ),
          },
          {
            id: "clientName",
            label: "Client",
            render: (v) => (
              <Typography sx={{ fontWeight: 500 }}>{v}</Typography>
            ),
          },
          { id: "siteId", label: "Site", render: (v) => v?.name || "N/A" },
          {
            id: "totalAmount",
            label: "Grand Total",
            render: (v) => (
              <Typography sx={{ fontWeight: 800 }}>
                ₹{v.toLocaleString()}
              </Typography>
            ),
          },
          {
            id: "status",
            label: "Status",
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
            render: (_: any, row: Quotation) => (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    sx={{ bgcolor: "grey.100" }}
                    onClick={() => {
                      setSelectedQuote(row);
                      setOpenView(true);
                    }}
                  >
                    <ViewIcon fontSize="small" color="action" />
                  </IconButton>
                </Tooltip>
                {isBuilder && (
                  <>
                    <Tooltip title="Edit Quotation">
                      <IconButton
                        size="small"
                        sx={{ bgcolor: "primary.50", color: "primary.main" }}
                        onClick={() => handleEdit(row)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Approve">
                      <IconButton
                        size="small"
                        sx={{ bgcolor: "success.50", color: "success.main" }}
                        onClick={() => updateStatus(row._id, "Approved")}
                      >
                        <ApproveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        sx={{ bgcolor: "error.50", color: "error.main" }}
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
        data={quotations}
        loading={loading}
        emptyMessage="No Quotations Found. Start by creating your first project estimate."
      />

      {/* REFINED CREATE/EDIT FORM */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 4, maxHeight: "90vh" } }}
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

            {/* Table Header for Items */}
            <Box
              sx={{ display: { xs: "none", md: "flex" }, px: 2, mb: 1, gap: 2 }}
            >
              <Typography
                variant="caption"
                sx={{ flex: 5, fontWeight: 700, color: "text.disabled" }}
              >
                DESCRIPTION OF WORK
              </Typography>
              <Typography
                variant="caption"
                sx={{ flex: 1.5, fontWeight: 700, color: "text.disabled" }}
              >
                QTY
              </Typography>
              <Typography
                variant="caption"
                sx={{ flex: 2, fontWeight: 700, color: "text.disabled" }}
              >
                UNIT
              </Typography>
              <Typography
                variant="caption"
                sx={{ flex: 2, fontWeight: 700, color: "text.disabled" }}
              >
                RATE (₹)
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  flex: 2,
                  fontWeight: 700,
                  color: "text.disabled",
                  textAlign: "right",
                }}
              >
                AMOUNT
              </Typography>
              <Box sx={{ width: 40 }} />
            </Box>

            <Stack spacing={1.5}>
              {formData.items.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 2,
                    alignItems: { xs: "stretch", md: "center" },
                    p: 2,
                    bgcolor: "white",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "grey.100",
                    transition: "0.2s",
                    "&:hover": {
                      borderColor: "primary.light",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  <TextField
                    sx={{ flex: 5 }}
                    size="small"
                    placeholder="Work description..."
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(idx, "description", e.target.value)
                    }
                  />
                  <TextField
                    sx={{ flex: 1.5 }}
                    size="small"
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(idx, "quantity", e.target.value)
                    }
                  />
                  <Select
                    sx={{ flex: 2 }}
                    size="small"
                    value={item.unit}
                    onChange={(e) =>
                      handleItemChange(idx, "unit", e.target.value)
                    }
                  >
                    {["Sq.Ft", "Bags", "Nos", "Kg", "Brass", "Lump Sum"].map(
                      (u) => (
                        <MenuItem key={u} value={u}>
                          {u}
                        </MenuItem>
                      )
                    )}
                  </Select>
                  <TextField
                    sx={{ flex: 2 }}
                    size="small"
                    type="number"
                    placeholder="0.00"
                    value={item.rate}
                    onChange={(e) =>
                      handleItemChange(idx, "rate", e.target.value)
                    }
                  />
                  <Typography
                    sx={{
                      flex: 2,
                      textAlign: "right",
                      fontWeight: 700,
                      color: "text.secondary",
                    }}
                  >
                    ₹{item.amount.toLocaleString()}
                  </Typography>
                  <IconButton
                    flex-basis="40px"
                    color="error"
                    size="small"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={formData.items.length === 1}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>

            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  bgcolor: "primary.main",
                  color: "white",
                  borderRadius: 4,
                  minWidth: 350,
                }}
              >
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      opacity: 0.8,
                    }}
                  >
                    <Typography fontSize={14}>Subtotal Basis</Typography>
                    <Typography fontWeight={600}>
                      ₹{calculateSubtotal().toLocaleString()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography fontSize={14}>Taxation (%)</Typography>
                    <TextField
                      size="small"
                      type="number"
                      sx={{
                        width: 70,
                        "& .MuiInputBase-input": {
                          color: "white",
                          py: 0.5,
                          textAlign: "right",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255,255,255,0.3)",
                        },
                      }}
                      value={formData.taxPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          taxPercentage: Number(e.target.value),
                        })
                      }
                    />
                  </Box>
                  <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <Typography variant="h6" fontWeight={400}>
                      Grand Total
                    </Typography>
                    <Typography variant="h4" fontWeight={900}>
                      ₹
                      {(
                        calculateSubtotal() +
                        (calculateSubtotal() * formData.taxPercentage) / 100
                      ).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>
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
        <DialogActions sx={{ p: 3 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => {
              updateStatus(selectedQuote!._id, "Sent");
              setOpenView(false);
            }}
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 800 }}
          >
            MARK AS SENT TO CLIENT
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
