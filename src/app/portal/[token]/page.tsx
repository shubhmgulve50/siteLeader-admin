"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  ImageList,
  ImageListItem,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  Business as SiteIcon,
  Close as CloseIcon,
  Flag as MilestoneIcon,
  HealthAndSafety as SafetyIcon,
  LocationOn as LocationIcon,
  PhotoLibrary as PhotoIcon,
  HistoryEdu as LogIcon,
  CheckCircle as DoneIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import apiEndpoints from "@/constants/apiEndpoints";
import api from "@/lib/axios";
import { formatDateIN } from "@/utils/format";

interface Milestone {
  title: string;
  description?: string;
  plannedDate?: string;
  completedDate?: string;
  progress: number;
  status: string;
  order: number;
}

interface DailyLog {
  date: string;
  workDone: string;
  images: string[];
}

interface PortalData {
  site: {
    name: string;
    status: string;
    address?: string;
    city?: string;
    clientName?: string;
    startDate?: string;
    endDate?: string;
    projectType?: string;
    priority?: string;
  };
  overallProgress: number;
  milestones: Milestone[];
  recentLogs: DailyLog[];
  safety: { daysSafe: number | null; totalIncidents: number };
}

export default function ClientPortalPage() {
  const { token } = useParams();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(apiEndpoints.portal.byToken(token as string));
        setData(res.data.data);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        setError(status === 404 ? "Link expired or invalid" : "Unable to load");
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "grey.50" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "grey.50" }}>
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3, maxWidth: 400 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            Portal Unavailable
          </Typography>
          <Typography color="text.secondary">{error || "This link is no longer active. Please contact your builder for a new link."}</Typography>
        </Paper>
      </Box>
    );
  }

  const { site, overallProgress, milestones, recentLogs, safety } = data;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      {/* Hero */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0f766e 0%, #1e40af 100%)",
          color: "white",
          p: { xs: 3, md: 5 },
        }}
      >
        <Container maxWidth="md">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, opacity: 0.85 }}>
            <SiteIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              Project Portal
            </Typography>
          </Stack>
          <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            {site.name}
          </Typography>
          {site.clientName && (
            <Typography variant="h6" sx={{ opacity: 0.85, fontWeight: 500 }}>
              for {site.clientName}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }} useFlexGap>
            <Chip label={site.status} sx={{ bgcolor: alpha("#fff", 0.2), color: "white", fontWeight: 700 }} />
            {site.projectType && <Chip label={site.projectType} sx={{ bgcolor: alpha("#fff", 0.15), color: "white" }} />}
            {site.address && (
              <Chip
                icon={<LocationIcon sx={{ color: "white !important" }} />}
                label={[site.address, site.city].filter(Boolean).join(", ")}
                sx={{ bgcolor: alpha("#fff", 0.15), color: "white" }}
              />
            )}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Progress + safety top stack */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 4 }}>
          <Card variant="outlined" sx={{ flex: 1, borderRadius: 3, p: 2.5, borderColor: alpha("#0f766e", 0.3), bgcolor: alpha("#0f766e", 0.05) }}>
            <Typography variant="overline" sx={{ fontWeight: 800, color: "#0f766e" }}>
              Overall Progress
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 900, color: "#0f766e", lineHeight: 1 }}>
              {overallProgress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={overallProgress}
              sx={{ mt: 1, height: 10, borderRadius: 5, "& .MuiLinearProgress-bar": { bgcolor: "#0f766e" } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              {milestones.filter((m) => m.status === "COMPLETED").length} of {milestones.length} milestones completed
            </Typography>
          </Card>
          {safety.daysSafe != null && (
            <Card variant="outlined" sx={{ flex: 1, borderRadius: 3, p: 2.5, borderColor: alpha("#16a34a", 0.3), bgcolor: alpha("#16a34a", 0.05) }}>
              <Typography variant="overline" sx={{ fontWeight: 800, color: "#16a34a" }}>
                Safety
              </Typography>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography variant="h2" sx={{ fontWeight: 900, color: "#16a34a", lineHeight: 1 }}>
                  {safety.daysSafe}
                </Typography>
                <Typography variant="body1" sx={{ color: "#16a34a", fontWeight: 700 }}>
                  days safe
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
                <SafetyIcon fontSize="small" sx={{ color: "#16a34a" }} />
                <Typography variant="caption" color="text.secondary">
                  Since last incident
                </Typography>
              </Stack>
            </Card>
          )}
        </Stack>

        {/* Milestones */}
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <MilestoneIcon color="primary" />
          Project Timeline
        </Typography>
        {milestones.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: "center", mb: 4, borderRadius: 3 }}>
            <Typography color="text.secondary">No milestones yet</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5} sx={{ mb: 4 }}>
            {milestones.map((m, i) => (
              <Card
                key={i}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderLeft: "4px solid",
                  borderLeftColor:
                    m.status === "COMPLETED"
                      ? "success.main"
                      : m.status === "IN_PROGRESS"
                        ? "warning.main"
                        : m.status === "BLOCKED"
                          ? "error.main"
                          : "grey.400",
                }}
              >
                <CardContent>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        {m.status === "COMPLETED" && <DoneIcon fontSize="small" color="success" />}
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {m.title}
                        </Typography>
                      </Stack>
                      {m.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {m.description}
                        </Typography>
                      )}
                      {(m.plannedDate || m.completedDate) && (
                        <Stack direction="row" spacing={2}>
                          {m.plannedDate && (
                            <Typography variant="caption" color="text.secondary">
                              Planned: <strong>{formatDateIN(m.plannedDate)}</strong>
                            </Typography>
                          )}
                          {m.completedDate && (
                            <Typography variant="caption" color="success.main">
                              ✓ {formatDateIN(m.completedDate)}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </Box>
                    <Box sx={{ minWidth: { xs: "100%", sm: 150 } }}>
                      <LinearProgress
                        variant="determinate"
                        value={m.progress}
                        sx={{ height: 8, borderRadius: 4, mb: 0.5 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 900, textAlign: "right" }}>
                        {m.progress}%
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Recent activity */}
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <LogIcon color="primary" />
          Recent Progress Updates
        </Typography>
        {recentLogs.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
            <Typography color="text.secondary">No updates yet</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {recentLogs.map((log, i) => (
              <Card key={i} variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {formatDateIN(log.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, whiteSpace: "pre-line" }}>
                    {log.workDone}
                  </Typography>
                  {log.images && log.images.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                        <PhotoIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          {log.images.length} photo{log.images.length > 1 ? "s" : ""}
                        </Typography>
                      </Stack>
                      <ImageList
                        cols={3}
                        gap={6}
                        sx={{
                          m: 0,
                          gridTemplateColumns: {
                            xs: "repeat(3, 1fr) !important",
                            sm: "repeat(4, 1fr) !important",
                          },
                        }}
                      >
                        {log.images.map((src, idx) => (
                          <ImageListItem
                            key={src + idx}
                            sx={{
                              cursor: "pointer",
                              borderRadius: 2,
                              overflow: "hidden",
                              aspectRatio: "1 / 1",
                              "& img": { width: "100%", height: "100%", objectFit: "cover" },
                            }}
                            onClick={() => setLightbox(src)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`progress ${idx + 1}`} loading="lazy" />
                          </ImageListItem>
                        ))}
                      </ImageList>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Footer */}
        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Typography variant="caption" color="text.disabled">
            This is a read-only project portal. For queries, please contact your builder directly.
          </Typography>
        </Box>
      </Container>

      <Dialog
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.92)", boxShadow: "none" } }}
      >
        <Box sx={{ position: "relative", minHeight: { xs: "60vh", md: "80vh" } }}>
          <IconButton
            onClick={() => setLightbox(null)}
            sx={{ position: "absolute", top: 8, right: 8, color: "#fff", zIndex: 2, bgcolor: "rgba(255,255,255,0.1)" }}
          >
            <CloseIcon />
          </IconButton>
          {lightbox && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox}
              alt="progress"
              style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
