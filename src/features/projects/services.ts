import { supabase } from "../../services/supabaseClient";
import { mapSupabaseError } from "../../services/supabaseErrors";
import type { IProject, ProjectStatus, ProjectWithClient } from "./types";

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
  if (error) throw mapSupabaseError(error)
}

// Obtener un proyecto por id junto con el nombre de su cliente — usado por
// el hub del proyecto. maybeSingle() (no single()) porque un id inexistente
// o oculto por RLS debe resolver en null, no lanzar.
export async function getProjectById(id: string): Promise<ProjectWithClient | null> {
  const { data, error } = await supabase
    .from("proyectos")
    .select(`*, clientes (name)`)
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as ProjectWithClient | null
}

// Cambiar solo el estado del proyecto (select del hub: Activo/Pausado/Completo).
export async function updateProjectStatus(id: string, status: ProjectStatus) {
  const { error } = await supabase
    .from("proyectos")
    .update({ status })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

// contar pagos de un proyecto (usado para bloquear el borrado de proyectos
// con pagos asociados — pagos.project_id no tiene ON DELETE, así que dejar
// que la FK lo rechace en silencio sería una UX confusa).
export async function countPaymentsByProject(projectId: string): Promise<number> {
  const { count, error } = await supabase
    .from("pagos")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
  if (error) throw new Error(error.message)
  return count ?? 0
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
