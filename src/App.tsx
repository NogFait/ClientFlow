import './styles/global.css'
import AppRouter from './router/AppRouter'
import ErrorBoundary from './components/shared/ErrorBoundary/ErrorBoundary'
import { AuthProvider } from './features/auth/context/AuthProvider'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
