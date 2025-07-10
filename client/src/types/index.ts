export interface DashboardMetrics {
  totalLoans: string;
  activeCustomers: number;
  pendingPayments: string;
  monthlyRevenue: string;
  loanGrowth: number;
  customerGrowth: number;
  paymentGrowth: number;
  revenueGrowth: number;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface PaymentStatusData {
  onTime: number;
  late: number;
  overdue: number;
  total: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface TableProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  actions?: (row: any) => React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}
