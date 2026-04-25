"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirmAction: () => void;
  onCancelAction: () => void;
  loading?: boolean;
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  onConfirmAction,
  onCancelAction,
  loading,
}: ConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onCancelAction}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onCancelAction} color="primary">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirmAction}
          color="primary"
          loading={loading}
          disabled={loading}
        >
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
