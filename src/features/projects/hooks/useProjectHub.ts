import { useEffect, useState } from "react"
import { getProjectById, updateProjectStatus } from "../services"
import type { ProjectStatus, ProjectWithClient } from "../types"
import { getTasksByProject, updateTaskStatus } from "../../tasks/services"
import type { ITask } from "../../tasks/types"
import { getPaymentsByProject } from "../../payments/services"
import type { IPayment } from "../../payments/types"
import { summarizeProject, type ProjectSummary } from "../domain/projectSummary"
import { useToast } from "../../../components/shared/Toast/useToast"

interface Loaded {
  key: string
  project: ProjectWithClient | null
  tasks: ITask[]
  payments: IPayment[]
}

export interface UseProjectHubResult {
  project: ProjectWithClient | null
  tasks: ITask[]
  payments: IPayment[]
  summary: ProjectSummary
  loading: boolean
  error: boolean
  notFound: boolean
  refresh: () => void
  toggleTaskDone: (task: ITask) => Promise<void>
  setStatus: (status: ProjectStatus) => Promise<void>
}

// Drives the project hub page: fetches the project + its tasks + its
// payments in parallel and derives loading/error/notFound from a request key
// (`${projectId}:${tick}`) rather than a synchronous setState in the effect —
// same house pattern as PaymentsPage's month selector (see engram
// payments/month-selector). A stale response for a projectId/tick that's no
// longer current can never overwrite newer state because its key won't match.
export function useProjectHub(projectId: string): UseProjectHubResult {
  const [tick, setTick] = useState(0)
  const requestKey = `${projectId}:${tick}`
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const toast = useToast()

  const error = errorKey === requestKey
  const loading = !error && loaded?.key !== requestKey
  const notFound = !loading && !error && loaded?.project === null

  useEffect(() => {
    const key = `${projectId}:${tick}`
    Promise.all([getProjectById(projectId), getTasksByProject(projectId), getPaymentsByProject(projectId)])
      .then(([project, tasks, payments]) => setLoaded({ key, project, tasks, payments }))
      .catch(() => setErrorKey(key))
  }, [projectId, tick])

  const project = loaded?.key === requestKey ? loaded.project : null
  const tasks = loaded?.key === requestKey ? loaded.tasks : []
  const payments = loaded?.key === requestKey ? loaded.payments : []

  const summary = summarizeProject({ budget: project?.budget ?? null, payments, tasks })

  const refresh = () => setTick((t) => t + 1)

  const toggleTaskDone = async (task: ITask) => {
    if (!task.id) return
    const nextStatus = task.status === "hechas" ? "pendiente" : "hechas"
    const previousTasks = tasks

    setLoaded((prev) =>
      prev && prev.key === requestKey
        ? { ...prev, tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)) }
        : prev,
    )

    try {
      await updateTaskStatus(task.id, nextStatus)
    } catch {
      setLoaded((prev) => (prev && prev.key === requestKey ? { ...prev, tasks: previousTasks } : prev))
      toast.error("No se pudo actualizar la tarea. Intentalo de nuevo.")
    }
  }

  const setStatus = async (status: ProjectStatus) => {
    if (!projectId) return
    const pendingCount = tasks.filter((t) => t.status !== "hechas").length
    await updateProjectStatus(projectId, status)
    if (status === "completo" && pendingCount > 0) {
      toast.info(`Quedan ${pendingCount} tareas pendientes`)
    }
    refresh()
  }

  return { project, tasks, payments, summary, loading, error, notFound, refresh, toggleTaskDone, setStatus }
}
