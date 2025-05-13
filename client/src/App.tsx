import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Footer } from "@/components/layout/footer";
import { Sidebar } from "./components/layout/sidebar";
import { Button } from "@/components/ui/button";
import AuthPage from "./pages/auth-page";
import DashboardPage from "./pages/dashboard-page";
import MapPage from "./pages/map-page";
import MeasurePage from "./pages/measure-page";
import ManagePage from "./pages/manage-page";
import UserManagementPage from "./pages/user-management-page";
import RiskRegisterPage from "./pages/risk-register-page";
import AdminPage from "./pages/admin-page";
import FrontierModelsPage from "./pages/frontier-models-page";
import { ReactNode } from "react";

// Theme toggle button
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full absolute top-4 right-4 z-50"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Conditionally render the footer based on user permissions
function ConditionalFooter() {
  const { user } = useAuth();
  const isAdmin = user?.role?.permissions?.includes("admin");
  
  // Only show footer for admin users
  if (isAdmin) {
    return <Footer />;
  }
  
  return null;
}

// Layout wrapper for authenticated pages that includes the sidebar
function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-grow overflow-auto">
        <ThemeToggle />
        {children}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={() => (
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/map" component={() => (
        <AppLayout>
          <MapPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/measure" component={() => (
        <AppLayout>
          <MeasurePage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/manage" component={() => (
        <AppLayout>
          <ManagePage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/risk-register" component={() => (
        <AppLayout>
          <RiskRegisterPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/users" component={() => (
        <AppLayout>
          <UserManagementPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/admin" component={() => (
        <AppLayout>
          <AdminPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/frontier-models" component={() => (
        <AppLayout>
          <FrontierModelsPage />
        </AppLayout>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <div className="flex flex-col min-h-screen">
              <Toaster />
              <div className="flex-grow">
                <Router />
              </div>
              <ConditionalFooter />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
