import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toLocalizedPath } from "../../../i18n/paths"
import { useCurrentLang } from "../../../i18n/useCurrentLang"
import { useLoginForm } from "../../../features/auth/hooks/useAuth"
import { usePageMeta } from "../../../hooks/usePageMeta"
import { usePreferredLanguageSync } from "../../../i18n/usePreferredLanguageSync"
import LanguageSwitch from "../../../components/shared/LanguageSwitch/LanguageSwitch"
import styles from "./Login.module.css"

// No language in this URL (/login is noindex, one route for both), so the
// stored preference drives it and the switch works in "preference" mode.
const Login = () => {
  const { t } = useTranslation("auth")
  // Home links follow the chosen language: a user reading in English must
  // land on /en, not be bounced to the Spanish home by a hardcoded "/".
  const lang = useCurrentLang()
  usePreferredLanguageSync()
  usePageMeta({ title: t("login.metaTitle"), noindex: true })

  const { register, handleSubmit, onSubmit, errors, isSubmitting } = useLoginForm()
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
          <div className={styles.brandCopy}>
            <h1 className={styles.brandTitle}>{t("login.brandTitle")}</h1>
            <p className={styles.brandTagline}>{t("login.brandTagline")}</p>
          </div>

          <div className={styles.mockCard}>
            <div className={styles.mockHeader}>
              <span className={styles.mockHeaderLabel}>{t("login.mock.title")}</span>
              <span className={styles.mockHeaderAccumulated}>{t("login.mock.accumulated")}</span>
            </div>
            <div className={styles.mockStatsRow}>
              <div className={styles.mockStat}>
                <span className={styles.mockStatLabel}>{t("login.mock.collected")}</span>
                <span className={styles.mockStatValueGreen}>$ 372.000</span>
              </div>
              <div className={styles.mockStat}>
                <span className={styles.mockStatLabel}>{t("login.mock.pending")}</span>
                <span className={styles.mockStatValueAmber}>$ 80.000</span>
              </div>
            </div>
            <div className={styles.mockList}>
              <div className={styles.mockListRow}>
                <span>{t("login.mock.row1")}</span>
                <span className={styles.mockPaid}>{t("login.mock.paid")}</span>
              </div>
              <div className={styles.mockListRow}>
                <span>{t("login.mock.row2")}</span>
                <span className={styles.mockPending}>{t("login.mock.pendingStatus")}</span>
              </div>
            </div>
          </div>
        </div>

        <p className={styles.brandNote}>{t("brandNote")}</p>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.welcomeTitle}>{t("login.title")}</h2>
            <p className={styles.welcomeSub}>{t("login.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-email">
                {t("fields.email")}
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="login-email"
                  className={styles.input}
                  type="email"
                  placeholder={t("fields.emailPlaceholder")}
                  {...register("email", { required: true })}
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="login-password">
                  {t("fields.password")}
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
                  aria-label={showPassword ? t("fields.hidePassword") : t("fields.showPassword")}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errors.root?.serverError && <p className={styles.error}>{errors.root.serverError.message}</p>}

            <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("login.submitting") : t("login.submit")}
            </button>
          </form>

          <p className={styles.link}>
            {t("login.noAccount")} <Link to="/register">{t("login.createFree")}</Link>
          </p>
        </div>
      </section>
    </div>
  )
}

export default Login
