import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  CreditCard,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { BILLING_ENABLED } from "../../../config/features"
import { useSidebarState } from "./useSidebarState"
import { useMediaQuery } from "../../../hooks/useMediaQuery"
import styles from "./Sidebar.module.css"

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/clients", label: "Clientes", icon: Users },
  { path: "/projects", label: "Proyectos", icon: Briefcase },
  { path: "/tasks", label: "Tareas", icon: CheckSquare },
  { path: "/payments", label: "Pagos", icon: CreditCard },
  // Hidden entirely when billing is off (spec account-billing-ui: flag-gated route).
  ...(BILLING_ENABLED ? [{ path: "/settings/billing", label: "Plan y facturación", icon: Receipt }] : []),
]

const MOBILE_QUERY = "(max-width: 767px)"

interface SidebarProps {
  // Mobile off-canvas drawer state, lifted to Layout so the Navbar hamburger
  // can open it — undefined/false on desktop where the drawer markup is inert.
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

const noop = () => {}

const Sidebar = ({ mobileOpen = false, onCloseMobile = noop }: SidebarProps) => {
  const location = useLocation()
  const { collapsed, toggle } = useSidebarState()
  const isMobile = useMediaQuery(MOBILE_QUERY)

  // Close the drawer whenever the route changes — calling the parent's
  // setter (not this component's own state) from an effect keyed on
  // navigation is the standard "close on route change" shape and isn't the
  // cascading-render pattern react-hooks/set-state-in-effect guards against.
  useEffect(() => {
    onCloseMobile()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on route change
  }, [location.pathname])

  useEffect(() => {
    if (!isMobile || !mobileOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile()
    }
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isMobile, mobileOpen, onCloseMobile])

  const isRail = collapsed && !isMobile
  const isDrawerOpen = isMobile && mobileOpen

  const asideClassName = [styles.sidebar, isRail && styles.collapsed, isMobile && styles.mobile, isDrawerOpen && styles.drawerOpen]
    .filter(Boolean)
    .join(" ")

  return (
    <>
      {isMobile && mobileOpen && (
        <div className={styles.backdrop} data-testid="sidebar-backdrop" onClick={onCloseMobile} />
      )}
      <aside
        className={asideClassName}
        role={isDrawerOpen ? "dialog" : undefined}
        aria-modal={isDrawerOpen ? true : undefined}
        aria-label={isDrawerOpen ? "Menú de navegación" : undefined}
      >
        <div className={styles.logo}>
          {!isRail && (
            <div className={styles.logoText}>
              <h1 className={styles.logoTitle}>ClientFlow</h1>
              <p className={styles.logoSub}>Freelancer CRM</p>
            </div>
          )}
          {!isMobile && (
            <button
              type="button"
              className={styles.collapseToggle}
              onClick={toggle}
              aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon
            // Nested detail routes (e.g. the project hub at /projects/:id)
            // should keep their parent's nav item highlighted too.
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                title={isRail ? item.label : undefined}
                aria-label={isRail ? item.label : undefined}
              >
                <Icon size={18} className={styles.navIcon} />
                {!isRail && item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
