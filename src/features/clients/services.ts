import { supabase } from "../../services/supabaseClient";
import type { IClient } from "./types";


//Obtener clientes
export async function getClients(){
    const {data,error} = await supabase
        .from("clientes")
        .select("*")
        .order("name", {ascending : true})
    if (error) throw new Error(error.message)
    return data as IClient[]
}


//Crear Cliente
export async function createClient(client:IClient) {
    const { data: { user } } = await supabase.auth.getUser()
    const {error} = await supabase
        .from("clientes").insert({ ...client, user_id: user?.id })
    if (error) throw new Error(error.message)
}

//Actualizar Cliente
export async function updateClient (id: string, client:Partial<IClient>){
    const {error} = await supabase
        .from("clientes").update(client).eq("id", id)
    if (error) throw new Error(error.message)
}

//Eliminar Cliente
export async function deleteClient (id: string){
    const {error} = await supabase
        .from("clientes").delete().eq("id", id)
    if (error) throw new Error(error.message)
}
