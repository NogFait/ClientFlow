import { useTranslation } from "react-i18next"
import { useResendConfirmation } from "../../../features/auth/hooks/useAuth"
import styles from "./ResendConfirmation.module.css"

interface ResendConfirmationProps {
  /** Address the signup confirmation is re-sent to. */
  email: string
  /** Button label (differs between the post-register notice and the login error). */
  label: string
}

// "Didn't get the email?" button with its outcome underneath. Used after a
// successful signup and under the login form's "email not confirmed" error.
export default function ResendConfirmation({ email, label }: ResendConfirmationProps) {
  const { t } = useTranslation("auth")
  const { resend, status } = useResendConfirmation()

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        disabled={status.kind === "sending"}
        onClick={() => resend(email)}
      >
        {status.kind === "sending" ? t("register.checkInbox.resending") : label}
      </button>
      {status.kind === "sent" && (
        <p className={styles.ok} role="status">
          {t("register.checkInbox.resent")}
        </p>
      )}
      {status.kind === "error" && (
        <p className={styles.error} role="alert">
          {status.message}
        </p>
      )}
    </div>
  )
}
