import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, X } from "lucide-react"
import styles from "./OnboardingChecklist.module.css"

const DISMISSED_KEY = "clientflow.onboarding.dismissed"

interface OnboardingChecklistProps {
  hasClients: boolean
  hasProjects: boolean
  hasPayments: boolean
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "true"
  } catch {
    return false
  }
}

interface Step {
  label: string
  done: boolean
  path: string
}

// First-login nudge for Dashboard (task 3.11): only relevant for a genuinely
// brand-new account (0 clientes AND 0 proyectos) — the moment either exists
// the user has "graduated" past onboarding and the per-section EmptyState
// widgets (chart/tasks) take over. Dismissable and persisted per browser via
// localStorage; auto-hides once all three steps are already done.
const OnboardingChecklist = ({ hasClients, hasProjects, hasPayments }: OnboardingChecklistProps) => {
  const [dismissed, setDismissed] = useState(readDismissed)
  const navigate = useNavigate()

  const allDone = hasClients && hasProjects && hasPayments
  const shouldShow = !dismissed && !allDone && !hasClients && !hasProjects

  if (!shouldShow) return null

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "true")
    } catch {
      // Private browsing / storage disabled — dismissing just for this
      // render is still better than throwing.
    }
    setDismissed(true)
  }

  const steps: Step[] = [
    { label: "Cargá tu primer cliente", done: hasClients, path: "/clients" },
    { label: "Creá un proyecto", done: hasProjects, path: "/projects" },
    { label: "Registrá un cobro", done: hasPayments, path: "/payments" },
  ]

  return (
    <div className={styles.card}>
      <button type="button" className={styles.dismiss} aria-label="Cerrar" onClick={handleDismiss}>
        <X size={16} />
      </button>
      <h2 className={styles.title}>Empezá en 3 pasos</h2>
      <ol className={styles.steps}>
        {steps.map((step, index) => (
          <li key={step.path} className={styles.step}>
            <span
              className={`${styles.stepMarker} ${step.done ? styles.stepMarkerDone : ""}`}
              aria-label={step.done ? "Paso completado" : undefined}
            >
              {step.done ? <Check size={14} /> : index + 1}
            </span>
            <button
              type="button"
              className={`${styles.stepAction} ${step.done ? styles.stepDone : ""}`}
              onClick={() => navigate(step.path)}
            >
              {step.label}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default OnboardingChecklist
