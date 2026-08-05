import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import GymConfigPage from './pages/config/GymConfigPage';
import ProgramsPage from './pages/config/ProgramsPage';
import DiscountsPage from './pages/config/DiscountsPage';
import OffersPage from './pages/config/OffersPage';
import UsersPage, { ProfilePage } from './pages/UsersPage';
import EnquiryListPage from './pages/enquiries/EnquiryListPage';
import EnquiryFormPage from './pages/enquiries/EnquiryFormPage';
import EnquiryDetailPage from './pages/enquiries/EnquiryDetailPage';
import EnrollmentWizardPage from './pages/enrollment/EnrollmentWizardPage';
import MemberListPage from './pages/members/MemberListPage';
import MemberDetailPage from './pages/members/MemberDetailPage';
import AttendancePage from './pages/attendance/AttendancePage';
import ReportsPage from './pages/reports/ReportsPage';
import PaymentListPage from './pages/payments/PaymentListPage';
import PaymentDetailPage from './pages/payments/PaymentDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/config/gym" element={<GymConfigPage />} />
          <Route path="/config/programs" element={<ProgramsPage />} />
          <Route path="/config/discounts" element={<DiscountsPage />} />
          <Route path="/config/offers" element={<OffersPage />} />
          <Route path="/users" element={<UsersPage />} />

          {/* Enquiry CRM — Owner & Manager only */}
          <Route element={<ProtectedRoute roles={['OWNER', 'MANAGER']} />}>
            <Route path="/enquiries" element={<EnquiryListPage />} />
            <Route path="/enquiries/new" element={<EnquiryFormPage />} />
            <Route path="/enquiries/:id" element={<EnquiryDetailPage />} />
            <Route path="/enquiries/:id/edit" element={<EnquiryFormPage />} />
            <Route path="/enrollments/new" element={<EnrollmentWizardPage />} />
            <Route path="/payments" element={<PaymentListPage />} />
            <Route path="/payments/:id" element={<PaymentDetailPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Members — all roles (Trainer sees assigned only) */}
          <Route path="/members" element={<MemberListPage />} />
          <Route path="/members/:id" element={<MemberDetailPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
