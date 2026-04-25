import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BusinessUnitProvider } from "./contexts/BusinessUnitContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { SelectedCompanyProvider } from "./contexts/SelectedCompanyContext";
import TopbarLayout from "./components/TopbarLayout";

// Pages
import SelectBusinessUnit from "./pages/SelectBusinessUnit";
import SelectCompany from "./pages/SelectCompany";
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
import ContractTemplates from "./pages/ContractTemplates";
import SupplierLink from "./pages/SupplierLink";
import AddSupplierAI from "./pages/AddSupplierAI";

function Router() {
  return (
    <Switch>
      {/* Public onboarding route */}
      <Route path="/onboarding" component={Onboarding} />
      
      {/* SelectBusinessUnit as landing page */}
      <Route path="/">
        <TopbarLayout>
          <SelectBusinessUnit />
        </TopbarLayout>
      </Route>

      {/* Intermediate company selection screen */}
      <Route path="/select-company">
        <TopbarLayout>
          <SelectCompany />
        </TopbarLayout>
      </Route>

      {/* Dashboard (former Home) */}
      <Route path="/dashboard">
        <TopbarLayout>
          <Home />
        </TopbarLayout>
      </Route>

      {/* Protected routes with TopbarLayout */}
      <Route path="/suppliers">
        <TopbarLayout>
          <Suppliers />
        </TopbarLayout>
      </Route>
      <Route path="/suppliers/add-ai">
        <TopbarLayout>
          <AddSupplierAI />
        </TopbarLayout>
      </Route>
      <Route path="/suppliers/link">
        <TopbarLayout>
          <SupplierLink />
        </TopbarLayout>
      </Route>
      <Route path="/suppliers/new">
        <TopbarLayout>
          <SupplierForm />
        </TopbarLayout>
      </Route>
      <Route path="/suppliers/:id">
        {(params) => (
          <TopbarLayout>
            <SupplierDetail id={parseInt(params.id)} />
          </TopbarLayout>
        )}
      </Route>
      <Route path="/suppliers/:id/edit">
        {(params) => (
          <TopbarLayout>
            <SupplierForm id={parseInt(params.id)} />
          </TopbarLayout>
        )}
      </Route>
      <Route path="/categories">
        <TopbarLayout>
          <Categories />
        </TopbarLayout>
      </Route>
      <Route path="/documents">
        <TopbarLayout>
          <Documents />
        </TopbarLayout>
      </Route>
      <Route path="/approvals">
        <TopbarLayout>
          <Approvals />
        </TopbarLayout>
      </Route>
      <Route path="/compliance">
        <TopbarLayout>
          <Compliance />
        </TopbarLayout>
      </Route>
      <Route path="/interactions">
        <TopbarLayout>
          <Interactions />
        </TopbarLayout>
      </Route>
      <Route path="/evaluations">
        <TopbarLayout>
          <Evaluations />
        </TopbarLayout>
      </Route>
      <Route path="/audit">
        <TopbarLayout>
          <Audit />
        </TopbarLayout>
      </Route>
      <Route path="/users">
        <TopbarLayout>
          <Users />
        </TopbarLayout>
      </Route>
      <Route path="/reports">
        <TopbarLayout>
          <Reports />
        </TopbarLayout>
      </Route>
      <Route path="/contract-templates">
        <TopbarLayout>
          <ContractTemplates />
        </TopbarLayout>
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
        <BusinessUnitProvider>
          <SelectedCompanyProvider>
          <CompanyProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CompanyProvider>
          </SelectedCompanyProvider>
        </BusinessUnitProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
