import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import LoanSimulator from "@/pages/LoanSimulator";
import Liora from "@/pages/Liora";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/loan-simulator" component={LoanSimulator} />
      <Route path="/liora" component={Liora} />
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
      <Route path="/profile" component={UserProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppLayout>
              <Router />
            </AppLayout>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
