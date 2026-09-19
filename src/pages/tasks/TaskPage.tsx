import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useCurrentLang } from "../../i18n/useCurrentLang"
import { formatDate } from "../../i18n/locale"
import type { ITask } from "../../features/tasks/types"
import type { IProject } from "../../features/projects/types"
import { getTasks, deleteTask } from "../../features/tasks/services"
import { getProjects } from "../../features/projects/services"
import { useTaskForm } from "../../features/tasks/hooks/useTaskForm"
import TaskColumn from "../../features/tasks/components/TaskColumn/TaskColumn"
import TaskForm from "../../features/tasks/components/TaskForm/TaskForm"
import Modal from "../../components/shared/Modal/Modal"
import ConfirmDialog from "../../components/shared/ConfirmDialog/ConfirmDialog"
import { useConfirm } from "../../hooks/useConfirm"
import PageHeader from "../../components/shared/PageHeader/PageHeader"
import Loader from "../../components/shared/Loader/Loader"
import EmptyState from "../../components/shared/EmptyState/EmptyState"
import { useToast } from "../../components/shared/Toast/useToast"
import { ClipboardList } from "lucide-react"
import styles from "./TaskPage.module.css"

type ModalMode = "create" | "edit" | "view" | null

// Board columns = the DB status values; titles come from status.task.*.
const columns = ["pendiente", "en_progreso", "hechas"] as const

const TaskPage = () => {
  const { t } = useTranslation("app")
  const lang = useCurrentLang()
  const [tasks, setTasks] = useState<(ITask & { proyectos?: { name: string } | null })[]>([])
  const [projects, setProjects] = useState<IProject[]>([])
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const refreshTasks = async () => {
    const updated = await getTasks()
    setTasks(updated)
  }

  const { register, handleSubmit, onSubmit, reset, errors, isSubmitting } = useTaskForm(() => {
    setModalMode(null)
    setSelectedTask(null)
    refreshTasks()
    toast.success(t("tasks.saved"))
  }, selectedTask ?? undefined)

  const closeModal = () => {
    setModalMode(null)
    setSelectedTask(null)
    reset()
  }

  useEffect(() => {
    Promise.all([
      getTasks().then(setTasks).catch(() => {}),
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
  const { confirm, dialogProps } = useConfirm()

  const handleDelete = async (task: ITask) => {
    const confirmed = await confirm({ title: t("tasks.confirmDelete", { title: task.title }) })
    if (!confirmed) return
    try {
      await deleteTask(task.id!)
      refreshTasks()
      toast.success(t("tasks.deleted"))
    } catch {
      setDeleteError(t("tasks.deleteError"))
    }
  }

  const handleNewTaskAction = () => {
    setSelectedTask(null)
    setModalMode("create")
  }

  const modalTitle = modalMode === "create" ? t("tasks.new")
    : modalMode === "edit" ? t("tasks.edit")
    : modalMode === "view" ? t("tasks.detail")
    : ""

  const selectedWithProject = selectedTask
    ? tasks.find(task => task.id === selectedTask.id)
    : null

  return (
    <div>
      <PageHeader
        title={t("tasks.title")}
        actionLabel={t("tasks.create")}
        onAction={handleNewTaskAction}
      />

      {deleteError && (
        <div className={styles.errorBanner}>
          <span>{deleteError}</span>
          <button className={styles.errorClose} onClick={() => setDeleteError(null)}>&times;</button>
        </div>
      )}

      {loading ? (
        <div className={styles.loaderSection}><Loader /></div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t("tasks.empty.title")}
          description={t("tasks.empty.description")}
          actionLabel={t("tasks.empty.action")}
          onAction={handleNewTaskAction}
        />
      ) : (
        <div className={styles.columnsContainer}>
          {columns.map(status => (
            <TaskColumn
              key={status}
              title={t(`status.task.${status}`)}
              tasks={tasks.filter(task => task.status === status)}
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
              <span className={styles.label}>{t("tasks.fields.title")}</span>
              <span className={styles.value}>{selectedWithProject.title}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t("tasks.fields.status")}</span>
              <span className={`${styles.badge} ${styles[selectedWithProject.status === "pendiente" ? "badgePendiente" : selectedWithProject.status === "en_progreso" ? "badgeEnProgreso" : "badgeHechas"]}`}>
                {selectedWithProject.status === "hechas" ? t("tasks.view.statusDone") : t(`status.task.${selectedWithProject.status}`)}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t("tasks.fields.priority")}</span>
              <span className={`${styles.badge} ${styles[selectedWithProject.priority === "low" ? "badgeBaja" : selectedWithProject.priority === "medium" ? "badgeMedia" : "badgeAlta"]}`}>
                {t(`status.priority.${selectedWithProject.priority}`)}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t("tasks.fields.project")}</span>
              <span className={styles.value}>{selectedWithProject.proyectos?.name ?? t("tasks.noProject")}</span>
            </div>
            {selectedWithProject.due_date && (
              <div className={styles.field}>
                <span className={styles.label}>{t("tasks.fields.due")}</span>
                <span className={styles.value}>{formatDate(selectedWithProject.due_date, lang)}</span>
              </div>
            )}
            <div className={styles.field}>
              <span className={styles.label}>{t("tasks.fields.created")}</span>
              <span className={styles.value}>{formatDate(selectedWithProject.created_at!, lang)}</span>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>{t("tasks.fields.description")}</span>
              <span className={`${styles.value} ${styles.valueMuted}`}>{selectedWithProject.description ?? "—"}</span>
            </div>
            <button className={styles.closeBtn} onClick={closeModal}>{t("shared.close")}</button>
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

      <ConfirmDialog
        {...dialogProps}
        description={dialogProps.description ?? t("shared.irreversible")}
      />
    </div>
  )
}

export default TaskPage
