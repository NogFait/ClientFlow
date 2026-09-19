import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toLocalizedPath } from "../../i18n/paths"
import { useCurrentLang } from "../../i18n/useCurrentLang"

const NotFoundPage = () => {
  const { t } = useTranslation("app")
  // Home links follow the chosen language: a user reading in English must
  // land on /en, not be bounced to the Spanish home by a hardcoded "/".
  const lang = useCurrentLang()

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "4rem", fontWeight: 700, color: "#7c3aed", marginBottom: "0.5rem" }}>404</h1>
      <p style={{ fontSize: "1.125rem", color: "#52525b", marginBottom: "2rem" }}>
        {t("notFound.message")}
      </p>
      <Link
        to={toLocalizedPath("/", lang)}
        style={{
          padding: "0.625rem 1.5rem",
          background: "#7c3aed",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        {t("notFound.back")}
      </Link>
    </div>
  )
}

export default NotFoundPage
