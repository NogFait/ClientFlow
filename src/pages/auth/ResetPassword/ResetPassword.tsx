import { useState } from "react"
import { Link } from "react-router-dom"
import { Lock, Eye, EyeOff, LinkIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toLocalizedPath } from "../../../i18n/paths"
import { useCurrentLang } from "../../../i18n/useCurrentLang"
import { useAuthState } from "../../../features/auth/context/authContext"
import { useResetPasswordForm } from "../../../features/auth/hooks/useAuth"
import { usePageMeta } from "../../../hooks/usePageMeta"
import { usePreferredLanguageSync } from "../../../i18n/usePreferredLanguageSync"
import LanguageSwitch from "../../../components/shared/LanguageSwitch/LanguageSwitch"
// Same brand panel + card as /register — see ForgotPassword.tsx.
import styles from "../Register/Register.module.css"

// Password recovery, step 2. The emailed link redirects here with a
// *recovery* session in the URL hash (implicit flow), which AuthProvider
// picks up — so "authenticated" is the normal state on this page, and
// "anonymous" means the link was already used, tampered with, or expired.
// Not wrapped in PublicOnlyRoute for that very reason.
const ResetPassword = () => {
  const { t } = useTranslation("auth")
  const lang = useCurrentLang()
  usePreferredLanguageSync()
  usePageMeta({ title: t("reset.metaTitle"), noindex: true })

  const { status } = useAuthState()
  const { register, handleSubmit, onSubmit, errors, isSubmitting, passwordRules, confirmRules } =
    useResetPasswordForm()
  const [showPassword, setShowPassword] = useState(false)

  if (status === "loading") return null

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
          <h1 className={styles.brandTitle}>{t("login.brandTitle")}</h1>
          <p className={styles.brandTagline}>{t("login.brandTagline")}</p>
        </div>

        <p className={styles.brandNote}>{t("brandNote")}</p>
      </section>

      <section className={styles.formPanel}>
        {status === "anonymous" ? (
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <LinkIcon size={36} className={styles.noticeIcon} aria-hidden="true" />
              <h2 className={styles.welcomeTitle}>{t("reset.invalidTitle")}</h2>
              <p className={styles.noticeBody}>{t("reset.invalidBody")}</p>
            </div>

            <p className={styles.link}>
              <Link to="/forgot-password">{t("reset.requestNew")}</Link>
            </p>
          </div>
        ) : (
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.welcomeTitle}>{t("reset.title")}</h2>
              <p className={styles.welcomeSub}>{t("reset.subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="reset-password">
                  {t("reset.newPassword")}
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} aria-hidden="true" />
                  <input
                    id="reset-password"
                    className={styles.input}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register("password", passwordRules)}
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
                {errors.password && <p className={styles.error}>{errors.password.message}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="reset-confirm">
                  {t("reset.confirmPassword")}
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} aria-hidden="true" />
                  <input
                    id="reset-confirm"
                    className={styles.input}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register("confirm", confirmRules)}
                  />
                </div>
                {errors.confirm && <p className={styles.error}>{errors.confirm.message}</p>}
              </div>

              {errors.root?.serverError && <p className={styles.error}>{errors.root.serverError.message}</p>}

              <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("reset.submitting") : t("reset.submit")}
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  )
}

export default ResetPassword
