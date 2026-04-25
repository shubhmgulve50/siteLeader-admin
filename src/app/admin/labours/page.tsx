"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Engineering as EngineeringIcon,
  Phone as PhoneIcon,
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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import GlassFab from "@/components/common/GlassFab";
import GenericTable from "@/components/common/GenericTable";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import { ROLE } from "@/constants/constants";
import api from "@/lib/axios";
import { useT } from "@/i18n/LocaleProvider";
import { HEADER_BTN_SX } from "@/styles/tokens";

interface Labour {
  _id: string;
  name: string;
  mobile: string;
  type: string;
  dailyWage: number;
  isActive: boolean;
  createdAt: string;
}

interface User {
  _id: string;
  role: string;
  name: string;
}

const LABOUR_TYPES = [
  "Mason",
  "Carpenter",
  "Helper",
  "Electrician",
  "Plumber",
  "Other",
];

export default function LabourPage() {
  const t = useT();
  const [labours, setLabours] = useState<Labour[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    type: "Helper",
    dailyWage: "",
    kioskPin: "",
  });

  const checkUser = async () => {
    try {
      const response = await api.get(apiEndpoints.adminProfile);
      setUser(response.data.data);
    } catch {
      // Not critical
    }
  };

  const fetchLabours = async () => {
    setLoading(true);
    try {
      const response = await api.get(apiEndpoints.labours.base);
      setLabours(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch labours");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
    fetchLabours();
  }, []);

  const canManage =
    user?.role === ROLE.SUPER_ADMIN || user?.role === ROLE.BUILDER;

  const handleOpenDialog = (labour?: Labour) => {
    if (!canManage) return;
    if (labour) {
      setSelectedLabour(labour);
      setFormData({
        name: labour.name,
        mobile: labour.mobile,
        type: labour.type,
        dailyWage: labour.dailyWage.toString(),
        kioskPin: (labour as Labour & { kioskPin?: string }).kioskPin || "",
      });
    } else {
      setSelectedLabour(null);
      setFormData({
        name: "",
        mobile: "",
        type: "Helper",
        dailyWage: "",
        kioskPin: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLabour(null);
  };

  const handleSubmit = async () => {
    const { name, mobile, type, dailyWage } = formData;
    if (!name || !mobile || !type || !dailyWage) {
      toast.error("Please fill all fields");
      return;
    }

    setDialogLoading(true);
    try {
      const payload = { ...formData, dailyWage: Number(dailyWage) };
      if (selectedLabour) {
        await api.put(apiEndpoints.labours.byId(selectedLabour._id), payload);
        toast.success("Labour updated successfully");
      } else {
        await api.post(apiEndpoints.labours.base, payload);
        toast.success("Labour created successfully");
      }
      handleCloseDialog();
      fetchLabours();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(apiEndpoints.labours.byId(id));
      toast.success("Deleted successfully");
      fetchLabours();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions
        pageTitle={t("page.labourTitle")}
        pageIcon={<EngineeringIcon />}
        onRefreshAction={fetchLabours}
        handleSearch={(q) => setSearchQuery(q)}
        actions={[
          canManage && (
            <Button
              key="add-labour"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ ...HEADER_BTN_SX, display: { xs: "none", md: "inline-flex" } }}
            >
              {t("action.addLabour")}
            </Button>
          ),
        ].filter(Boolean)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <GenericTable
        mobileCard
        columns={[
          { id: "name", label: "Name", isPrimaryOnMobile: true },
          {
            id: "type",
            label: "Category",
            mobileLabel: "Type",
            render: (v) => (
              <Chip
                label={v}
                size="small"
                color="secondary"
                variant="outlined"
              />
            ),
          },
          {
            id: "dailyWage",
            label: "Daily Wage",
            mobileLabel: "Wage",
            render: (v) => (
              <Typography sx={{ fontWeight: 600, color: "success.main" }}>
                ₹{v}
              </Typography>
            ),
          },
          {
            id: "mobile",
            label: "Mobile",
            mobileLabel: "Phone",
            render: (v) => (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PhoneIcon fontSize="inherit" color="action" />
                {v}
              </Box>
            ),
          },
          ...(canManage
            ? [
                {
                  id: "actions",
                  label: "Actions",
                  align: "right" as const,
                  isActionColumn: true,
                  render: (_: any, row: Labour) => (
                    <>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(row)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(row._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  ),
                },
              ]
            : []),
        ]}
        data={labours.filter((l) =>
          !searchQuery ||
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.mobile.includes(searchQuery)
        )}
        loading={loading}
        emptyMessage="No labour records found."
      />

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {selectedLabour ? "Edit Labour" : "Add New Labour"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Full Name"
              fullWidth
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <TextField
              label="Mobile Number"
              fullWidth
              value={formData.mobile}
              onChange={(e) =>
                setFormData({ ...formData, mobile: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Labour Type</InputLabel>
              <Select
                value={formData.type}
                label="Labour Type"
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                {LABOUR_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Daily Wage (₹)"
              type="number"
              fullWidth
              value={formData.dailyWage}
              onChange={(e) =>
                setFormData({ ...formData, dailyWage: e.target.value })
              }
            />
            <TextField
              label="Kiosk PIN (4 digits, optional)"
              type="text"
              fullWidth
              inputProps={{ inputMode: "numeric", pattern: "[0-9]{4}", maxLength: 4 }}
              value={formData.kioskPin}
              onChange={(e) =>
                setFormData({ ...formData, kioskPin: e.target.value.replace(/\D/g, "").slice(0, 4) })
              }
              helperText="Used by worker to self-clock-in at kiosk tablet"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={dialogLoading}
          >
            {dialogLoading ? (
              <CircularProgress size={24} />
            ) : selectedLabour ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {canManage && (
        <GlassFab color="primary" onClick={() => handleOpenDialog()}>
          <AddIcon />
        </GlassFab>
      )}
    </Box>
  );
}
