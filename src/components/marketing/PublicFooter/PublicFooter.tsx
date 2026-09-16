import { Link } from "react-router-dom"
import { CONTACT_EMAIL } from "../../../content/contact"
import styles from "./PublicFooter.module.css"

const PublicFooter = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img src="/icon.png" alt="ClientFlow" className={styles.logo} />
          <span className={styles.brandName}>ClientFlow</span>
          <span className={styles.tagline}>· CRM para freelancers</span>
        </div>
        <div className={styles.links}>
          <Link to="/terms" className={styles.link}>
            Términos
          </Link>
          <Link to="/privacy" className={styles.link}>
            Privacidad
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.link}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
