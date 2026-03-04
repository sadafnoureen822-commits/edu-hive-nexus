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
import PublicSite from "./pages/public/PublicSite";

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
            </Route>

            {/* Institution admin routes (tenant) */}
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
              <Route path="communication" element={<CommunicationCenter />} />
              <Route path="billing" element={<BillingSubscription />} />
              <Route path="settings" element={<InstitutionSettings />} />
              <Route path="cms" element={<CmsPages />} />
              <Route path="cms/pages/:pageId" element={<CmsPageEditor />} />
              <Route path="cms/menus" element={<CmsMenuManager />} />
              <Route path="cms/media" element={<CmsMediaManager />} />
              <Route path="cms/settings" element={<CmsSiteSettings />} />
              {/* LMS Routes */}
              <Route path="courses" element={<CoursesPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="quizzes" element={<QuizzesPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              {/* Attendance */}
              <Route path="attendance" element={<AttendancePage />} />
              {/* Role Portals */}
              <Route path="student" element={<StudentDashboard />} />
              <Route path="teacher" element={<TeacherDashboard />} />
            </Route>

            {/* Public institution website */}
            <Route path="/site/:slug/*" element={<PublicSite />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
