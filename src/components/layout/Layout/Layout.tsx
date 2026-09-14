import { Outlet } from "react-router-dom"
import Navbar from "../Navbar/Navbar"
import Sidebar from "../Sidebar/Sidebar"
import { EntitlementsProvider } from "../../../features/billing/context/EntitlementsProvider"
import styles from "./Layout.module.css"

const Layout = () => {
  return (
    <EntitlementsProvider>
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.main}>
          <Navbar />
          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </EntitlementsProvider>
  )
}

export default Layout
