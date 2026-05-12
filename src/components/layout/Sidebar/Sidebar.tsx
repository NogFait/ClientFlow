import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Users, Briefcase, CheckSquare, CreditCard } from "lucide-react"
import styles from "./Sidebar.module.css"

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/clients", label: "Clientes", icon: Users },
  { path: "/projects", label: "Proyectos", icon: Briefcase },
  { path: "/tasks", label: "Tareas", icon: CheckSquare },
  { path: "/payments", label: "Pagos", icon: CreditCard },
]

const Sidebar = () => {
  const location = useLocation()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h1 className={styles.logoTitle}>ClientFlow</h1>
        <p className={styles.logoSub}>Freelancer CRM</p>
      </div>
      <nav className={styles.nav}>
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${location.pathname === item.path ? styles.navItemActive : ""}`}
            >
              <Icon size={18} className={styles.navIcon} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
