import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import LandingPage from "../pages/landing/LandingPage"
import NotFoundPage from "../pages/not-found/NotFoundPage"
import Layout from "../components/layout/Layout/Layout"
import { ProtectedRoute } from "../components/auth/ProtectedRoute"
import { PublicOnlyRoute } from "../components/auth/PublicOnlyRoute"

// Landing is eager: it's the entry point for most visitors (including
// crawlers hitting "/" first), so lazy-loading it would force an extra
// request waterfall (HTML -> main bundle -> route chunk) before anything
// renders. Everything else is lazy — /pricing, /terms, /privacy are only
// ever a click away from the landing, and every authenticated app page
// (plus login/register) is never needed by an anonymous visitor just
// browsing the public site, so none of it should bloat the initial bundle.
const PricingPage = lazy(() => import("../pages/pricing/PricingPage"))
const TermsPage = lazy(() => import("../pages/legal/TermsPage"))
const PrivacyPage = lazy(() => import("../pages/legal/PrivacyPage"))

const Login = lazy(() => import("../pages/auth/Login/Login"))
const Register = lazy(() => import("../pages/auth/Register/Register"))

const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"))
const ClientsPage = lazy(() => import("../pages/clients/ClientsPage"))
const ProjectsPage = lazy(() => import("../pages/projects/ProjectsPage"))
const ProjectHubPage = lazy(() => import("../pages/projects/ProjectHubPage/ProjectHubPage"))
const TaskPage = lazy(() => import("../pages/tasks/TaskPage"))
const PaymentsPage = lazy(() => import("../pages/payments/PaymentsPage"))
const BillingSettingsPage = lazy(() => import("../pages/settings/billing/BillingSettingsPage"))

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
