// A dated free-text entry the freelancer keeps on a client: what was said,
// sent or agreed, and when. Backed by public.notas (RLS on user_id).
export interface IClientNote {
  id: string
  client_id: string
  user_id?: string
  /** "YYYY-MM-DD" — a DB `date`, never a timestamp. */
  note_date: string
  content: string
  created_at?: string
}

export interface NewClientNote {
  client_id: string
  note_date: string
  content: string
}
