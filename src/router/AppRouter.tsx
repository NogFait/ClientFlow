import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import DashboardPage from "../pages/dashboard/DashboardPage"
import Login from "../pages/auth/Login/Login"
import Register from "../pages/auth/Register/Register"
import NotFoundPage from "../pages/not-found/NotFoundPage"
import Layout from "../components/layout/Layout/Layout"
import { ProtectedRoute } from "../components/auth/ProtectedRoute"
import { PublicOnlyRoute } from "../components/auth/PublicOnlyRoute"
import ClientsPage from "../pages/clients/ClientsPage"
import ProjectsPage from "../pages/projects/ProjectsPage"
import ProjectHubPage from "../pages/projects/ProjectHubPage/ProjectHubPage"
import TaskPage from "../pages/tasks/TaskPage"
import PaymentsPage from "../pages/payments/PaymentsPage"
import BillingSettingsPage from "../pages/settings/billing/BillingSettingsPage"

// Public marketing/legal pages are lazy — they're reachable by anyone
// (including crawlers hitting "/" first) but never needed by an
// already-authenticated user navigating the app shell, so they shouldn't
// bloat the initial bundle for the common logged-in case.
const LandingPage = lazy(() => import("../pages/landing/LandingPage"))
const PricingPage = lazy(() => import("../pages/pricing/PricingPage"))
const TermsPage = lazy(() => import("../pages/legal/TermsPage"))
const PrivacyPage = lazy(() => import("../pages/legal/PrivacyPage"))

const AppRouter = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Landing is always public — it never redirects a logged-in visitor
            away; PublicNav just swaps its CTAs for "Ir al dashboard". */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        <Route path="/login" element={<PublicOnlyRoute><Login/></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register/></PublicOnlyRoute>} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage/>}/>
            <Route path="/projects" element={<ProjectsPage/>}/>
            <Route path="/projects/:id" element={<ProjectHubPage/>}/>
            <Route path="/tasks" element={<TaskPage/>}/>
            <Route path="/payments" element={<PaymentsPage/>}/>
            <Route path="/settings/billing" element={<BillingSettingsPage/>}/>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter
