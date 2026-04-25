"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
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
import { alpha } from "@mui/material/styles";
import GenericTable from "@/components/common/GenericTable";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import apiEndpoints from "@/constants/apiEndpoints";
import { ROLE } from "@/constants/constants";
import api from "@/lib/axios";

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
  const [labours, setLabours] = useState<Labour[]>([]);
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
      });
    } else {
      setSelectedLabour(null);
      setFormData({
        name: "",
        mobile: "",
        type: "Helper",
        dailyWage: "",
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
        pageTitle="Labour Management"
        pageIcon={<RefreshIcon />}
        onRefreshAction={fetchLabours}
        handleSearch={(v) => {
          // Implement search if needed, for now just a placeholder
          console.log("Search:", v);
        }}
        actions={[
          canManage && (
            <Button
              key="add-labour"
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
              Add Labour
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
        columns={[
          { id: "name", label: "Name" },
          {
            id: "type",
            label: "Category",
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
            render: (v) => (
              <Typography sx={{ fontWeight: 600, color: "success.main" }}>
                ₹{v}
              </Typography>
            ),
          },
          {
            id: "mobile",
            label: "Mobile",
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
        data={labours}
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
    </Box>
  );
}
