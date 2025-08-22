import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { customerQueryClient } from "./lib/customerQueryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";
import AppLayout from "@/components/layout/AppLayout";
import CustomerLayout from "@/components/layout/CustomerLayout";
import Dashboard from "@/pages/Dashboard";
import LoanSimulator from "@/pages/LoanSimulator";
import Liora from "@/pages/Liora";
import LoanProducts from "@/pages/LoanProducts";
import Customers from "@/pages/Customers";
import LoanBook from "@/pages/LoanBook";
import PaymentSchedule from "@/pages/PaymentSchedule";
import ReceivePayments from "@/pages/ReceivePayments";
import Staff from "@/pages/Staff";
import Income from "@/pages/Income";
import Expenses from "@/pages/Expenses";
import DebtManagement from "@/pages/DebtManagement";
import BankManagement from "@/pages/BankManagement";

import Inventory from "@/pages/Inventory";
import Assets from "@/pages/Assets";
import Liabilities from "@/pages/Liabilities";
import Reports from "@/pages/Reports";
import Equity from "@/pages/Equity";
import UserProfile from "@/pages/UserProfile";
import Login from "@/pages/Login";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import RoleManagementPage from "@/pages/RoleManagementPage";
import NotFound from "@/pages/not-found";

// Customer Portal Components
import CustomerLogin from "@/pages/customer/CustomerLogin";
import CustomerDashboard from "@/pages/customer/CustomerDashboard";
import CustomerLoans from "@/pages/customer/CustomerLoans";
import CustomerPayments from "@/pages/customer/CustomerPayments";
import CustomerPaymentSchedule from "@/pages/customer/CustomerPaymentSchedule";
import CustomerDocuments from "@/pages/customer/CustomerDocuments";
import CustomerSupport from "@/pages/customer/CustomerSupport";
import CustomerHelp from "@/pages/customer/CustomerHelp";
import CustomerProfile from "@/pages/customer/CustomerProfile";

function Router() {
  return (
    <Switch>
      {/* Customer Portal Routes */}
      <Route path="/customer/login" component={CustomerLogin} />
      <Route path="/customer/dashboard" component={CustomerDashboard} />
      <Route path="/customer/loans" component={CustomerLoans} />
      <Route path="/customer/payments" component={CustomerPayments} />
      <Route path="/customer/schedule" component={CustomerPaymentSchedule} />
      <Route path="/customer/documents" component={CustomerDocuments} />
      <Route path="/customer/support" component={CustomerSupport} />
      <Route path="/customer/help" component={CustomerHelp} />
      <Route path="/customer/profile" component={CustomerProfile} />
      <Route path="/customer">
        <CustomerLogin />
      </Route>

      {/* Staff Portal Routes */}
      <Route path="/login" component={Login} />
      <Route path="/super-admin" component={SuperAdminDashboard} />
      <Route path="/" component={Dashboard} />
      <Route path="/loan-simulator" component={LoanSimulator} />
      <Route path="/liora" component={Liora} />
      <Route path="/loan-products" component={LoanProducts} />
      <Route path="/customers" component={Customers} />
      <Route path="/loan-book" component={LoanBook} />
      <Route path="/payment-schedule" component={PaymentSchedule} />
      <Route path="/receive-payments" component={ReceivePayments} />
      <Route path="/staff" component={Staff} />
      <Route path="/income" component={Income} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/debt-management" component={DebtManagement} />
      <Route path="/bank-management" component={BankManagement} />

      <Route path="/inventory" component={Inventory} />
      <Route path="/assets" component={Assets} />
      <Route path="/liabilities" component={Liabilities} />
      <Route path="/reports" component={Reports} />
      <Route path="/equity" component={Equity} />
      <Route path="/role-management" component={RoleManagementPage} />
      <Route path="/profile" component={UserProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const isCustomerPortal = window.location.pathname.startsWith('/customer');
  const client = isCustomerPortal ? customerQueryClient : queryClient;
  
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <AuthProvider>
          <CustomerAuthProvider>
            <TooltipProvider>
              <Toaster />
              <AppLayoutSelector />
            </TooltipProvider>
          </CustomerAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppLayoutSelector() {
  const isCustomerPortal = window.location.pathname.startsWith('/customer');
  
  if (isCustomerPortal) {
    return (
      <CustomerLayout>
        <Router />
      </CustomerLayout>
    );
  }
  
  return (
    <AppLayout>
      <Router />
    </AppLayout>
  );
}

export default App;
