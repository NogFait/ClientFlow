import PublicNav from "../../components/marketing/PublicNav/PublicNav"
import PublicFooter from "../../components/marketing/PublicFooter/PublicFooter"
import { usePageMeta } from "../../hooks/usePageMeta"
import type { LegalDocument } from "../../content/legal/types"
import { PUBLIC_PAGE_META } from "../../content/pageMeta"
import styles from "./LegalPage.module.css"

interface LegalPageProps {
  document: LegalDocument
  path: "/terms" | "/privacy"
}

// Shared layout for /terms and /privacy — public nav/footer + a readable
// (~720px) column. Content lives in src/content/legal/{terms,privacy}.ts so
// it can be edited without touching this component.
const LegalPage = ({ document, path }: LegalPageProps) => {
  // Title/description come from PUBLIC_PAGE_META (shared with the build-time
  // prerender) so runtime and prerendered head tags can't drift.
  usePageMeta(PUBLIC_PAGE_META[path])

  return (
    <div className={styles.page}>
      <PublicNav />
      <main className={styles.main}>
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
