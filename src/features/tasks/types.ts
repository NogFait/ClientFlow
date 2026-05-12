export type TaskStatus = "pendiente" | "en_progreso" | "hechas"
export type TaskPriority = "low" | "medium" | "high"

export interface ITask {
  id?: string
  user_id?: string
  project_id?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: string
  created_at?: string
}
