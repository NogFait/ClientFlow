import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Mail } from "lucide-react"
import { getUserSettings, setWeeklyDigest } from "../../services"
import styles from "./WeeklyDigestToggle.module.css"

// Opt-out for the Pro weekly digest. Optimistic: flips at once, reverts on
// failure. Rendered inside <ProFeature> on the billing page.
const WeeklyDigestToggle = () => {
  const { t } = useTranslation("app")
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getUserSettings()
      .then((s) => {
        if (!cancelled) setEnabled(s.weekly_digest)
      })
      .catch(() => {
        if (!cancelled) setEnabled(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = async () => {
    if (enabled === null || saving) return
    const next = !enabled
    setEnabled(next)
    setSaving(true)
    setError(null)
    try {
      await setWeeklyDigest(next)
    } catch {
      setEnabled(!next)
      setError(t("billing.weeklyDigest.saveError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.card} aria-labelledby="weekly-digest-title">
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Mail size={16} />
        </span>
        <div className={styles.text}>
          <h3 id="weekly-digest-title" className={styles.title}>{t("billing.weeklyDigest.title")}</h3>
          <p className={styles.description}>{t("billing.weeklyDigest.description")}</p>
        </div>
      </div>
      <div className={styles.controlRow}>
        <span className={styles.state}>{enabled ? t("billing.weeklyDigest.on") : t("billing.weeklyDigest.off")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled === true}
          aria-label={t("billing.weeklyDigest.toggleLabel")}
          className={`${styles.switch} ${enabled ? styles.switchOn : ""}`}
          disabled={enabled === null || saving}
          onClick={toggle}
        >
          <span className={styles.knob} />
        </button>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>
  )
}

export default WeeklyDigestToggle
