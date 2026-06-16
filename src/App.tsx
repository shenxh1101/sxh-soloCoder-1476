import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import DashboardPage from "@/pages/DashboardPage";
import WorkersPage from "@/pages/WorkersPage";
import WorkerFormPage from "@/pages/WorkerFormPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderFormPage from "@/pages/OrderFormPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import ScheduleCalendarPage from "@/pages/ScheduleCalendarPage";
import CustomersPage from "@/pages/CustomersPage";
import CustomerDetailPage from "@/pages/CustomerDetailPage";
import TimeTrackingPage from "@/pages/TimeTrackingPage";
import PerformancePage from "@/pages/PerformancePage";
import ReviewsPage from "@/pages/ReviewsPage";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workers" element={<WorkersPage />} />
          <Route path="/workers/new" element={<WorkerFormPage />} />
          <Route path="/workers/:id/edit" element={<WorkerFormPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/new" element={<OrderFormPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/schedule" element={<ScheduleCalendarPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/time-tracking" element={<TimeTrackingPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
