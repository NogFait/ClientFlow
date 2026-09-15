import { supabase } from "../../services/supabaseClient";
import { mapSupabaseError } from "../../services/supabaseErrors";
import type { IProject } from "./types";

//Obtener Proyectos

export async function getProjects() {
    const {data, error} = await supabase
    .from("proyectos")
    .select(`*, clientes (name)`)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    return data as (IProject & {clientes?: {name:string}})[]
}

// crear proyecto
export async function createProject(project: IProject){
    const {data: {user}} = await supabase.auth.getUser()
    const {error} = await supabase
        .from("proyectos")
        .insert({
            ...project,
            user_id: user?.id,
            start_date: project.start_date || null,
            end_date: project.end_date || null,
        })
    if (error) throw mapSupabaseError(error)
}

// actualizar proyecto
export async function updateProject(id: string, project: Partial<IProject>) {
  const { error } = await supabase
    .from("proyectos").update({
      ...project,
      start_date: project.start_date || null,
      end_date: project.end_date || null,
    }).eq("id", id)
  if (error) throw new Error(error.message)
}

// eliminar proyecto
export async function deleteProject(id: string) {
  const { error } = await supabase
    .from("proyectos").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// contar proyectos de un cliente (usado para bloquear el borrado de clientes
// con proyectos asociados en lugar de dejar que la FK lo rechace en silencio)
export async function countProjectsByClient(clientId: string): Promise<number> {
  const { count, error } = await supabase
    .from("proyectos")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
  if (error) throw new Error(error.message)
  return count ?? 0
}
