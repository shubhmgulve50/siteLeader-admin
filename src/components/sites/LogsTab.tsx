"use client";

import { toast } from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { Add as AddIcon, EventNote as NoteIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";

interface DailyLog {
  _id: string;
  workDone: string;
  issues?: string;
  date: string;
  createdBy: { name: string };
  createdAt: string;
}

export default function LogsTab({ siteId }: { siteId: string }) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    workDone: "",
    issues: "",
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get(apiEndpoints.sites.getLogs(siteId));
      setLogs(response.data.data);
    } catch {
      toast.error("Failed to load daily logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [siteId]);

  const handleSubmit = async () => {
    if (!form.workDone) return;
    setSubmitting(true);
    try {
      await api.post(apiEndpoints.sites.logs, {
        ...form,
        siteId,
      });
      toast.success("Daily log recorded");
      setOpenLogDialog(false);
      setForm({ workDone: "", issues: "" });
      fetchLogs();
    } catch {
      toast.error("Failed to save log");
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
          Daily Progress Reports (DPR)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenLogDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Daily Log
        </Button>
      </Stack>

      <Stack spacing={2}>
        {logs.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No daily logs found for this site.
          </Typography>
        ) : (
          logs.map((log) => (
            <Card
              key={log._id}
              variant="outlined"
              sx={{ borderRadius: 3, borderColor: "grey.200" }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <NoteIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {new Date(log.date).toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: "grey.100",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 700,
                    }}
                  >
                    Reported by {log.createdBy?.name}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.primary",
                    fontWeight: 500,
                    whiteSpace: "pre-line",
                  }}
                >
                  {log.workDone}
                </Typography>
                {log.issues && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: alpha("#f44336", 0.05),
                      borderRadius: 2,
                      border: "1px dashed",
                      borderColor: alpha("#f44336", 0.3),
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ fontWeight: 800, textTransform: "uppercase" }}
                    >
                      Issues / Constraints
                    </Typography>
                    <Typography
                      variant="body2"
                      color="error.dark"
                      sx={{ fontStyle: "italic" }}
                    >
                      {log.issues}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      <Dialog
        open={openLogDialog}
        onClose={() => setOpenLogDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Create Daily Log Entry
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Record the execution progress and any issues faced on site today.
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Work Accomplished Today"
              fullWidth
              multiline
              rows={4}
              required
              value={form.workDone}
              onChange={(e) => setForm({ ...form, workDone: e.target.value })}
              placeholder="e.g. Completed foundations for Block A. Plastering started in Hall."
            />
            <TextField
              label="Issues / Escalations (if any)"
              fullWidth
              multiline
              rows={2}
              value={form.issues}
              onChange={(e) => setForm({ ...form, issues: e.target.value })}
              placeholder="e.g. Shortage of sand. Rain delayed the afternoon shift."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenLogDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !form.workDone}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
