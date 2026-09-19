import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  CreditCard,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react"
import { BILLING_ENABLED } from "../../../config/features"
import { useSidebarState } from "./useSidebarState"
import { useMediaQuery } from "../../../hooks/useMediaQuery"
import styles from "./Sidebar.module.css"

// Labels are resolved at render (t("sidebar.items.<key>")) so a language
// switch re-labels the nav without remounting it. The key union is spelled
// out (not inferred) so the conditional spread below can't widen it to
// string and lose the typed-key check on t().
type NavKey = "dashboard" | "clients" | "projects" | "tasks" | "payments" | "billing"

interface NavItem {
  path: string
  key: NavKey
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { path: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { path: "/clients", key: "clients", icon: Users },
  { path: "/projects", key: "projects", icon: Briefcase },
  { path: "/tasks", key: "tasks", icon: CheckSquare },
  { path: "/payments", key: "payments", icon: CreditCard },
  // Hidden entirely when billing is off (spec account-billing-ui: flag-gated route).
  ...(BILLING_ENABLED ? [{ path: "/settings/billing", key: "billing" as const, icon: Receipt }] : []),
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
  const { t } = useTranslation("app")
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
        aria-label={isDrawerOpen ? t("sidebar.menuLabel") : undefined}
      >
        <div className={styles.logo}>
          {!isRail && (
            <div className={styles.logoText}>
              <h1 className={styles.logoTitle}>ClientFlow</h1>
              <p className={styles.logoSub}>{t("sidebar.tagline")}</p>
            </div>
          )}
          {!isMobile && (
            <button
              type="button"
              className={styles.collapseToggle}
              onClick={toggle}
              aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon
            const label = t(`sidebar.items.${item.key}`)
            // Nested detail routes (e.g. the project hub at /projects/:id)
            // should keep their parent's nav item highlighted too.
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                title={isRail ? label : undefined}
                aria-label={isRail ? label : undefined}
              >
                <Icon size={18} className={styles.navIcon} />
                {!isRail && label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
