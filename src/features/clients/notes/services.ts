import { supabase } from "../../../services/supabaseClient"
import type { IClientNote, NewClientNote } from "./types"

// Newest first: the last thing that happened with the client is what the
// freelancer opens the detail to check.
export async function getClientNotes(clientId: string) {
  const { data, error } = await supabase
    .from("notas")
    .select("*")
    .eq("client_id", clientId)
    .order("note_date", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return data as IClientNote[]
}

export async function createClientNote(note: NewClientNote) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("notas")
    .insert({ ...note, user_id: user?.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as IClientNote
}

export async function deleteClientNote(id: string) {
  const { error } = await supabase.from("notas").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
