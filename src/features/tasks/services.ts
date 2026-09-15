import { supabase } from "../../services/supabaseClient"
import type { ITask, TaskStatus } from "./types"

export async function getTasks() {
  const { data, error } = await supabase
    .from("tareas")
    .select(`*, proyectos (name)`)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return data as (ITask & { proyectos?: { name: string } | null })[]
}

export async function createTask(task: ITask) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from("tareas")
    .insert({
      ...task,
      user_id: user?.id,
      due_date: task.due_date || null,
    })
  if (error) throw new Error(error.message)
}

export async function updateTask(id: string, task: Partial<ITask>) {
  const { error } = await supabase
    .from("tareas")
    .update({ ...task, due_date: task.due_date || null })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteTask(id: string) {
  const { error } = await supabase
    .from("tareas").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// Tareas de un proyecto (hub), ordenadas por vencimiento próximo primero y
// las sin fecha al final; empate por fecha de creación.
export async function getTasksByProject(projectId: string): Promise<ITask[]> {
  const { data, error } = await supabase
    .from("tareas")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return data as ITask[]
}

// Cambiar solo el estado de una tarea (checkbox hechas <-> pendiente en el hub).
export async function updateTaskStatus(id: string, status: TaskStatus) {
  const { error } = await supabase
    .from("tareas")
    .update({ status })
    .eq("id", id)
  if (error) throw new Error(error.message)
}
