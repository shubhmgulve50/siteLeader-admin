"use client";

import React from "react";
import {
  Box,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import TableSkeleton from "../TableSkeleton";

export interface Column<T> {
  id: keyof T | string;
  label: string;
  align?: "left" | "right" | "center";
  render?: (value: any, row: T) => React.ReactNode;
  /** Shorter label shown in mobile card key-value row */
  mobileLabel?: string;
  /** Hide this field from mobile card body (but still shown if isActionColumn) */
  hiddenOnMobile?: boolean;
  /** Render at the bottom of mobile card as action row */
  isActionColumn?: boolean;
  /** Use this column's value as the card title on mobile */
  isPrimaryOnMobile?: boolean;
  /** Show this column inline next to primary title (e.g. status chip) */
  isSecondaryBadge?: boolean;
}

interface GenericTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  totalCount?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  emptyMessage?: string;
  /** Enable card layout on mobile/tablet (≤md). Default: false */
  mobileCard?: boolean;
}

function MobileCardList<T>({
  columns,
  data,
  loading,
  emptyMessage,
}: {
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  emptyMessage: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const primaryCol =
    columns.find((c) => c.isPrimaryOnMobile) ??
    columns.find((c) => !c.isActionColumn);
  const badgeCol = columns.find((c) => c.isSecondaryBadge);
  const actionCols = columns.filter((c) => c.isActionColumn);
  const bodyCols = columns.filter(
    (c) =>
      !c.isActionColumn &&
      !c.isPrimaryOnMobile &&
      !c.hiddenOnMobile &&
      !c.isSecondaryBadge
  );

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <TableSkeleton />
      </Paper>
    );
  }

  if (data.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          p: 5,
          textAlign: "center",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography color="text.secondary" variant="body2">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={1.5}>
      {data.map((row: any, index: number) => (
        <Paper
          key={row._id || index}
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark
              ? alpha(theme.palette.background.paper, 0.85)
              : alpha(theme.palette.grey[50], 0.9),
            transition: "box-shadow 0.2s ease, background-color 0.2s ease",
            "&:hover": {
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.12)}`,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 1)
                : "#fff",
            },
          }}
        >
          {/* Primary row */}
          {primaryCol && (
            <Box
              sx={{
                px: 2,
                pt: 1.75,
                pb: badgeCol || bodyCols.length > 0 || actionCols.length > 0 ? 1.25 : 1.75,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  flexGrow: 1,
                  lineHeight: 1.3,
                  fontSize: "0.9rem",
                }}
              >
                {primaryCol.render
                  ? primaryCol.render(row[primaryCol.id], row)
                  : row[primaryCol.id] ?? "—"}
              </Typography>
              {badgeCol && (
                <Box sx={{ flexShrink: 0 }}>
                  {badgeCol.render
                    ? badgeCol.render(row[badgeCol.id], row)
                    : row[badgeCol.id] ?? null}
                </Box>
              )}
            </Box>
          )}

          {/* Body: 2-column key-value grid */}
          {bodyCols.length > 0 && (
            <>
              {primaryCol && <Divider sx={{ mx: 2, opacity: 0.5 }} />}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  px: 2,
                  py: 1,
                  gap: 0,
                }}
              >
                {bodyCols.map((col, i) => (
                  <Box
                    key={col.id as string}
                    sx={{
                      py: 0.75,
                      pr: i % 2 === 0 ? 1.5 : 0,
                      pl: i % 2 === 1 ? 1.5 : 0,
                      borderRight: i % 2 === 0 ? `1px solid ${theme.palette.divider}` : "none",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.disabled",
                        display: "block",
                        mb: 0.2,
                        fontSize: "0.68rem",
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                        fontWeight: 600,
                      }}
                    >
                      {col.mobileLabel ?? col.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="div"
                      sx={{ fontWeight: 500, lineHeight: 1.3 }}
                    >
                      {col.render
                        ? col.render(row[col.id], row)
                        : row[col.id] ?? "—"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* Actions */}
          {actionCols.length > 0 && (
            <>
              <Divider />
              <Box
                sx={{
                  px: 2,
                  py: 0.75,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 0.5,
                  bgcolor: isDark
                    ? alpha(theme.palette.action.hover, 0.3)
                    : alpha(theme.palette.grey[100], 0.7),
                }}
              >
                {actionCols.map((col) => (
                  <Box key={col.id as string}>
                    {col.render
                      ? col.render(row[col.id], row)
                      : row[col.id] ?? null}
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Paper>
      ))}
    </Stack>
  );
}

export default function GenericTable<T>({
  columns,
  data,
  loading = false,
  totalCount = 0,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  emptyMessage = "No records found.",
  mobileCard = false,
}: GenericTableProps<T>) {
  const theme = useTheme();
  // covers both mobile and tablet
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down("md"));

  const pagination = onPageChange ? (
    <TablePagination
      rowsPerPageOptions={[5, 10, 25, 50]}
      component="div"
      count={totalCount || data.length}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  ) : null;

  if (mobileCard && isMobileOrTablet) {
    return (
      <Box>
        <MobileCardList
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage={emptyMessage}
        />
        {pagination && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              mt: 1.5,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {pagination}
          </Paper>
        )}
      </Box>
    );
  }

  return (
    <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id as string}
                  align={column.align || "left"}
                  sx={{
                    fontWeight: 700,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.background.paper, 0.4)
                        : "grey.50",
                    color: "text.primary",
                    py: 2,
                    borderBottom: (theme) =>
                      `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <TableSkeleton />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 5 }}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row: any, index: number) => (
                <TableRow key={row._id || index} hover>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id as string}
                      align={column.align || "left"}
                    >
                      {column.render
                        ? column.render(row[column.id], row)
                        : row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination}
    </Paper>
  );
}
