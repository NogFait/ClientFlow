import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useHasSession } from "../../../hooks/useHasSession"
import { toLocalizedPath } from "../../../i18n/paths"
import { useCurrentLang } from "../../../i18n/useCurrentLang"
import LanguageSwitch from "../../shared/LanguageSwitch/LanguageSwitch"
import styles from "./PublicNav.module.css"

// Sticky, blurred public nav shared by the landing page, /pricing, the
// legal pages and the blog.
// Session-aware: shows the usual anonymous CTAs (Iniciar sesión / Empezar
// gratis) or, when a session already exists, a single "Ir al dashboard"
// link — the landing page itself never auto-redirects a logged-in visitor,
// it just changes what the nav offers them.
// Language-aware: labels come from common.json and the brand link points at
// the landing in the current language (/ or /en). The blog link is always
// /blog — the blog is Spanish-only, which its English label says out loud.
const PublicNav = () => {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { hasSession } = useHasSession()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // The section links are anchors that only exist on the landing. On the
  // landing a plain "#como" keeps native in-page scrolling; anywhere else
  // (blog, pricing, legal) they must first route back to the landing — in
  // the current language — where LandingPage's hash effect finishes the
  // scroll once the section has mounted.
  const landingPath = toLocalizedPath("/", lang)
  const onLanding = pathname === landingPath || pathname === `${landingPath}/`
  const anchorHref = (hash: string) => (onLanding ? hash : `${landingPath}${hash}`)

  const anchorLinks = [
    { href: anchorHref("#como"), label: t("nav.how") },
    { href: anchorHref("#precios"), label: t("nav.pricing") },
    { href: anchorHref("#faq"), label: t("nav.faq") },
  ]

  // Real routes (not landing anchors) shown next to the anchors — a router
  // Link so client-side navigation keeps the shell, no full reload.
  const routeLinks = [{ to: "/blog", label: t("nav.blog") }]

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to={toLocalizedPath("/", lang)} className={styles.brand}>
          <img src="/icon-192.png" alt="ClientFlow" className={styles.logo} />
          <span className={styles.brandName}>ClientFlow</span>
        </Link>

        <div className={styles.anchors}>
          {anchorLinks.map((link) =>
            onLanding ? (
              <a key={link.href} href={link.href} className={styles.anchorLink}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} to={link.href} className={styles.anchorLink}>
                {link.label}
              </Link>
            ),
          )}
          {routeLinks.map((link) => (
            <Link key={link.to} to={link.to} className={styles.anchorLink}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className={styles.actions}>
          <LanguageSwitch mode="route" className={styles.languageSwitch} />
          {hasSession ? (
            <Link to="/dashboard" className={styles.ctaPrimary}>
              {t("nav.dashboard")}
            </Link>
          ) : (
            <>
              <Link to="/login" className={styles.ctaGhost}>
                {t("nav.login")}
              </Link>
              <Link to="/register" className={styles.ctaPrimary}>
                {t("nav.start")}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={styles.hamburger}
          aria-label={t("nav.openMenu")}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {anchorLinks.map((link) =>
            onLanding ? (
              <a key={link.href} href={link.href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} to={link.href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ),
          )}
          {routeLinks.map((link) => (
            <Link key={link.to} to={link.to} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          {hasSession ? (
            <Link to="/dashboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {t("nav.dashboard")}
            </Link>
          ) : (
            <Link to="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {t("nav.login")}
            </Link>
          )}
          <div className={styles.mobileLanguage}>
            <LanguageSwitch mode="route" />
          </div>
        </div>
      )}
    </header>
  )
}

export default PublicNav
