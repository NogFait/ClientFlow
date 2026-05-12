import { Link } from "react-router-dom"
import { useLoginForm } from "../../../features/auth/hooks/useAuth"
import styles from "./Login.module.css"

const Login = () => {
  const { register, handleSubmit, onSubmit, errors, isSubmitting } = useLoginForm()

  return (
    <div className={styles.page}>
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <h1 className={styles.brandTitle}>ClientFlow</h1>
          <p className={styles.brandTagline}>Gestiona tu negocio freelance con claridad.</p>
        </div>
      </div>
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <img src="./icon.png" alt="ClientFlow" className={styles.logo} />
          <h2 className={styles.welcomeTitle}>Bienvenido</h2>
          <p className={styles.welcomeSub}>Por favor introduzca sus datos para iniciar sesión</p>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" {...register("email", { required: true })} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Contraseña</label>
              <input className={styles.input} type="password" {...register("contrasena" /* contraseña */, { required: true })} />
            </div>
            {errors.root?.serverError && (
              <p className={styles.error}>{errors.root.serverError.message}</p>
            )}
            <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>
          <Link to="/register" className={styles.link}>Registrarse</Link>
        </div>
      </div>
    </div>
  )
}

export default Login