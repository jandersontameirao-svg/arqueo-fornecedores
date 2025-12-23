import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

// Pages
import Home from "./pages/Home";
import Suppliers from "./pages/Suppliers";
import SupplierDetail from "./pages/SupplierDetail";
import SupplierForm from "./pages/SupplierForm";
import Categories from "./pages/Categories";
import Documents from "./pages/Documents";
import Approvals from "./pages/Approvals";
import Compliance from "./pages/Compliance";
import Interactions from "./pages/Interactions";
import Evaluations from "./pages/Evaluations";
import Audit from "./pages/Audit";
import Users from "./pages/Users";
import Onboarding from "./pages/Onboarding";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      {/* Public onboarding route */}
      <Route path="/onboarding" component={Onboarding} />
      
      {/* Protected routes with DashboardLayout */}
      <Route path="/">
        <DashboardLayout>
          <Home />
        </DashboardLayout>
      </Route>
      <Route path="/suppliers">
        <DashboardLayout>
          <Suppliers />
        </DashboardLayout>
      </Route>
      <Route path="/suppliers/new">
        <DashboardLayout>
          <SupplierForm />
        </DashboardLayout>
      </Route>
      <Route path="/suppliers/:id">
        {(params) => (
          <DashboardLayout>
            <SupplierDetail id={parseInt(params.id)} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/suppliers/:id/edit">
        {(params) => (
          <DashboardLayout>
            <SupplierForm id={parseInt(params.id)} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/categories">
        <DashboardLayout>
          <Categories />
        </DashboardLayout>
      </Route>
      <Route path="/documents">
        <DashboardLayout>
          <Documents />
        </DashboardLayout>
      </Route>
      <Route path="/approvals">
        <DashboardLayout>
          <Approvals />
        </DashboardLayout>
      </Route>
      <Route path="/compliance">
        <DashboardLayout>
          <Compliance />
        </DashboardLayout>
      </Route>
      <Route path="/interactions">
        <DashboardLayout>
          <Interactions />
        </DashboardLayout>
      </Route>
      <Route path="/evaluations">
        <DashboardLayout>
          <Evaluations />
        </DashboardLayout>
      </Route>
      <Route path="/audit">
        <DashboardLayout>
          <Audit />
        </DashboardLayout>
      </Route>
      <Route path="/users">
        <DashboardLayout>
          <Users />
        </DashboardLayout>
      </Route>
      <Route path="/reports">
        <DashboardLayout>
          <Reports />
        </DashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
