import { useEffect, useState } from "react"
import { supabase } from "../../services/supabaseClient"
import { getClients } from "../../features/clients/services"
import { getProjects } from "../../features/projects/services"
import { getPayments } from "../../features/payments/services"
import { getTasks } from "../../features/tasks/services"
import { Users, Briefcase, DollarSign, Clock } from "lucide-react"
import StatCard from "../../components/shared/StatCard/StatCard"
import PageHeader from "../../components/shared/PageHeader/PageHeader"
import Loader from "../../components/shared/Loader/Loader"
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
  const [monthlyEarnings, setMonthlyEarnings] = useState<{ month: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)

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
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
          <StatCard label="Tareas pendientes" value={pendingTasks} icon={Clock} variant="warning" />
        </div>
      )}

      <section>
        <h2>Estadísticas Mensuales</h2>
        {loading ? (
          <div className={styles.loaderSection}><Loader /></div>
        ) : monthlyEarnings.length === 0 ? (
          <p>Aún no hay cobros registrados.</p>
        ) : (
          <div className={styles.tableWrapper}><table className={styles.statsTable}>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Total Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {monthlyEarnings.map(({ month, total }) => {
                const [year, m] = month.split("-")
                const label = `${MONTHS[Number(m) - 1]} ${year}`
                return (
                  <tr key={month}>
                    <td>{label}</td>
                    <td className={styles.amount}>${fmt(total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </section>
    </div>
  )
}

export default DashboardPage
