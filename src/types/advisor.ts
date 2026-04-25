export interface Advisor {
  _id?: string;
  name: string;
  phone: string;
  email: string;
  professionType?: "job" | "business";
  // Job-related fields
  jobTitle?: string;
  companyName?: string;
  jobLocation?: string;
  jobExperience?: string;
  jobSalary?: string;
  // Business-related fields
  businessName?: string;
  businessType?: string;
  businessLocation?: string;
  businessExperience?: string;
  businessRevenue?: string;
}

export type Order = "asc" | "desc";

export interface HeadCell {
  id: keyof Advisor;
  label: string;
  numeric: boolean;
  sortable: boolean;
}

export interface TableToolbarProps {
  numSelected: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export interface SortConfig {
  key: keyof Advisor;
  direction: Order;
}

export interface AdvisorsTableProps {
  advisors: {
    advisors: Advisor[];
    totalCount: number;
  };
  isLoading: boolean;
  page: number;
  rowsPerPage: number;
  sortConfig?: SortConfig;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSort: (key: keyof Advisor) => void;
  onDataChanged?: () => void;
  showStatusIndicators?: boolean;
  onSearch?: (value: string) => void;
  allowSelection?: boolean;
  onActionClicked?: (action: string, selectedAdvisors: string[]) => void;
}
