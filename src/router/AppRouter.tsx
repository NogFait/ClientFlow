import { lazy, Suspense, type ReactElement } from "react"
import { Routes, Route } from "react-router-dom"
import LandingPage from "../pages/landing/LandingPage"
import NotFoundPage from "../pages/not-found/NotFoundPage"
import Layout from "../components/layout/Layout/Layout"
import { ProtectedRoute } from "../components/auth/ProtectedRoute"
import { PublicOnlyRoute } from "../components/auth/PublicOnlyRoute"
import LocaleRoute from "../components/i18n/LocaleRoute"
import { SUPPORTED_LANGS } from "../i18n"
import { toLocalizedPath } from "../i18n/paths"

// Landing is eager: it's the entry point for most visitors (including
// crawlers hitting "/" first), so lazy-loading it would force an extra
// request waterfall (HTML -> main bundle -> route chunk) before anything
// renders. Everything else is lazy — /pricing, /terms, /privacy, /blog are only
// ever a click away from the landing, and every authenticated app page
// (plus login/register) is never needed by an anonymous visitor just
// browsing the public site, so none of it should bloat the initial bundle.
const PricingPage = lazy(() => import("../pages/pricing/PricingPage"))
const TermsPage = lazy(() => import("../pages/legal/TermsPage"))
const PrivacyPage = lazy(() => import("../pages/legal/PrivacyPage"))
const BlogIndexPage = lazy(() => import("../pages/blog/BlogIndexPage"))
const BlogPostPage = lazy(() => import("../pages/blog/BlogPostPage"))

const Login = lazy(() => import("../pages/auth/Login/Login"))
const Register = lazy(() => import("../pages/auth/Register/Register"))
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword/ForgotPassword"))
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword/ResetPassword"))

const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"))
const ClientsPage = lazy(() => import("../pages/clients/ClientsPage"))
const ProjectsPage = lazy(() => import("../pages/projects/ProjectsPage"))
const ProjectHubPage = lazy(() => import("../pages/projects/ProjectHubPage/ProjectHubPage"))
const TaskPage = lazy(() => import("../pages/tasks/TaskPage"))
const PaymentsPage = lazy(() => import("../pages/payments/PaymentsPage"))
const BillingSettingsPage = lazy(() => import("../pages/settings/billing/BillingSettingsPage"))

// The localized public pages exist once per language — Spanish at the
// canonical path, English under /en — each wrapped in a LocaleRoute that
// switches the i18n instance to the URL's language. Registering them from
// one list keeps "/en/pricing exists" and "/pricing exists" one fact.
// Landing is always public — it never redirects a logged-in visitor away;
// PublicNav just swaps its CTAs for "Ir al dashboard".
const LOCALIZED_PUBLIC_ROUTES: Array<[path: string, element: ReactElement]> = [
  ["/", <LandingPage />],
  ["/pricing", <PricingPage />],
  ["/terms", <TermsPage />],
  ["/privacy", <PrivacyPage />],
]

const AppRouter = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        {LOCALIZED_PUBLIC_ROUTES.flatMap(([path, element]) =>
          SUPPORTED_LANGS.map((lang) => {
            const localizedPath = toLocalizedPath(path, lang)
            return (
              <Route key={localizedPath} path={localizedPath} element={<LocaleRoute lang={lang}>{element}</LocaleRoute>} />
            )
          }),
        )}
        {/* Blog is Spanish-only: pinned to "es" so its chrome matches the
            posts even when reached from an English page. No /en twin. */}
        {/* Blog: posts are Spanish, but the frame follows the user's language
            (stored preference, applied by the pages themselves) — no LocaleRoute. */}
        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        <Route path="/login" element={<PublicOnlyRoute><Login/></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register/></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword/></PublicOnlyRoute>} />
        {/* Deliberately NOT PublicOnly: the recovery link signs the visitor in
            before landing here (see ResetPassword.tsx). */}
        <Route path="/reset-password" element={<ResetPassword/>} />

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
