export type ClientStatus = "pendiente" | "activo" | "inactivo"

export interface IClient {
    id?: string
    name: string
    email: string
    celular: string
    company: string
    status: ClientStatus
    user_id?: string
    created_at?:string
}