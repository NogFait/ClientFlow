import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabaseClient"
import { getClients } from "../../features/clients/services"
import { getProjects } from "../../features/projects/services"
import { getPayments } from "../../features/payments/services"
import { getTasks } from "../../features/tasks/services"
import { Users, Briefcase, DollarSign, Clock, Calendar } from "lucide-react"
import type { ITask } from "../../features/tasks/types"
import StatCard from "../../components/shared/StatCard/StatCard"
import PageHeader from "../../components/shared/PageHeader/PageHeader"
import Loader from "../../components/shared/Loader/Loader"
import { BarChart } from "../../components/charts/BarChart"
import styles from "./DashboardPage.module.css"

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const DashboardPage = () => {
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [totalClients, setTotalClients] = useState(0)
  const [activeProjects, setActiveProjects] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [pendingTasks, setPendingTasks] = useState(0)
  const [progressTasks, setProgressTasks] = useState(0)
  const [monthlyEarnings, setMonthlyEarnings] = useState<{ month: string; total: number }[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<(ITask & { proyectos?: { name: string } | null })[]>([])
  const [loading, setLoading] = useState(true)

  const priorityColor: Record<string, string> = {
    low: "var(--color-success)",
    medium: "var(--color-warning)",
    high: "var(--color-error)",
  }

  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ name: data.user.user_metadata?.name ?? "Usuario" })
    })

    Promise.all([
      getClients(),
      getProjects(),
      getPayments(),
      getTasks(),
    ]).then(([clients, projects, payments, tasks]) => {
      setTotalClients(clients.length)
      setActiveProjects(projects.filter(p => p.status === "activo").length)
      setPendingTasks(tasks.filter(t => t.status === "pendiente").length)
      setProgressTasks(tasks.filter(t => t.status === "en_progreso").length)

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const income = payments
        .filter(p => {
          if (p.status !== "pagado" || !p.payment_date) return false
          const d = new Date(p.payment_date)
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
        .reduce((sum, p) => sum + Number(p.amount), 0)
      setMonthlyIncome(income)

      const byMonth = new Map<string, number>()
      payments
        .filter(p => {
          if (p.status !== "pagado" || !p.payment_date) return false
          const d = new Date(p.payment_date)
          return d.getFullYear() < currentYear || (d.getFullYear() === currentYear && d.getMonth() <= currentMonth)
        })
        .forEach(p => {
          const d = new Date(p.payment_date!)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          byMonth.set(key, (byMonth.get(key) ?? 0) + Number(p.amount))
        })
      setMonthlyEarnings(
        Array.from(byMonth.entries())
          .map(([month, total]) => ({ month, total }))
          .sort((a, b) => b.month.localeCompare(a.month)),
      )

      const upcoming = tasks
        .filter(t => t.status !== "hechas" && t.due_date)
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 8)
      setUpcomingTasks(upcoming)
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const chartData = monthlyEarnings
    .slice()
    .reverse()
    .map(({ month, total }) => {
      const [y, m] = month.split("-")
      const label = `${MONTHS[Number(m) - 1]} ${y}`
      return { key: label, value: total }
    })

  return (
    <div>
      <PageHeader title="Dashboard" description={`Bienvenido ${user?.name ?? "Usuario"}`} />

      {loading ? (
        <div className={styles.loaderSection}><Loader /></div>
      ) : (
        <div className={styles.kpiGrid}>
          <StatCard label="Total clientes" value={totalClients} icon={Users} variant="primary" />
          <StatCard label="Proyectos Activos" value={activeProjects} icon={Briefcase} variant="success" />
          <StatCard label="Ingreso Mensual" value={`$${fmt(monthlyIncome)}`} icon={DollarSign} variant="primary" />
          <StatCard label="Tareas" value={pendingTasks} primaryLabel="Pendiente" secondaryValue={progressTasks} secondaryLabel="En Progreso" icon={Clock} variant="warning" />
        </div>
      )}

      {!loading && (
        <div className={styles.dashboardGrid}>
          <section>
            <h2 className={styles.sectionTitle}>Estadísticas Mensuales</h2>
            {chartData.length === 0 ? (
              <p className={styles.emptyState}>Aún no hay cobros registrados.</p>
            ) : (
              <div className={styles.card}>
                <BarChart data={chartData} />
              </div>
            )}
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Próximas Tareas</h2>
            {upcomingTasks.length === 0 ? (
              <p className={styles.emptyState}>No hay tareas pendientes con fecha.</p>
            ) : (
              <div className={styles.card}>
                <ul className={styles.taskList}>
                  {upcomingTasks.map(task => {
                    const due = new Date(task.due_date!)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const isOverdue = due.getTime() < today.getTime()
                    const formatted = due.toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                    })

                    return (
                      <li key={task.id} className={`${styles.taskItem} ${isOverdue ? styles.taskOverdue : ""}`} onClick={() => navigate("/tasks")}>
                        <span
                          className={styles.taskPriority}
                          style={{ background: priorityColor[task.priority] }}
                        />
                        <div className={styles.taskBody}>
                          <span className={styles.taskTitle}>{task.title}</span>
                          <span className={styles.taskProject}>{task.proyectos?.name ?? "—"}</span>
                        </div>
                        <div className={styles.taskDate}>
                          <Calendar size={12} />
                          <span>{formatted}</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
