import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Menu } from "lucide-react";
import { supabase } from "../../../services/supabaseClient";
import { BILLING_ENABLED } from "../../../config/features";
import { useAuthState } from "../../../features/auth/context/authContext";
import { useEntitlementsContext } from "../../../features/billing/context/entitlementsContext";
import PlanBadge from "../../../features/billing/components/PlanBadge/PlanBadge";
import LanguageSwitch from "../../shared/LanguageSwitch/LanguageSwitch";
import styles from "./Navbar.module.css";

interface NavbarProps {
  // Mobile hamburger — opens the Sidebar drawer, state lives in Layout so
  // both the trigger (here) and the drawer (Sidebar) share it.
  mobileNavOpen?: boolean
  onOpenMobileNav?: () => void
}

const noop = () => {}

const Navbar = ({ mobileNavOpen = false, onOpenMobileNav = noop }: NavbarProps) => {
  const { t } = useTranslation("app");
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { entitlements, loading: entitlementsLoading } = useEntitlementsContext();
  const userName: string = (user?.user_metadata?.name as string | undefined) ?? t("nav.userFallback");

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
        aria-label={t("nav.openMenu")}
        aria-expanded={mobileNavOpen}
        onClick={onOpenMobileNav}
      >
        <Menu size={20} />
      </button>
      <div className={styles.spacer} />
      {/* Preference mode: app routes carry no language in the URL, so the
          switch stores the choice and changes the tree's language in place
          (Layout's usePreferredLanguageSync re-applies it on every visit). */}
      <LanguageSwitch mode="preference" className={styles.languageSwitch} />
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
        aria-label={t("nav.logout")}
        title={t("nav.logout")}
      >
        <LogOut size={16} aria-hidden="true" />
        {/* Icon-only on phones (see CSS): with the plan badge and the language
            switch there is no room for the label at 375px. */}
        <span className={styles.logoutLabel}>{t("nav.logout")}</span>
      </button>
    </div>
  );
};

export default Navbar;
