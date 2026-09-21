import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Trash2 } from "lucide-react"
import { useCurrentLang } from "../../../../../i18n/useCurrentLang"
import { formatDateOnly, todayDateOnly } from "../../../../../i18n/locale"
import { createClientNote, deleteClientNote, getClientNotes } from "../../services"
import type { IClientNote } from "../../types"
import styles from "./ClientNotes.module.css"

interface ClientNotesProps {
  clientId: string
}

type LoadState = "loading" | "ready" | "error"

// The client's history: dated notes, newest first, plus a small form to add
// one. Lives inside the client detail modal. Deleting asks inline (the
// shared ConfirmDialog is a Modal without a portal — nesting it inside the
// detail modal would stack two fixed overlays).
const ClientNotes = ({ clientId }: ClientNotesProps) => {
  const { t } = useTranslation("app")
  const lang = useCurrentLang()
  const [notes, setNotes] = useState<IClientNote[]>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [noteDate, setNoteDate] = useState(todayDateOnly)
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Mounted fresh per client (the caller keys it by client id), so the
  // initial "loading" state is the reset — no synchronous setState here.
  useEffect(() => {
    let cancelled = false
    getClientNotes(clientId)
      .then((rows) => {
        if (cancelled) return
        setNotes(rows)
        setLoadState("ready")
      })
      .catch(() => {
        if (!cancelled) setLoadState("error")
      })
    return () => {
      cancelled = true
    }
  }, [clientId])

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) {
      setFormError(t("clients.notes.blank"))
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const created = await createClientNote({ client_id: clientId, note_date: noteDate, content: trimmed })
      setNotes((current) => [created, ...current])
      setContent("")
    } catch {
      setFormError(t("clients.notes.saveError"))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleteError(null)
    try {
      await deleteClientNote(id)
      setNotes((current) => current.filter((note) => note.id !== id))
    } catch {
      setDeleteError(t("clients.notes.deleteError"))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <section className={styles.section} aria-labelledby="client-notes-title">
      <div className={styles.header}>
        <h3 id="client-notes-title" className={styles.title}>{t("clients.notes.title")}</h3>
        <p className={styles.hint}>{t("clients.notes.hint")}</p>
      </div>

      <form className={styles.form} onSubmit={handleAdd} noValidate>
        <div className={styles.row}>
          <label className={styles.label} htmlFor="client-note-date">{t("clients.notes.date")}</label>
          <input
            id="client-note-date"
            className={styles.input}
            type="date"
            value={noteDate}
            onChange={(e) => setNoteDate(e.target.value)}
            required
          />
        </div>
        <div className={styles.row}>
          <label className={styles.label} htmlFor="client-note-text">{t("clients.notes.text")}</label>
          <textarea
            id="client-note-text"
            className={styles.textarea}
            rows={2}
            maxLength={2000}
            placeholder={t("clients.notes.placeholder")}
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (formError) setFormError(null)
            }}
          />
        </div>
        {formError && <p className={styles.error} role="alert">{formError}</p>}
        <div className={styles.actions}>
          <button type="submit" className={styles.addBtn} disabled={saving}>
            {saving ? t("clients.notes.adding") : t("clients.notes.add")}
          </button>
        </div>
      </form>

      {deleteError && <p className={styles.error} role="alert">{deleteError}</p>}

      {loadState === "error" && <p className={styles.error} role="alert">{t("clients.notes.loadError")}</p>}
      {loadState === "ready" && notes.length === 0 && <p className={styles.empty}>{t("clients.notes.empty")}</p>}
      {loadState === "ready" && notes.length > 0 && (
        <ul className={styles.list}>
          {notes.map((note) => (
            <li key={note.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <time className={styles.date} dateTime={note.note_date}>{formatDateOnly(note.note_date, lang)}</time>
                {pendingDelete === note.id ? (
                  <span className={styles.confirm}>
                    <span>{t("clients.notes.confirmDelete")}</span>
                    <button type="button" className={styles.confirmYes} onClick={() => handleDelete(note.id)}>
                      {t("clients.notes.yes")}
                    </button>
                    <button type="button" className={styles.confirmNo} onClick={() => setPendingDelete(null)}>
                      {t("clients.notes.no")}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    aria-label={t("shared.delete")}
                    title={t("shared.delete")}
                    onClick={() => setPendingDelete(note.id)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <p className={styles.content}>{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ClientNotes
