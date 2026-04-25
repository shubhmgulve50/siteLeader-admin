// components/common/ScrollableTabs.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, SxProps, Tab, Tabs, tabsClasses } from "@mui/material";

interface TabItem {
  label: string;
  content: React.ReactNode; // This can be JSX or a full component
}

interface ScrollableTabsProps {
  tabs: TabItem[];
  tabParamName: string;
  labelsx?: SxProps;
}

const ScrollableTabs: React.FC<ScrollableTabsProps> = ({
  tabs,
  tabParamName,
  labelsx,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get(tabParamName);

  const initialTabIndex = tabParam
    ? tabs.findIndex(
        (tab) =>
          tab.label.replace(/[^a-zA-Z]/g, "").toLowerCase() ===
          tabParam.replace(/[^a-zA-Z]/g, "").toLowerCase()
      )
    : 0;

  const [selectedTab, setSelectedTab] = useState(initialTabIndex);

  // Validation check moved after hooks
  if (!tabs || !Array.isArray(tabs) || tabs.length === 0) {
    return null;
  }

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    const newLabel = tabs[newValue].label
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase();
    const params = new URLSearchParams(searchParams);

    // Now update the current tab param
    params.set(tabParamName, newLabel);

    setSelectedTab(newValue);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Box
      sx={{
        maxWidth: { xs: 200, sm: 500, md: 780, lg: 980, xl: 1180 },
        //Add commentMore actions
        minWidth: { xs: "100%", md: "70%" },
        margin: "0 auto",
        p: 4,
      }}
    >
      <Tabs
        value={selectedTab}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="scrollable tabs"
        allowScrollButtonsMobile
        sx={{
          [`& .${tabsClasses.scrollButtons}`]: {
            "&.Mui-disabled": { opacity: 0.4 },
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            sx={{
              mr: 2,
              textTransform: "none",
              whiteSpace: "nowrap",
              minWidth: 100,
              ...labelsx,
            }}
          />
        ))}
      </Tabs>
      <Box
        key={selectedTab}
        sx={{
          mt: { xs: 2, sm: 2, md: 0 },
          p: { xs: 0, sm: 2 },
        }}
      >
        {tabs[selectedTab]?.content}
      </Box>
    </Box>
  );
};

export default ScrollableTabs;
