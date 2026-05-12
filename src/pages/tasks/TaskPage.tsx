import { useState, useEffect } from "react"
import type { ITask } from "../../features/tasks/types"
import type { IProject } from "../../features/projects/types"
import { getTasks, deleteTask } from "../../features/tasks/services"
import { getProjects } from "../../features/projects/services"
import { useTaskForm } from "../../features/tasks/hooks/useTaskForm"
import TaskColumn from "../../features/tasks/components/TaskColumn/TaskColumn"
import TaskForm from "../../features/tasks/components/TaskForm/TaskForm"
import Modal from "../../components/shared/Modal/Modal"
import PageHeader from "../../components/shared/PageHeader/PageHeader"
import Loader from "../../components/shared/Loader/Loader"
import styles from "./TaskPage.module.css"

type ModalMode = "create" | "edit" | "view" | null

const columns = [
  { key: "pendiente" as const, title: "Pendiente" },
  { key: "en_progreso" as const, title: "En Progreso" },
  { key: "hechas" as const, title: "Hechas" },
]

const TaskPage = () => {
  const [tasks, setTasks] = useState<(ITask & { proyectos?: { name: string } | null })[]>([])
  const [projects, setProjects] = useState<IProject[]>([])
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshTasks = async () => {
    const updated = await getTasks()
    setTasks(updated)
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedTask(null)
    reset()
  }

  const { register, handleSubmit, onSubmit, reset, errors, isSubmitting } = useTaskForm(() => {
    closeModal()
    refreshTasks()
  }, selectedTask ?? undefined)

  useEffect(() => {
    Promise.all([
      refreshTasks(),
      getProjects().then(setProjects).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleView = (task: ITask & { proyectos?: { name: string } | null }) => {
    setSelectedTask(task)
    setModalMode("view")
  }

  const handleEdit = (task: ITask & { proyectos?: { name: string } | null }) => {
    setSelectedTask(task)
    setModalMode("edit")
  }

  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (task: ITask) => {
    if (window.confirm(`¿Eliminar "${task.title}"?`)) {
      try {
        await deleteTask(task.id!)
        refreshTasks()
      } catch {
        setDeleteError("No se pudo eliminar la tarea. Intentalo de nuevo.")
      }
    }
  }

  const modalTitle = modalMode === "create" ? "Nueva Tarea"
    : modalMode === "edit" ? "Editar Tarea"
    : modalMode === "view" ? "Detalle de Tarea"
    : ""

  const selectedWithProject = selectedTask
    ? tasks.find(t => t.id === selectedTask.id)
    : null

  return (
    <div>
      <PageHeader
        title="Tablero de Tareas"
        actionLabel="Crear Tarea"
        onAction={() => { setSelectedTask(null); setModalMode("create") }}
      />

      {deleteError && (
        <div className={styles.errorBanner}>
          <span>{deleteError}</span>
          <button className={styles.errorClose} onClick={() => setDeleteError(null)}>&times;</button>
        </div>
      )}

      {loading ? (
        <div className={styles.loaderSection}><Loader /></div>
      ) : (
        <div className={styles.columnsContainer}>
          {columns.map(col => (
            <TaskColumn
              key={col.key}
              title={col.title}
              tasks={tasks.filter(t => t.status === col.key)}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal isOpen={modalMode !== null} onClose={closeModal} title={modalTitle}>
        {modalMode === "view" && selectedWithProject && (
          <div className={styles.viewMode}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Título</span>
              <span className={styles.value}>{selectedWithProject.title}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Estado</span>
              <span className={`${styles.badge} ${styles[selectedWithProject.status === "pendiente" ? "badgePendiente" : selectedWithProject.status === "en_progreso" ? "badgeEnProgreso" : "badgeHechas"]}`}>
                {selectedWithProject.status === "pendiente" ? "Pendiente" : selectedWithProject.status === "en_progreso" ? "En Progreso" : "Hecha"}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Prioridad</span>
              <span className={`${styles.badge} ${styles[selectedWithProject.priority === "low" ? "badgeBaja" : selectedWithProject.priority === "medium" ? "badgeMedia" : "badgeAlta"]}`}>
                {selectedWithProject.priority === "low" ? "Baja" : selectedWithProject.priority === "medium" ? "Media" : "Alta"}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Proyecto</span>
              <span className={styles.value}>{selectedWithProject.proyectos?.name ?? "Sin proyecto"}</span>
            </div>
            {selectedWithProject.due_date && (
              <div className={styles.field}>
                <span className={styles.label}>Vence</span>
                <span className={styles.value}>{new Date(selectedWithProject.due_date).toLocaleDateString()}</span>
              </div>
            )}
            <div className={styles.field}>
              <span className={styles.label}>Creado</span>
              <span className={styles.value}>{new Date(selectedWithProject.created_at!).toLocaleDateString()}</span>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Descripción</span>
              <span className={`${styles.value} ${styles.valueMuted}`}>{selectedWithProject.description ?? "—"}</span>
            </div>
            <button className={styles.closeBtn} onClick={closeModal}>Cerrar</button>
          </div>
        )}

        {(modalMode === "create" || modalMode === "edit") && (
          <TaskForm
            register={register}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            errors={errors}
            isSubmitting={isSubmitting}
            onCancel={closeModal}
            projects={projects}
          />
        )}
      </Modal>
    </div>
  )
}

export default TaskPage
