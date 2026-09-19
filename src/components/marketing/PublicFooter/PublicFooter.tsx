import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { CONTACT_EMAIL } from "../../../content/contact"
import { toLocalizedPath } from "../../../i18n/paths"
import { useCurrentLang } from "../../../i18n/useCurrentLang"
import LanguageSwitch from "../../shared/LanguageSwitch/LanguageSwitch"
import styles from "./PublicFooter.module.css"

// Legal links follow the current language (/terms ⇄ /en/terms); the blog
// link is always /blog (Spanish-only).
const PublicFooter = () => {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img src="/icon-192.png" alt="ClientFlow" className={styles.logo} />
          <span className={styles.brandName}>ClientFlow</span>
          <span className={styles.tagline}>· {t("tagline")}</span>
        </div>
        <div className={styles.links}>
          <Link to="/blog" className={styles.link}>
            {t("footer.blog")}
          </Link>
          <Link to={toLocalizedPath("/terms", lang)} className={styles.link}>
            {t("footer.terms")}
          </Link>
          <Link to={toLocalizedPath("/privacy", lang)} className={styles.link}>
            {t("footer.privacy")}
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.link}>
            {CONTACT_EMAIL}
          </a>
          <LanguageSwitch mode="route" />
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
