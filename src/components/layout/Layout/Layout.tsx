import { useState } from "react"
import { Outlet } from "react-router-dom"
import Navbar from "../Navbar/Navbar"
import Sidebar from "../Sidebar/Sidebar"
import { EntitlementsProvider } from "../../../features/billing/context/EntitlementsProvider"
import { ToastProvider } from "../../shared/Toast/ToastProvider"
import { usePageMeta } from "../../../hooks/usePageMeta"
import { usePreferredLanguageSync } from "../../../i18n/usePreferredLanguageSync"
import styles from "./Layout.module.css"

const Layout = () => {
  // Single noindex for every authenticated app page (dashboard, clients,
  // projects, ...) — they all mount through this Layout, so one call here
  // covers them instead of repeating usePageMeta per page.
  usePageMeta({ title: "ClientFlow", noindex: true })

  // App routes carry no language in the URL (unlike /en/pricing), so the
  // stored preference — chosen on the landing, login or the Navbar switch —
  // is applied here, once, for every page under this Layout.
  usePreferredLanguageSync()

  // Lifted here (not inside Sidebar/Navbar) because the mobile drawer's
  // trigger (Navbar hamburger) and its content (Sidebar) are siblings.
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <EntitlementsProvider>
      <ToastProvider>
        <div className={styles.layout}>
          <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
          <div className={styles.main}>
            <Navbar mobileNavOpen={mobileNavOpen} onOpenMobileNav={() => setMobileNavOpen(true)} />
            <main className={styles.content}>
              <Outlet />
            </main>
          </div>
        </div>
      </ToastProvider>
    </EntitlementsProvider>
  )
}

export default Layout
