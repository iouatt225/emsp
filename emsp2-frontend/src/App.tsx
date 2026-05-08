import { lazy, Suspense, type ReactNode, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/common/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { getAdminHomePath, fullAdminRoles, limitedAdminRoles } from "./config/adminPortal";
import { useAuth } from "./hooks/useAuth";
import AdminPortalLayout from "./layouts/portal/AdminPortalLayout";
import DriverPortalLayout from "./layouts/portal/DriverPortalLayout";
import StudentPortalLayout from "./layouts/portal/StudentPortalLayout";
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPortalPage = lazy(() => import("./pages/auth/RegisterPortalPage"));
const UnauthorizedPage = lazy(() => import("./pages/auth/UnauthorizedPage"));
const ActualiteDetailPage = lazy(() => import("./pages/public/ActualiteDetailPage"));
const ActualitesPage = lazy(() => import("./pages/public/ActualitesPage"));
const ContactPage = lazy(() => import("./pages/public/ContactPage"));
const FormationCategoryPage = lazy(() => import("./pages/public/FormationCategoryPage"));
const FormationDetailPage = lazy(() => import("./pages/public/FormationDetailPage"));
const FormationsPage = lazy(() => import("./pages/public/FormationsPage"));
const HomePage = lazy(() => import("./pages/public/HomePage"));
const InscriptionPage = lazy(() => import("./pages/public/InscriptionPage"));
const MediathequePage = lazy(() => import("./pages/public/MediathequePage"));

const AdminAcademicPage = lazy(() => import("./pages/portal/admin/AdminAcademicPage"));
const AdminAccountingPage = lazy(() => import("./pages/portal/admin/AdminAccountingPage"));
const AdminDashboardPage = lazy(() => import("./pages/portal/admin/AdminDashboardPage"));
const AdminMediaLibraryPage = lazy(() => import("./pages/portal/admin/AdminMediaLibraryPage"));
const AdminNewsPage = lazy(() => import("./pages/portal/admin/AdminNewsPage"));
const AdminApplicationsPage = lazy(() => import("./pages/portal/admin/AdminApplicationsPage"));
const AdminSettingsPage = lazy(() => import("./pages/portal/admin/AdminSettingsPage"));
const AdminStatisticsPage = lazy(() => import("./pages/portal/admin/AdminStatisticsPage"));
const AdminStudentsPage = lazy(() => import("./pages/portal/admin/AdminStudentsPage"));
const AdminTeachersPage = lazy(() => import("./pages/portal/admin/AdminTeachersPage"));
const AdminTransportPage = lazy(() => import("./pages/portal/admin/AdminTransportPage"));
const DriverTransportPage = lazy(() => import("./pages/portal/driver/DriverTransportPage"));
const StudentDashboardPage = lazy(() => import("./pages/portal/student/StudentDashboardPage"));
const StudentDocumentsPage = lazy(() => import("./pages/portal/student/StudentDocumentsPage"));
const StudentForumPage = lazy(() => import("./pages/portal/student/StudentForumPage"));
const StudentNotesPage = lazy(() => import("./pages/portal/student/StudentNotesPage"));
const StudentPaymentsPage = lazy(() => import("./pages/portal/student/StudentPaymentsPage"));
const StudentProfilePage = lazy(() => import("./pages/portal/student/StudentProfilePage"));
const StudentSchedulePage = lazy(() => import("./pages/portal/student/StudentSchedulePage"));
const StudentStagesPage = lazy(() => import("./pages/portal/student/StudentStagesPage"));

const PortalFallback = () => <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />;
const RouteElement = ({ children }: { children: ReactNode }) => <Suspense fallback={<PortalFallback />}>{children}</Suspense>;

const DashboardExternalRedirect = () => {
  useEffect(() => {
    window.location.replace("/admin/dashboard");
  }, []);

  return <PortalFallback />;
};

const AdminIndexRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getAdminHomePath(user?.role)} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<RouteElement><LoginPage /></RouteElement>} />
      <Route path="/dashboard/*" element={<DashboardExternalRedirect />} />
      <Route path="/register" element={<RouteElement><RegisterPortalPage /></RouteElement>} />
      <Route path="/unauthorized" element={<RouteElement><UnauthorizedPage /></RouteElement>} />

      <Route element={<Layout />}>
        <Route path="/" element={<RouteElement><HomePage /></RouteElement>} />
        <Route path="/formations" element={<RouteElement><FormationsPage /></RouteElement>} />
        <Route path="/formations/fsp" element={<RouteElement><FormationCategoryPage programType="FSP" /></RouteElement>} />
        <Route path="/formations/fsp/:code" element={<RouteElement><FormationDetailPage /></RouteElement>} />
        <Route path="/formations/fs-menum" element={<RouteElement><FormationCategoryPage programType="FS-MENUM" /></RouteElement>} />
        <Route path="/formations/fs-menum/:code" element={<RouteElement><FormationDetailPage /></RouteElement>} />
        <Route path="/formations/certifiantes" element={<RouteElement><FormationCategoryPage programType="FCQ" /></RouteElement>} />
        <Route path="/formations/certifiantes/:code" element={<RouteElement><FormationDetailPage /></RouteElement>} />
        <Route path="/inscription" element={<RouteElement><InscriptionPage /></RouteElement>} />
        <Route path="/actualites" element={<RouteElement><ActualitesPage /></RouteElement>} />
        <Route path="/actualites/:slug" element={<RouteElement><ActualiteDetailPage /></RouteElement>} />
        <Route path="/mediatheque" element={<RouteElement><MediathequePage /></RouteElement>} />
        <Route path="/contact" element={<RouteElement><ContactPage /></RouteElement>} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["etudiant"]} />}>
        <Route path="/etudiant" element={<StudentPortalLayout />}>
          <Route index element={<Navigate to="/etudiant/dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<PortalFallback />}><StudentDashboardPage /></Suspense>} />
          <Route path="notes" element={<Suspense fallback={<PortalFallback />}><StudentNotesPage /></Suspense>} />
          <Route path="edt" element={<Suspense fallback={<PortalFallback />}><StudentSchedulePage /></Suspense>} />
          <Route path="paiements" element={<Suspense fallback={<PortalFallback />}><StudentPaymentsPage /></Suspense>} />
          <Route path="documents" element={<Suspense fallback={<PortalFallback />}><StudentDocumentsPage /></Suspense>} />
          <Route path="communaute" element={<Suspense fallback={<PortalFallback />}><StudentForumPage /></Suspense>} />
          <Route path="profil" element={<Suspense fallback={<PortalFallback />}><StudentProfilePage /></Suspense>} />
          <Route path="forum" element={<Navigate to="/etudiant/communaute" replace />} />
          <Route path="stages" element={<Suspense fallback={<PortalFallback />}><StudentStagesPage /></Suspense>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["chauffeur"]} />}>
        <Route path="/chauffeur" element={<DriverPortalLayout />}>
          <Route index element={<Navigate to="/chauffeur/transport" replace />} />
          <Route path="transport" element={<Suspense fallback={<PortalFallback />}><DriverTransportPage /></Suspense>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={limitedAdminRoles} />}>
        <Route path="/admin" element={<AdminPortalLayout />}>
          <Route index element={<AdminIndexRedirect />} />

          <Route path="etudiants" element={<AdminStudentsPage />} />
          <Route path="scolarite" element={<AdminAcademicPage />} />
          <Route path="comptabilite" element={<AdminAccountingPage />} />
          <Route path="transport" element={<AdminTransportPage />} />

          <Route element={<ProtectedRoute allowedRoles={fullAdminRoles} />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="candidatures" element={<AdminApplicationsPage />} />
            <Route path="enseignants" element={<AdminTeachersPage />} />
            <Route path="statistiques" element={<AdminStatisticsPage />} />
            <Route path="medias" element={<Navigate to="/admin/mediatheque" replace />} />
            <Route path="mediatheque" element={<AdminMediaLibraryPage />} />
            <Route path="actualites" element={<AdminNewsPage />} />
            <Route path="parametres" element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
