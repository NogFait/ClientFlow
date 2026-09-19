import { useTranslation } from "react-i18next"
import PublicNav from "../../components/marketing/PublicNav/PublicNav"
import PublicFooter from "../../components/marketing/PublicFooter/PublicFooter"
import { usePageMeta } from "../../hooks/usePageMeta"
import { useLegalDocument } from "../../hooks/useLegalDocument"
import type { LegalKind } from "../../content/legal/documents"
import { getPageMeta } from "../../content/pageMeta"
import { useCurrentLang } from "../../i18n/useCurrentLang"
import styles from "./LegalPage.module.css"

interface LegalPageProps {
  kind: LegalKind
  path: "/terms" | "/privacy"
}

// Shared layout for /terms and /privacy (and their /en twins) — public
// nav/footer + a readable (~720px) column. Content lives in
// src/i18n/locales/{es,en}/legal.json so it can be edited without touching
// this component.
const LegalPage = ({ kind, path }: LegalPageProps) => {
  const { t } = useTranslation("legal")
  const lang = useCurrentLang()
  const document = useLegalDocument(kind)

  // Title/description come from the page meta (shared with the build-time
  // prerender) so runtime and prerendered head tags can't drift.
  usePageMeta(getPageMeta(path, lang))

  return (
    <div className={styles.page}>
      <PublicNav />
      <main className={styles.main}>
        <h1 className={styles.title}>{document.title}</h1>
        <p className={styles.updated}>
          {t("lastUpdated")}: {document.lastUpdated}
        </p>
        {document.notice && <p className={styles.notice}>{document.notice}</p>}

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
