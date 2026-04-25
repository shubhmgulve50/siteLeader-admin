"use client";

import React from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import { Box } from "@mui/material";
import PageHeaderWithActions from "@/components/PageHeaderWithActions";
import ScrollableTabs from "@/components/ScrollableTabs";
import ChangePassword from "@/components/settings/ChangePassword";

const SettingsTabs = [
  { label: "Change Password", content: <ChangePassword /> },
];

// Main Settings Page
export default function SettingsPage() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeaderWithActions
        pageTitle="Settings"
        pageIcon={<SettingsIcon />}
        showSearch={false}
      />
      <Box sx={{ mt: 3 }}>
        <ScrollableTabs tabs={SettingsTabs} tabParamName="settings" />
      </Box>
    </Box>
  );
}
