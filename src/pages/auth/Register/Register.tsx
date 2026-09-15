import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import { useRegisterForm } from "../../../features/auth/hooks/useAuth"
import styles from "./Register.module.css"

const Register = () => {
  const { register, handleSubmit, onSubmit, errors, isSubmitting } = useRegisterForm()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={styles.page}>
      <section className={styles.brandPanel}>
        <Link to="/" className={styles.brand}>
          <img src="/icon.png" alt="ClientFlow" className={styles.brandLogo} />
          <span className={styles.brandName}>ClientFlow</span>
        </Link>

        <div className={styles.brandContent}>
          <h1 className={styles.brandTitle}>Tus clientes, proyectos y cobros. En un solo lugar.</h1>
          <p className={styles.brandTagline}>
            ClientFlow te muestra qué tenés que hacer hoy y cuánto te falta cobrar. Sin planillas.
          </p>
        </div>

        <p className={styles.brandNote}>Gratis hasta 3 clientes. Sin tarjeta.</p>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.welcomeTitle}>Creá tu cuenta</h2>
            <p className={styles.welcomeSub}>Gratis hasta 3 clientes. Sin tarjeta.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-name">
                Nombre
              </label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="register-name"
                  className={styles.input}
                  type="text"
                  placeholder="Tu nombre"
                  {...register("name", { required: true })}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-email">
                Email
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="register-email"
                  className={styles.input}
                  type="email"
                  placeholder="vos@tuestudio.com"
                  {...register("email", { required: true })}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-password">
                Contraseña
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="register-password"
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
              {isSubmitting ? "Creando cuenta..." : "Creá tu cuenta"}
            </button>
          </form>

          <p className={styles.link}>
            ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
          </p>
        </div>
      </section>
    </div>
  )
}

export default Register
