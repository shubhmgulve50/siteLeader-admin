"use client";

import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useState } from "react";
import {
  Cancel as AbsentIcon,
  Add as AddIcon,
  Schedule as HalfDayIcon,
  CheckCircle as PresentIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";

interface Labour {
  _id: string;
  name: string;
  type: string;
  dailyWage: number;
}

export default function LabourTab({ siteId }: { siteId: string }) {
  const [siteLabour, setSiteLabour] = useState<Labour[]>([]);
  const [allLabour, setAllLabour] = useState<Labour[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  const [openAssign, setOpenAssign] = useState(false);
  const [selectedToAssign, setSelectedToAssign] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Summary State
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await api.get(apiEndpoints.sites.attendanceSummary(siteId), {
        params: { month: summaryMonth, year: new Date().getFullYear() },
      });
      setSummaryData(res.data.data);
    } catch {
      toast.error("Failed to load attendance summary");
    } finally {
      setLoadingSummary(false);
    }
  }, [siteId, summaryMonth]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [assignedRes, allRes, attendanceRes] = await Promise.all([
        api.get(apiEndpoints.sites.labour(siteId)),
        api.get(apiEndpoints.labours.base),
        api.get(apiEndpoints.sites.getAttendance(siteId), { params: { date: today } })
      ]);
      
      const assigned = assignedRes.data.data;
      setSiteLabour(assigned);
      setAllLabour(allRes.data.data);

      // Initialize attendance state
      // First, set all to "Present" as default
      const initialAttendance: Record<string, string> = {};
      assigned.forEach((l: Labour) => {
        initialAttendance[l._id] = "Present";
      });

      // Then, overwrite with existing records for today
      const todayRecords = attendanceRes.data.data;
      todayRecords.forEach((record: any) => {
        if (record.labourId?._id) {
          initialAttendance[record.labourId._id] = record.status;
        }
      });
      
      setAttendance(initialAttendance);
      
      // Also fetch summary
      fetchSummary();
    } catch {
      toast.error("Failed to load labour data");
    } finally {
      setLoading(false);
    }
  }, [siteId, fetchSummary]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleAssign = async () => {
    if (!selectedToAssign) return;
    setSubmitting(true);
    try {
      await api.post(apiEndpoints.sites.assignLabour, {
        siteId,
        labourId: selectedToAssign,
      });
      toast.success("Labour assigned to site");
      setOpenAssign(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (labourId: string, status: string) => {
    setAttendance((prev) => ({ ...prev, [labourId]: status }));
  };

  const saveAttendance = async () => {
    setSubmitting(true);
    try {
      const attendanceData = Object.entries(attendance).map(
        ([labourId, status]) => ({
          labourId,
          status,
          date: new Date().toISOString().split("T")[0],
        })
      );

      await api.post(apiEndpoints.sites.attendance, {
        siteId,
        attendanceData,
      });
      toast.success("Attendance marked successfully");
      fetchSummary();
    } catch {
      toast.error("Failed to save attendance");
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
          Manage Site Labour
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAssign(true)}
          sx={{ borderRadius: 2 }}
        >
          Assign Labour
        </Button>
      </Stack>

      <TableContainer
        component={Card}
        elevation={0}
        sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 3 }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "grey.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Labour Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Daily Attendance
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {siteLabour.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  No labour assigned to this site.
                </TableCell>
              </TableRow>
            ) : (
              siteLabour.map((l) => (
                <TableRow key={l._id}>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {l.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ₹{l.dailyWage} / day
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={l.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        onClick={() => handleStatusChange(l._id, "Present")}
                        sx={{
                          bgcolor:
                            attendance[l._id] === "Present"
                              ? alpha("#4caf50", 0.1)
                              : "transparent",
                          color:
                            attendance[l._id] === "Present"
                              ? "#4caf50"
                              : "grey.400",
                        }}
                      >
                        <PresentIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleStatusChange(l._id, "Half Day")}
                        sx={{
                          bgcolor:
                            attendance[l._id] === "Half Day"
                              ? alpha("#ff9800", 0.1)
                              : "transparent",
                          color:
                            attendance[l._id] === "Half Day"
                              ? "#ff9800"
                              : "grey.400",
                        }}
                      >
                        <HalfDayIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleStatusChange(l._id, "Absent")}
                        sx={{
                          bgcolor:
                            attendance[l._id] === "Absent"
                              ? alpha("#f44336", 0.1)
                              : "transparent",
                          color:
                            attendance[l._id] === "Absent"
                              ? "#f44336"
                              : "grey.400",
                        }}
                      >
                        <AbsentIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {siteLabour.length > 0 && (
        <Box sx={{ mt: 3, textAlign: "right" }}>
          <Button
            variant="contained"
            size="large"
            disabled={submitting}
            onClick={saveAttendance}
            sx={{ px: 4, borderRadius: 2, fontWeight: 800 }}
          >
            {submitting ? <CircularProgress size={24} /> : "Submit Attendance"}
          </Button>
        </Box>
      )}

      {/* Attendance Summary Section */}
      <Box sx={{ mt: 5 }}>
        <Divider sx={{ mb: 4 }} />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Attendance & Payroll Summary
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              View monthly aggregation and estimated earnings for all labour.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={summaryMonth}
                onChange={(e) => setSummaryMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchSummary}
              disabled={loadingSummary}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 3, overflow: "hidden" }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Labour</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  P
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  HD
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  A
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Total Days
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Est. Earnings
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingSummary ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={20} />
                  </TableCell>
                </TableRow>
              ) : summaryData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No data for this month.
                  </TableCell>
                </TableRow>
              ) : (
                summaryData.map((s: any) => (
                  <TableRow key={s.labour._id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {s.labour.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.labour.type}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={s.present}
                        size="small"
                        color="success"
                        sx={{ fontWeight: 700, height: 20 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={s.halfDay}
                        size="small"
                        color="warning"
                        sx={{ fontWeight: 700, height: 20 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={s.absent}
                        size="small"
                        color="error"
                        sx={{ fontWeight: 700, height: 20 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {s.totalDays}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 900, color: "primary.main" }}
                      >
                        ₹{s.earnings.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block", fontStyle: "italic" }}
        >
          * P: Present, HD: Half Day, A: Absent. Earnings calculated based on
          daily wage.
        </Typography>
      </Box>

      {/* Assign Labour Dialog */}
      <Dialog
        open={openAssign}
        onClose={() => setOpenAssign(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Assign Global Labour</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select labour from the global master list to assign to this site.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Select Labour</InputLabel>
            <Select
              value={selectedToAssign}
              label="Select Labour"
              onChange={(e) => setSelectedToAssign(e.target.value)}
            >
              {allLabour
                .filter((l) => !siteLabour.find((sl) => sl._id === l._id))
                .map((l) => (
                  <MenuItem key={l._id} value={l._id}>
                    {l.name} ({l.type})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={!selectedToAssign || submitting}
          >
            Assign Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
