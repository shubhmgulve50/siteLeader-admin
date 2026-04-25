export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  religion: string;
  caste: string;
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
  verificationStatus: number;
  biodata?: string;
}

export type Order = "asc" | "desc";

export interface HeadCell {
  id: keyof User;
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
  key: keyof User;
  direction: Order;
}

export interface UsersTableProps {
  users: {
    users: User[];
    totalCount: number;
  };
  isLoading: boolean;
  page: number;
  rowsPerPage: number;
  sortConfig?: SortConfig;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSort: (key: keyof User) => void;
  onDataChanged?: () => void;
  showStatusIndicators?: boolean;
  onSearch?: (value: string) => void;
  allowSelection?: boolean;
  onActionClicked?: (action: string, selectedUsers: string[]) => void;
}
