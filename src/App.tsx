import './styles/global.css'
import AppRouter from './router/AppRouter'
import ErrorBoundary from './components/shared/ErrorBoundary/ErrorBoundary'
import { AuthProvider } from './features/auth/context/AuthProvider'
import HtmlLangSync from './components/i18n/HtmlLangSync'

// The i18n instance is provided ABOVE App by the entries (entry-client
// creates one for the session, entry-server one per prerendered page), so
// App itself stays instance-agnostic.
function App() {
  return (
    <ErrorBoundary>
      <HtmlLangSync />
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
