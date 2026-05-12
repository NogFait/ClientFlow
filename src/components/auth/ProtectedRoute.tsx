import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { supabase } from "../../services/supabaseClient"

export function ProtectedRoute() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthorized(!!data.user))
  }, [])

  if (authorized === null) return null
  return authorized ? <Outlet /> : <Navigate to="/" replace />
}
