export type ProjectStatus = "activo" | "pausado" | "completo"
export interface IProject {
  id?: string
  user_id?: string
  client_id?: string
  name: string
  description?: string
  status: ProjectStatus
  budget?: number
  start_date?: string
  end_date?: string
  created_at?: string
}

// Project joined with its client's name (select `*, clientes (name)`) — used
// by the project hub and anywhere the client name is displayed alongside
// project data.
export type ProjectWithClient = IProject & { clientes?: { name: string } | null }