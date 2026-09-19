import { Link } from "react-router-dom"
import { Mail, MailCheck } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import { toLocalizedPath } from "../../../i18n/paths"
import { useCurrentLang } from "../../../i18n/useCurrentLang"
import { useForgotPasswordForm } from "../../../features/auth/hooks/useAuth"
import { usePageMeta } from "../../../hooks/usePageMeta"
import { usePreferredLanguageSync } from "../../../i18n/usePreferredLanguageSync"
import LanguageSwitch from "../../../components/shared/LanguageSwitch/LanguageSwitch"
// Same brand panel + card as /register (the notice styles included); the
// two recovery pages share Register's stylesheet rather than copying it.
import styles from "../Register/Register.module.css"

// Password recovery, step 1: "which email?" → Supabase sends the link.
const ForgotPassword = () => {
  const { t } = useTranslation("auth")
  const lang = useCurrentLang()
  usePreferredLanguageSync()
  usePageMeta({ title: t("forgot.metaTitle"), noindex: true })

  const { register, handleSubmit, onSubmit, errors, isSubmitting, sentTo } = useForgotPasswordForm()

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
        {sentTo ? (
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <MailCheck size={36} className={styles.noticeIcon} aria-hidden="true" />
              <h2 className={styles.welcomeTitle}>{t("forgot.sentTitle")}</h2>
              <p className={styles.noticeBody}>
                <Trans
                  t={t}
                  i18nKey="forgot.sentBody"
                  values={{ email: sentTo }}
                  components={[<span key="0" />, <strong key="1" className={styles.noticeEmail} />]}
                />
              </p>
              <p className={styles.welcomeSub}>{t("forgot.sentHint")}</p>
            </div>

            <p className={styles.link}>
              <Link to="/login">{t("forgot.backToLogin")}</Link>
            </p>
          </div>
        ) : (
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.welcomeTitle}>{t("forgot.title")}</h2>
              <p className={styles.welcomeSub}>{t("forgot.subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="forgot-email">
                  {t("fields.email")}
                </label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} className={styles.inputIcon} aria-hidden="true" />
                  <input
                    id="forgot-email"
                    className={styles.input}
                    type="email"
                    autoComplete="email"
                    placeholder={t("fields.emailPlaceholder")}
                    {...register("email", { required: true })}
                  />
                </div>
              </div>

              {errors.root?.serverError && <p className={styles.error}>{errors.root.serverError.message}</p>}

              <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("forgot.submitting") : t("forgot.submit")}
              </button>
            </form>

            <p className={styles.link}>
              <Link to="/login">{t("forgot.backToLogin")}</Link>
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

export default ForgotPassword
