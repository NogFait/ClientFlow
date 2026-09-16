import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { supabase } from "../../../services/supabaseClient";
import { BILLING_ENABLED } from "../../../config/features";
import { useAuthState } from "../../../features/auth/context/authContext";
import { useEntitlementsContext } from "../../../features/billing/context/entitlementsContext";
import PlanBadge from "../../../features/billing/components/PlanBadge/PlanBadge";
import styles from "./Navbar.module.css";

interface NavbarProps {
  // Mobile hamburger — opens the Sidebar drawer, state lives in Layout so
  // both the trigger (here) and the drawer (Sidebar) share it.
  mobileNavOpen?: boolean
  onOpenMobileNav?: () => void
}

const noop = () => {}

const Navbar = ({ mobileNavOpen = false, onOpenMobileNav = noop }: NavbarProps) => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { entitlements, loading: entitlementsLoading } = useEntitlementsContext();
  const userName: string = (user?.user_metadata?.name as string | undefined) ?? "Usuario";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const initial = userName.charAt(0).toUpperCase()

  const showsPlanBadge = BILLING_ENABLED && !entitlementsLoading && entitlements !== null

  return (
    <div className={styles.navbar}>
      <button
        type="button"
        className={styles.hamburger}
        aria-label="Abrir menú"
        aria-expanded={mobileNavOpen}
        onClick={onOpenMobileNav}
      >
        <Menu size={20} />
      </button>
      <div className={styles.spacer} />
      {showsPlanBadge && entitlements && (
        <Link to="/settings/billing" className={styles.planBadgeLink}>
          <PlanBadge plan={entitlements.plan} status={entitlements.status} compact />
        </Link>
      )}
      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {initial}
        </div>
        <span className={styles.userName}>{userName}</span>
      </div>
      <button 
        className={styles.logoutButton}
        onClick={handleLogout}
      >
        <LogOut size={16} />
        Salir
      </button>
    </div>
  );
};

export default Navbar;
