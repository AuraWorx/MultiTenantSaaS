import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Footer } from "@/components/layout/footer";
import AuthPage from "./pages/auth-page";
import DashboardPage from "./pages/dashboard-page";
import MapPage from "./pages/map-page";
import MeasurePage from "./pages/measure-page";
import ManagePage from "./pages/manage-page";
import UserManagementPage from "./pages/user-management-page";
import AdminPage from "./pages/admin-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/map" component={MapPage} />
      <ProtectedRoute path="/measure" component={MeasurePage} />
      <ProtectedRoute path="/manage" component={ManagePage} />
      <ProtectedRoute path="/users" component={UserManagementPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <Toaster />
            <div className="flex-grow">
              <Router />
            </div>
            <Footer />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
