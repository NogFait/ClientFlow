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
import TaskPage from "../pages/tasks/TaskPage"
import PaymentsPage from "../pages/payments/PaymentsPage"

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<PublicOnlyRoute><Login/></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register/></PublicOnlyRoute>} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage/>}/>
          <Route path="/projects" element={<ProjectsPage/>}/>
          <Route path="/tasks" element={<TaskPage/>}/>
          <Route path="/payments" element={<PaymentsPage/>}/>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter