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

// Latest note per client, for the "last activity" line in the client list.
// One ordered query over the user's notes (RLS scopes it), first hit per
// client wins — a freelancer's notes are in the hundreds at most, so this
// beats a per-row query or a DB view for now.
export async function getLatestNoteByClient() {
  const { data, error } = await supabase
    .from("notas")
    .select("*")
    .order("note_date", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  const latest: Record<string, IClientNote> = {}
  for (const note of data as IClientNote[]) {
    if (!(note.client_id in latest)) latest[note.client_id] = note
  }
  return latest
}
