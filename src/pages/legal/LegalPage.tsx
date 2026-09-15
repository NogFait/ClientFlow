import PublicNav from "../../components/marketing/PublicNav/PublicNav"
import PublicFooter from "../../components/marketing/PublicFooter/PublicFooter"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import type { LegalDocument } from "../../content/legal/types"
import styles from "./LegalPage.module.css"

interface LegalPageProps {
  document: LegalDocument
}

// Shared layout for /terms and /privacy — public nav/footer + a readable
// (~720px) column. Both documents are explicit drafts (see the notice
// below) pending a lawyer's review; content itself lives in
// src/content/legal/{terms,privacy}.ts so it can be edited without touching
// this component.
const LegalPage = ({ document }: LegalPageProps) => {
  useDocumentTitle(`${document.title} — ClientFlow`)

  return (
    <div className={styles.page}>
      <PublicNav />
      <main className={styles.main}>
        <div className={styles.notice} role="note">
          <strong>Borrador — pendiente de revisión legal.</strong> Este documento describe lo que hace el producto
          hoy, pero todavía no fue revisado por un abogado. Los campos entre corchetes (como [RAZÓN SOCIAL]) son
          placeholders pendientes de completar.
        </div>

        <h1 className={styles.title}>{document.title}</h1>
        <p className={styles.updated}>Última actualización: {document.lastUpdated}</p>

        {document.sections.map((section) => (
          <section key={section.heading} className={styles.section}>
            <h2 className={styles.sectionHeading}>{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={index} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </main>
      <PublicFooter />
    </div>
  )
}

export default LegalPage
