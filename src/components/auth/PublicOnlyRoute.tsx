import { Navigate } from "react-router-dom";
import { useAuthState } from "../../features/auth/context/authContext";

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuthState();

  if (status === "loading") return null;
  return status === "authenticated" ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}
