import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BusinessUnitProvider } from "./contexts/BusinessUnitContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { SelectedCompanyProvider } from "./contexts/SelectedCompanyContext";
import { OrgGroupProvider } from "./contexts/OrgGroupContext";
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
import UnitSuppliers from "./pages/UnitSuppliers";
import GenerateContract from "./pages/GenerateContract";
import InternalLogin from "./pages/InternalLogin";
import AccessDenied from "./pages/AccessDenied";
import AdminRoute from "./components/AdminRoute";

/** Routes that require authentication — wrapped with data providers */
function ProtectedRoutes() {
  return (
    <OrgGroupProvider>
    <BusinessUnitProvider>
      <SelectedCompanyProvider>
        <CompanyProvider>
          <Switch>
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

            {/* Central de gestão de fornecedores da unidade */}
            <Route path="/unit-suppliers">
              <TopbarLayout>
                <UnitSuppliers />
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
            <Route path="/suppliers/new-ai">
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
                <AdminRoute>
                  <Audit />
                </AdminRoute>
              </TopbarLayout>
            </Route>
            <Route path="/users">
              <TopbarLayout>
                <AdminRoute>
                  <Users />
                </AdminRoute>
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
            <Route path="/generate-contract">
              <TopbarLayout>
                <GenerateContract />
              </TopbarLayout>
            </Route>
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </CompanyProvider>
      </SelectedCompanyProvider>
    </BusinessUnitProvider>
    </OrgGroupProvider>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes — NO data providers, NO auth queries */}
      <Route path="/login" component={InternalLogin} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/403" component={AccessDenied} />

      {/* All other routes go through protected wrapper */}
      <Route>
        <ProtectedRoutes />
      </Route>
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
