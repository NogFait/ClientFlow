import { useEffect, useState, type ReactNode } from "react"
import { supabase } from "../../../services/supabaseClient"
import { AuthContext, type AuthState } from "./authContext"

const LOADING_STATE: AuthState = { session: null, user: null, status: "loading" }

// Single, app-wide subscription to Supabase auth state (mounted once at the
// app root, above the router — see App.tsx). Replaces the previous pattern
// of every guard/Navbar/etc. independently calling supabase.auth.getUser()
// in its own mount effect: one onAuthStateChange subscription here now
// drives all of them via context, so login/logout propagate instantly with
// no reload and no redundant network calls.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(LOADING_STATE)

  useEffect(() => {
    // Subscribed first so no SIGNED_IN/SIGNED_OUT event fired between here
    // and the initial getSession() call below can be missed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        session,
        user: session?.user ?? null,
        status: session ? "authenticated" : "anonymous",
      })
    })

    // Explicit initial read in addition to the subscription above: some
    // supabase-js versions/configurations don't fire an immediate
    // INITIAL_SESSION event, and we don't want to depend on that detail to
    // leave `loading` forever. Guarded so it never clobbers a state already
    // set by the subscription callback (whichever settles first wins).
    supabase.auth.getSession().then(({ data }) => {
      setState((current) =>
        current.status !== "loading"
          ? current
          : {
              session: data.session,
              user: data.session?.user ?? null,
              status: data.session ? "authenticated" : "anonymous",
            },
      )
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
