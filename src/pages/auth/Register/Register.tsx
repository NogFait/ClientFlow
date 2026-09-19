import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toLocalizedPath } from "../../../i18n/paths"
import { useCurrentLang } from "../../../i18n/useCurrentLang"
import { useRegisterForm } from "../../../features/auth/hooks/useAuth"
import { usePageMeta } from "../../../hooks/usePageMeta"
import { usePreferredLanguageSync } from "../../../i18n/usePreferredLanguageSync"
import LanguageSwitch from "../../../components/shared/LanguageSwitch/LanguageSwitch"
import styles from "./Register.module.css"

// Same language handling as Login: stored preference, "preference" switch.
const Register = () => {
  const { t } = useTranslation("auth")
  // Home links follow the chosen language: a user reading in English must
  // land on /en, not be bounced to the Spanish home by a hardcoded "/".
  const lang = useCurrentLang()
  usePreferredLanguageSync()
  usePageMeta({ title: t("register.metaTitle"), noindex: true })

  const { register, handleSubmit, onSubmit, errors, isSubmitting } = useRegisterForm()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={styles.page}>
      <section className={styles.brandPanel}>
        <div className={styles.brandRow}>
          <Link to={toLocalizedPath("/", lang)} className={styles.brand}>
            <img src="/icon-192.png" alt="ClientFlow" className={styles.brandLogo} />
            <span className={styles.brandName}>ClientFlow</span>
          </Link>
          <LanguageSwitch mode="preference" />
        </div>

        <div className={styles.brandContent}>
          <h1 className={styles.brandTitle}>{t("register.brandTitle")}</h1>
          <p className={styles.brandTagline}>{t("register.brandTagline")}</p>
        </div>

        <p className={styles.brandNote}>{t("brandNote")}</p>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.welcomeTitle}>{t("register.title")}</h2>
            <p className={styles.welcomeSub}>{t("register.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-name">
                {t("fields.name")}
              </label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="register-name"
                  className={styles.input}
                  type="text"
                  placeholder={t("fields.namePlaceholder")}
                  {...register("name", { required: true })}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-email">
                {t("fields.email")}
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="register-email"
                  className={styles.input}
                  type="email"
                  placeholder={t("fields.emailPlaceholder")}
                  {...register("email", { required: true })}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-password">
                {t("fields.password")}
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
                  aria-label={showPassword ? t("fields.hidePassword") : t("fields.showPassword")}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errors.root?.serverError && <p className={styles.error}>{errors.root.serverError.message}</p>}

            <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("register.submitting") : t("register.submit")}
            </button>
          </form>

          <p className={styles.link}>
            {t("register.hasAccount")} <Link to="/login">{t("register.login")}</Link>
          </p>
        </div>
      </section>
    </div>
  )
}

export default Register
