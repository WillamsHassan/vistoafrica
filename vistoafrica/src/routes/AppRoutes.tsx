import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '../components/ProtectedRoute'
import { AdminAuthProvider } from '../contexts/AdminAuthContext'
import AdminLayout from '../layouts/AdminLayout'
import PublicLayout from '../layouts/PublicLayout'
import AboutPage from '../pages/AboutPage'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminEtudiantsPage from '../pages/admin/AdminEtudiantsPage'
import AdminEtudiantDetailPage from '../pages/admin/AdminEtudiantDetailPage'
import AdminFacturesPage from '../pages/admin/AdminFacturesPage'
import AdminFormationsPage from '../pages/admin/AdminFormationsPage'
import AdminInscriptionsPage from '../pages/admin/AdminInscriptionsPage'
import AdminInscriptionDetailPage from '../pages/admin/AdminInscriptionDetailPage'
import AdminLoginPage from '../pages/admin/AdminLoginPage'
import AdminMessagesPage from '../pages/admin/AdminMessagesPage'
import AdminPaiementsPage from '../pages/admin/AdminPaiementsPage'
import AdminParametresPage from '../pages/admin/AdminParametresPage'
import ContactPage from '../pages/ContactPage'
import CoursAnglaisPage from '../pages/CoursAnglaisPage'
import CoursItalienPage from '../pages/CoursItalienPage'
import HomePage from '../pages/HomePage'
import PaymentPage from '../pages/PaymentPage'
import RegistrationPage from '../pages/RegistrationPage'
import RegistrationSuccessPage from '../pages/RegistrationSuccessPage'
import RegistrationSummaryPage from '../pages/RegistrationSummaryPage'
import VisaPage from '../pages/VisaPage'

const AppRoutes = () => {
  return (
    <AdminAuthProvider>
      <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cours-italien" element={<CoursItalienPage />} />
        <Route path="/cours-anglais" element={<CoursAnglaisPage />} />
        <Route path="/visa" element={<VisaPage />} />
        <Route path="/a-propos" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/inscription" element={<RegistrationPage />} />
        <Route path="/inscription/recapitulatif" element={<RegistrationSummaryPage />} />
        <Route path="/inscription/paiement" element={<PaymentPage />} />
        <Route path="/inscription/succes" element={<RegistrationSuccessPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/etudiants" element={<AdminEtudiantsPage />} />
        <Route path="/admin/etudiants/:id" element={<AdminEtudiantDetailPage />} />
        <Route path="/admin/inscriptions" element={<AdminInscriptionsPage />} />
        <Route path="/admin/inscriptions/:id" element={<AdminInscriptionDetailPage />} />
        <Route path="/admin/paiements" element={<AdminPaiementsPage />} />
        <Route path="/admin/formations" element={<AdminFormationsPage />} />
        <Route path="/admin/factures" element={<AdminFacturesPage />} />
        <Route path="/admin/messages" element={<AdminMessagesPage />} />
        <Route path="/admin/parametres" element={<AdminParametresPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminAuthProvider>
  )
}

export default AppRoutes
