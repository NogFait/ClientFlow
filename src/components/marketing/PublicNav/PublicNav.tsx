import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { useHasSession } from "../../../hooks/useHasSession"
import styles from "./PublicNav.module.css"

const ANCHOR_LINKS = [
  { href: "#como", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "#faq", label: "Preguntas" },
]

// Real routes (not landing anchors) shown next to the anchors — a router
// Link so client-side navigation keeps the shell, no full reload.
const ROUTE_LINKS = [{ to: "/blog", label: "Blog" }]

// Sticky, blurred public nav shared by the landing page, /pricing, the
// legal pages and the blog.
// Session-aware: shows the usual anonymous CTAs (Iniciar sesión / Empezar
// gratis) or, when a session already exists, a single "Ir al dashboard"
// link — the landing page itself never auto-redirects a logged-in visitor,
// it just changes what the nav offers them.
const PublicNav = () => {
  const { hasSession } = useHasSession()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.brand}>
          <img src="/icon-192.png" alt="ClientFlow" className={styles.logo} />
          <span className={styles.brandName}>ClientFlow</span>
        </Link>

        <div className={styles.anchors}>
          {ANCHOR_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.anchorLink}>
              {link.label}
            </a>
          ))}
          {ROUTE_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={styles.anchorLink}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className={styles.actions}>
          {hasSession ? (
            <Link to="/dashboard" className={styles.ctaPrimary}>
              Ir al dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className={styles.ctaGhost}>
                Iniciar sesión
              </Link>
              <Link to="/register" className={styles.ctaPrimary}>
                Empezar gratis
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={styles.hamburger}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {ANCHOR_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {ROUTE_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          {hasSession ? (
            <Link to="/dashboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              Ir al dashboard
            </Link>
          ) : (
            <Link to="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              Iniciar sesión
            </Link>
          )}
        </div>
      )}
    </header>
  )
}

export default PublicNav
