import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthState } from "../../features/auth/context/authContext"
import { getClients } from "../../features/clients/services"
import { getProjects } from "../../features/projects/services"
import { getPayments } from "../../features/payments/services"
import { getTasks } from "../../features/tasks/services"
import { Wallet, Briefcase, DollarSign, Clock, Calendar, ClipboardList } from "lucide-react"
import type { ITask } from "../../features/tasks/types"
import StatCard from "../../components/shared/StatCard/StatCard"
import PageHeader from "../../components/shared/PageHeader/PageHeader"
import Loader from "../../components/shared/Loader/Loader"
import EmptyState from "../../components/shared/EmptyState/EmptyState"
import OnboardingChecklist from "../../components/shared/OnboardingChecklist/OnboardingChecklist"
import { BarChart } from "../../components/charts/BarChart"
import { formatCurrency } from "../../utils/currency"
import { summarizeDashboard, localIsoDate, type DashboardSummary } from "../../features/dashboard/domain/dashboardSummary"
import { getWelcomeMessage } from "./welcomeMessage"
import styles from "./DashboardPage.module.css"

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const DashboardPage = () => {
  const { user: authUser } = useAuthState()
  const user = authUser
    ? { name: authUser.user_metadata?.name as string | undefined, email: authUser.email }
    : null
  const [totalClients, setTotalClients] = useState(0)
  const [totalProjects, setTotalProjects] = useState(0)
  const [totalPayments, setTotalPayments] = useState(0)
  const [activeProjects, setActiveProjects] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
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
    Promise.all([
      getClients(),
      getProjects(),
      getPayments(),
      getTasks(),
    ]).then(([clients, projects, payments, tasks]) => {
      setTotalClients(clients.length)
      setTotalProjects(projects.length)
      setTotalPayments(payments.length)
      setActiveProjects(projects.filter(p => p.status === "activo").length)
      setSummary(summarizeDashboard(payments, tasks, localIsoDate()))

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

  const chartData = monthlyEarnings
    .slice()
    .reverse()
    .map(({ month, total }) => {
      const [y, m] = month.split("-")
      const monthName = MONTHS[Number(m) - 1]
      // Full name for the tooltip, "Sep 26" for the axis (fits on mobile).
      return { key: `${monthName} ${y}`, shortLabel: `${monthName.slice(0, 3)} ${y.slice(-2)}`, value: total }
    })

  return (
    <div>
      <PageHeader title="Dashboard" description={getWelcomeMessage(user)} />

      {!loading && (
        <OnboardingChecklist
          hasClients={totalClients > 0}
          hasProjects={totalProjects > 0}
          hasPayments={totalPayments > 0}
        />
      )}

      {loading ? (
        <div className={styles.loaderSection}><Loader /></div>
      ) : (
        <div className={styles.kpiGrid}>
          {/* The two questions the dashboard exists to answer, first and in
              this order: how much is still owed to me, and what do I have to
              do. Client/project counts are vanity metrics — the sidebar pages
              already have them. */}
          <StatCard
            label="Por cobrar"
            value={formatCurrency(summary?.receivable ?? 0)}
            note={summary && summary.overdueAmount > 0 ? `${formatCurrency(summary.overdueAmount)} vencido` : undefined}
            icon={Wallet}
            variant={summary && summary.overdueAmount > 0 ? "error" : "primary"}
          />
          <StatCard label="Cobrado este mes" value={formatCurrency(monthlyIncome)} icon={DollarSign} variant="success" />
          <StatCard
            label="Tareas"
            value={summary?.tasksDueToday ?? 0}
            primaryLabel="Para hoy"
            secondaryValue={summary?.tasksOverdue ?? 0}
            secondaryLabel="Vencidas"
            icon={Clock}
            variant={summary && summary.tasksOverdue > 0 ? "error" : "warning"}
          />
          <StatCard label="Proyectos Activos" value={activeProjects} icon={Briefcase} variant="primary" />
        </div>
      )}

      {!loading && (
        <div className={styles.dashboardGrid}>
          <section>
            <h2 className={styles.sectionTitle}>Estadísticas Mensuales</h2>
            {chartData.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="Aún no hay cobros registrados"
                description="Registrá tus cobros para ver la evolución de tus ingresos mes a mes."
                actionLabel="Registrar pago"
                onAction={() => navigate("/payments")}
              />
            ) : (
              <div className={styles.card}>
                <BarChart data={chartData} />
              </div>
            )}
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Próximas Tareas</h2>
            {upcomingTasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No hay tareas pendientes con fecha"
                description="Asignale una fecha de vencimiento a tus tareas para verlas acá antes de que venzan."
                actionLabel="Ver tareas"
                onAction={() => navigate("/tasks")}
              />
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
