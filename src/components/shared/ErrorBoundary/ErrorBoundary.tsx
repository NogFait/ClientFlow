import { Component, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

// Error boundaries must be class components (no hook equivalent yet), and
// classes can't call useTranslation — so the copy lives in this small
// function component the boundary renders instead. It still reads the
// i18n instance from context because the boundary sits BELOW
// <I18nextProvider> (entry-client/entry-server wrap App).
const ErrorFallback = ({ error }: { error: Error | null }) => {
  const { t } = useTranslation("app")
  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{t("shared.errorBoundary.title")}</h1>
      <p style={{ color: "#666", marginBottom: "1rem" }}>{error?.message}</p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: "0.5rem 1rem",
          background: "#7c3aed",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {t("shared.errorBoundary.reload")}
      </button>
    </div>
  )
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

export default ErrorBoundary
