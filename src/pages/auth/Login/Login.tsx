import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useLoginForm } from "../../../features/auth/hooks/useAuth"
import styles from "./Login.module.css"

const Login = () => {
  const { register, handleSubmit, onSubmit, errors, isSubmitting } = useLoginForm()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={styles.page}>
      <section className={styles.brandPanel}>
        <Link to="/" className={styles.brand}>
          <img src="/icon.png" alt="ClientFlow" className={styles.brandLogo} />
          <span className={styles.brandName}>ClientFlow</span>
        </Link>

        <div className={styles.brandContent}>
          <div className={styles.brandCopy}>
            <h1 className={styles.brandTitle}>Todo tu trabajo freelance, en orden.</h1>
            <p className={styles.brandTagline}>
              Clientes, proyectos, tareas y cobros. Qué hacer hoy y cuánto te falta cobrar, de un vistazo.
            </p>
          </div>

          <div className={styles.mockCard}>
            <div className={styles.mockHeader}>
              <span className={styles.mockHeaderLabel}>Pagos · Septiembre 2026</span>
              <span className={styles.mockHeaderAccumulated}>Acumulado 2026 · $ 2.140.000</span>
            </div>
            <div className={styles.mockStatsRow}>
              <div className={styles.mockStat}>
                <span className={styles.mockStatLabel}>Cobrado</span>
                <span className={styles.mockStatValueGreen}>$ 372.000</span>
              </div>
              <div className={styles.mockStat}>
                <span className={styles.mockStatLabel}>Pendiente</span>
                <span className={styles.mockStatValueAmber}>$ 80.000</span>
              </div>
            </div>
            <div className={styles.mockList}>
              <div className={styles.mockListRow}>
                <span>Sistema Web · Tita</span>
                <span className={styles.mockPaid}>Pagado</span>
              </div>
              <div className={styles.mockListRow}>
                <span>Landing Page · Pepe</span>
                <span className={styles.mockPending}>Pendiente</span>
              </div>
            </div>
          </div>
        </div>

        <p className={styles.brandNote}>Gratis hasta 3 clientes. Sin tarjeta.</p>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.welcomeTitle}>Bienvenido de nuevo</h2>
            <p className={styles.welcomeSub}>Ingresá con tu email y contraseña.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-email">
                Email
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="login-email"
                  className={styles.input}
                  type="email"
                  placeholder="vos@tuestudio.com"
                  {...register("email", { required: true })}
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="login-password">
                  Contraseña
                </label>
              </div>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="login-password"
                  className={styles.input}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("contrasena" /* contraseña */, { required: true })}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errors.root?.serverError && <p className={styles.error}>{errors.root.serverError.message}</p>}

            <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className={styles.link}>
            ¿No tenés cuenta? <Link to="/register">Creala gratis</Link>
          </p>
        </div>
      </section>
    </div>
  )
}

export default Login
