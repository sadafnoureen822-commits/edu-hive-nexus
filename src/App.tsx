import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import InstitutionsPage from "./pages/admin/Institutions";
import InstitutionDetail from "./pages/admin/InstitutionDetail";
import DomainsPage from "./pages/admin/Domains";
import MembersPage from "./pages/admin/Members";
import BillingDashboard from "./pages/admin/BillingDashboard";
import InstitutionLayout from "./components/layout/InstitutionLayout";
import InstitutionOverview from "./pages/institution/InstitutionOverview";
import InstitutionProfile from "./pages/institution/InstitutionProfile";
import UserManagement from "./pages/institution/UserManagement";
import AcademicControl from "./pages/institution/AcademicControl";
import CommunicationCenter from "./pages/institution/CommunicationCenter";
import BillingSubscription from "./pages/institution/BillingSubscription";
import InstitutionSettings from "./pages/institution/InstitutionSettings";
import ExamManagement from "./pages/institution/ExamManagement";
import CmsPages from "./pages/institution/cms/CmsPages";
import CmsPageEditor from "./pages/institution/cms/CmsPageEditor";
import CmsMenuManager from "./pages/institution/cms/CmsMenuManager";
import CmsMediaManager from "./pages/institution/cms/CmsMediaManager";
import CmsSiteSettings from "./pages/institution/cms/CmsSiteSettings";
import CoursesPage from "./pages/institution/lms/CoursesPage";
import AssignmentsPage from "./pages/institution/lms/AssignmentsPage";
import QuizzesPage from "./pages/institution/lms/QuizzesPage";
import CertificatesPage from "./pages/institution/lms/CertificatesPage";
import AttendancePage from "./pages/institution/AttendancePage";
import StudentDashboard from "./pages/institution/portals/StudentDashboard";
import TeacherDashboard from "./pages/institution/portals/TeacherDashboard";
import ParentDashboard from "./pages/institution/portals/ParentDashboard";
import TimetablePage from "./pages/institution/TimetablePage";
import FeeManagement from "./pages/institution/FeeManagement";
import AnnouncementsPage from "./pages/institution/AnnouncementsPage";
import AdmissionsPage from "./pages/institution/AdmissionsPage";
import StudentProfilesPage from "./pages/institution/StudentProfilesPage";
import NotificationCenter from "./pages/institution/NotificationCenter";
import ActivityLogsPage from "./pages/institution/ActivityLogsPage";
import StudentPromotionsPage from "./pages/institution/StudentPromotionsPage";
import ApiKeysPage from "./pages/institution/ApiKeysPage";
import PublicSite from "./pages/public/PublicSite";
import ResetPassword from "./pages/ResetPassword";
import MarksResultsPage from "./pages/institution/MarksResultsPage";
import CertificateVerification from "./pages/public/CertificateVerification";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Admin routes (platform admin) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requirePlatformAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="institutions" element={<InstitutionsPage />} />
              <Route path="institutions/:id" element={<InstitutionDetail />} />
              <Route path="domains" element={<DomainsPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="billing" element={<BillingDashboard />} />
            </Route>

            {/* Institution routes (tenant) */}
            <Route
              path="/:slug"
              element={
                <TenantProvider>
                  <InstitutionLayout />
                </TenantProvider>
              }
            >
              <Route index element={<InstitutionOverview />} />
              <Route path="profile" element={<InstitutionProfile />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="academics" element={<AcademicControl />} />
              <Route path="exams" element={<ExamManagement />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="communication" element={<CommunicationCenter />} />
              <Route path="billing" element={<BillingSubscription />} />
              <Route path="settings" element={<InstitutionSettings />} />
              {/* Academics extras */}
              <Route path="timetable" element={<TimetablePage />} />
              <Route path="fees" element={<FeeManagement />} />
              <Route path="admissions" element={<AdmissionsPage />} />
              <Route path="student-profiles" element={<StudentProfilesPage />} />
              <Route path="promotions" element={<StudentPromotionsPage />} />
              {/* CMS */}
              <Route path="cms" element={<CmsPages />} />
              <Route path="cms/pages/:pageId" element={<CmsPageEditor />} />
              <Route path="cms/menus" element={<CmsMenuManager />} />
              <Route path="cms/media" element={<CmsMediaManager />} />
              <Route path="cms/settings" element={<CmsSiteSettings />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              {/* LMS */}
              <Route path="courses" element={<CoursesPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="quizzes" element={<QuizzesPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              {/* Admin utilities */}
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="activity-logs" element={<ActivityLogsPage />} />
              <Route path="api-keys" element={<ApiKeysPage />} />
              {/* Role Portals */}
              <Route path="student" element={<StudentDashboard />} />
              <Route path="teacher" element={<TeacherDashboard />} />
              <Route path="parent" element={<ParentDashboard />} />
            </Route>

            {/* Marks & Results under institution */}
            <Route path="/site/:slug/*" element={<PublicSite />} />
            <Route path="/verify" element={<CertificateVerification />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
