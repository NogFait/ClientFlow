import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsAuth(!!data.user));
  }, []);

  if (isAuth === null) return null;
  return isAuth ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}
