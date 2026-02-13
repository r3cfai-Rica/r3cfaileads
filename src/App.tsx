import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Plans from "./pages/Plans";
import PaymentSuccess from "./pages/PaymentSuccess";
import Dashboard from "./pages/Dashboard";
import Prospecting from "./pages/Prospecting";
import CRM from "./pages/CRM";
import Automations from "./pages/Automations";
import Campaigns from "./pages/Campaigns";
import Messaging from "./pages/Messaging";
import Inbox from "./pages/Inbox";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AdminTools from "./pages/AdminTools";
import UsageMonitorPage from "./pages/UsageMonitorPage";
import AdminCustomers from "./pages/AdminCustomers";
import PremiumReport from "./pages/PremiumReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// App component with proper provider hierarchy
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/premium-report" element={<PremiumReport />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/prospecting" element={<Prospecting />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/automations" element={<Automations />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/messaging" element={<Messaging />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/help" element={<Help />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/tools" element={<AdminTools />} />
              <Route path="/admin/usage" element={<UsageMonitorPage />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
