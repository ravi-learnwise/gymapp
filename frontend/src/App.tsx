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
import ExerciseLibraryPage from './pages/config/ExerciseLibraryPage';
import TrainingPlanTemplateListPage from './pages/config/TrainingPlanTemplateListPage';
import TrainingPlanTemplateEditorPage from './pages/config/TrainingPlanTemplateEditorPage';
import DietPlanTemplateListPage from './pages/config/DietPlanTemplateListPage';
import DietPlanTemplateEditorPage from './pages/config/DietPlanTemplateEditorPage';
import UsersPage, { ProfilePage } from './pages/UsersPage';
import EnquiryListPage from './pages/enquiries/EnquiryListPage';
import EnquiryFormPage from './pages/enquiries/EnquiryFormPage';
import EnquiryDetailPage from './pages/enquiries/EnquiryDetailPage';
import EnrollmentWizardPage from './pages/enrollment/EnrollmentWizardPage';
import MemberListPage from './pages/members/MemberListPage';
import MemberDetailPage from './pages/members/MemberDetailPage';
import AddMembershipPage from './pages/members/AddMembershipPage';
import MemberTrainingCardPage from './pages/members/MemberTrainingCardPage';
import ExpiringMembershipsPage from './pages/members/ExpiringMembershipsPage';
import AttendancePage from './pages/attendance/AttendancePage';
import ReportsPage from './pages/reports/ReportsPage';
import PaymentListPage from './pages/payments/PaymentListPage';
import PaymentDetailPage from './pages/payments/PaymentDetailPage';
import ReceiptPrintPage from './pages/payments/ReceiptPrintPage';
import TrainingCardEditorPage from './pages/training/TrainingCardEditorPage';
import MemberDietPlanPage from './pages/members/MemberDietPlanPage';
import DietPlanEditorPage from './pages/diet/DietPlanEditorPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute roles={['OWNER', 'MANAGER']} />}>
        <Route path="/payments/:id/receipt/:transactionId/print" element={<ReceiptPrintPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<ProtectedRoute roles={['OWNER', 'MANAGER']} />}>
            <Route path="/config/gym" element={<GymConfigPage />} />
            <Route path="/config/programs" element={<ProgramsPage />} />
            <Route path="/config/discounts" element={<DiscountsPage />} />
            <Route path="/config/offers" element={<OffersPage />} />
            <Route path="/config/exercises" element={<ExerciseLibraryPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['OWNER']} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['OWNER', 'MANAGER']} />}>
            <Route path="/enquiries" element={<EnquiryListPage />} />
            <Route path="/enquiries/new" element={<EnquiryFormPage />} />
            <Route path="/enquiries/:id" element={<EnquiryDetailPage />} />
            <Route path="/enquiries/:id/edit" element={<EnquiryFormPage />} />
            <Route path="/enrollments/new" element={<EnrollmentWizardPage />} />
            <Route path="/payments" element={<PaymentListPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/members/expiring" element={<ExpiringMembershipsPage />} />
          </Route>

          <Route path="/members" element={<MemberListPage />} />
          <Route path="/members/:id" element={<MemberDetailPage />} />
          <Route path="/members/:id/add-program" element={<AddMembershipPage />} />
          <Route path="/members/:id/training-card" element={<MemberTrainingCardPage />} />
          <Route path="/members/:id/training-card/new" element={<TrainingCardEditorPage />} />
          <Route path="/training-cards/:id/edit" element={<TrainingCardEditorPage />} />
          <Route path="/members/:id/diet-plan" element={<MemberDietPlanPage />} />
          <Route path="/members/:id/diet-plan/new" element={<DietPlanEditorPage />} />
          <Route path="/diet-plans/:id/edit" element={<DietPlanEditorPage />} />
          <Route path="/config/training-templates" element={<TrainingPlanTemplateListPage />} />
          <Route path="/config/training-templates/new" element={<TrainingPlanTemplateEditorPage />} />
          <Route path="/config/training-templates/:id/edit" element={<TrainingPlanTemplateEditorPage />} />
          <Route path="/config/diet-templates" element={<DietPlanTemplateListPage />} />
          <Route path="/config/diet-templates/new" element={<DietPlanTemplateEditorPage />} />
          <Route path="/config/diet-templates/:id/edit" element={<DietPlanTemplateEditorPage />} />
          <Route path="/payments/:id" element={<PaymentDetailPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
