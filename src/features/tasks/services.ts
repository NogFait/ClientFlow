import { supabase } from "../../services/supabaseClient"
import type { ITask } from "./types"

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
