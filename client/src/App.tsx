import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { customerQueryClient } from "./lib/customerQueryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
import { ClerkProvider, SignedIn, SignedOut } from "@/providers/ClerkProvider";
import { useMultiTenantAuth } from "@/hooks/useMultiTenantAuth";
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
import OrganizationSetup from "@/pages/OrganizationSetup";
import ClerkSignIn from "@/pages/ClerkSignIn";
import ClerkSignUp from "@/pages/ClerkSignUp";
import NotFound from "@/pages/not-found";
import TestClerk from "@/pages/TestClerk";

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
      {/* Auth Routes */}
      <Route path="/test-clerk" component={TestClerk} />
      <Route path="/sign-in" component={ClerkSignIn} />
      <Route path="/sign-up" component={ClerkSignUp} />
      <Route path="/organization-setup" component={OrganizationSetup} />
      
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

      {/* Staff Portal Routes - Protected by Clerk */}
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
      <Route path="/profile" component={UserProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ClerkProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const isCustomerPortal = window.location.pathname.startsWith('/customer');
  const isAuthRoute = window.location.pathname.startsWith('/sign-in') || 
                      window.location.pathname.startsWith('/sign-up') ||
                      window.location.pathname === '/organization-setup' ||
                      window.location.pathname === '/test-clerk';

  // Customer portal has its own auth
  if (isCustomerPortal) {
    return (
      <QueryClientProvider client={customerQueryClient}>
        <CustomerAuthProvider>
          <CustomerLayout>
            <Router />
          </CustomerLayout>
        </CustomerAuthProvider>
      </QueryClientProvider>
    );
  }

  // For development: If on test page or auth routes, show without Clerk
  if (isAuthRoute) {
    return <Router />;
  }

  // Use try-catch to handle Clerk initialization errors gracefully
  try {
    const { isSignedIn, isLoading, hasOrganization } = useMultiTenantAuth();
    
    // Show loading state while checking auth
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Connecting to authentication...</p>
          </div>
        </div>
      );
    }

    // Not signed in - redirect to sign-in
    if (!isSignedIn) {
      window.location.href = '/sign-in';
      return null;
    }

    // Signed in but no organization - redirect to org setup
    if (!hasOrganization) {
      window.location.href = '/organization-setup';
      return null;
    }

    // Signed in with organization - show main app
    return (
      <AppLayout>
        <Router />
      </AppLayout>
    );
  } catch (error) {
    // If Clerk fails to initialize, show error message with domain info
    console.error('Clerk initialization error:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Authentication Setup Required</h2>
          <p className="text-muted-foreground mb-4">
            Clerk authentication needs to be configured for this domain:
          </p>
          <code className="bg-muted px-2 py-1 rounded text-sm">
            {window.location.host}
          </code>
          <div className="mt-6 space-y-2">
            <a href="/test-clerk" className="block w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors">
              Test Configuration
            </a>
          </div>
        </div>
      </div>
    );
  }
}

// Import the legacy providers for customer portal
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";

export default App;
