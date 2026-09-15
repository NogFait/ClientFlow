import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ChevronRight, DollarSign, Clock, CheckSquare, ClipboardList, Receipt, FolderX } from "lucide-react"
import { useProjectHub } from "../../../features/projects/hooks/useProjectHub"
import { useProjectForm } from "../../../features/projects/hooks/useProjectForm"
import { useTaskForm } from "../../../features/tasks/hooks/useTaskForm"
import { usePaymentForm } from "../../../features/payments/hooks/usePaymentForm"
import { deleteProject, countPaymentsByProject } from "../../../features/projects/services"
import { getClients } from "../../../features/clients/services"
import type { IClient } from "../../../features/clients/types"
import type { ProjectStatus } from "../../../features/projects/types"
import type { ITask } from "../../../features/tasks/types"
import ProjectForm from "../../../features/projects/components/ProjectForm/ProjectForm"
import TaskForm from "../../../features/tasks/components/TaskForm/TaskForm"
import PaymentForm from "../../../features/payments/components/PaymentForm/PaymentForm"
import Modal from "../../../components/shared/Modal/Modal"
import ConfirmDialog from "../../../components/shared/ConfirmDialog/ConfirmDialog"
import { useConfirm } from "../../../hooks/useConfirm"
import StatCard from "../../../components/shared/StatCard/StatCard"
import Loader from "../../../components/shared/Loader/Loader"
import EmptyState from "../../../components/shared/EmptyState/EmptyState"
import { useToast } from "../../../components/shared/Toast/useToast"
import { formatCurrency } from "../../../utils/currency"
import { ForeignKeyViolationError } from "../../../services/supabaseErrors"
import styles from "./ProjectHubPage.module.css"

type ModalKind = "edit" | "task" | "payment" | null

const statusLabels: Record<ProjectStatus, string> = {
  activo: "Activo",
  pausado: "Pausado",
  completo: "Completo",
}

const priorityLabels: Record<ITask["priority"], string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
}

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  other: "Otro",
}

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : "—")

const ProjectHubPage = () => {
  const { id = "" } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const {
    project,
    tasks,
    payments,
    summary,
    loading,
    error,
    notFound,
    refresh,
    toggleTaskDone,
    setStatus,
  } = useProjectHub(id)

  const [clients, setClients] = useState<IClient[]>([])
  useEffect(() => {
    getClients().then(setClients).catch(() => {})
  }, [])

  const [modal, setModal] = useState<ModalKind>(null)

  const projectForm = useProjectForm(() => {
    setModal(null)
    refresh()
    toast.success("Proyecto guardado")
  }, project ?? undefined)

  const taskForm = useTaskForm(() => {
    setModal(null)
    refresh()
    toast.success("Tarea guardada")
  }, undefined, id)

  const paymentForm = usePaymentForm(() => {
    setModal(null)
    refresh()
    toast.success("Pago registrado")
  }, undefined, id)

  const closeModal = () => {
    setModal(null)
    projectForm.reset()
    taskForm.reset()
    paymentForm.reset()
  }

  const { confirm, dialogProps } = useConfirm()

  const handleDelete = async () => {
    if (!project?.id) return
    const paymentsCount = await countPaymentsByProject(project.id)
    if (paymentsCount > 0) {
      await confirm({
        title: `No se puede eliminar ${project.name}`,
        description: `Tiene ${paymentsCount} pago(s) registrado(s). Eliminá esos pagos primero.`,
        confirmLabel: "Entendido",
        cancelLabel: null,
        danger: false,
      })
      return
    }

    const confirmed = await confirm({ title: `¿Eliminar el proyecto "${project.name}"?` })
    if (!confirmed) return
    try {
      await deleteProject(project.id)
      toast.success("Proyecto eliminado")
      navigate("/projects")
    } catch (err) {
      toast.error(
        err instanceof ForeignKeyViolationError
          ? "No se puede eliminar: el proyecto tiene pagos asociados."
          : "No se pudo eliminar el proyecto. Intentalo de nuevo.",
      )
    }
  }

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(event.target.value as ProjectStatus)
  }

  if (loading) {
    return (
      <div className={styles.loaderSection}>
        <Loader />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className={styles.notFoundState}>
        <EmptyState
          icon={FolderX}
          title="Proyecto no encontrado"
          description="Puede que haya sido eliminado o que no tengas acceso a él."
        />
        <Link className={styles.backLink} to="/projects">Volver a proyectos</Link>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className={styles.errorState}>
        <p>No se pudo cargar el proyecto. Intentalo de nuevo.</p>
        <button type="button" className={styles.retryBtn} onClick={refresh}>Reintentar</button>
      </div>
    )
  }

  return (
    <div>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link to="/projects">Proyectos</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <span>{project.name}</span>
      </nav>

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{project.name}</h1>
          <p className={styles.clientName}>{project.clientes?.name ?? "Sin cliente"}</p>
          <p className={styles.dates}>{formatDate(project.start_date)} → {formatDate(project.end_date)}</p>
        </div>
        <div className={styles.headerActions}>
          <label htmlFor="hub-status" className={styles.statusLabel}>Estado del proyecto</label>
          <select
            id="hub-status"
            aria-label="Estado del proyecto"
            className={styles.statusSelect}
            value={project.status}
            onChange={handleStatusChange}
          >
            {(Object.keys(statusLabels) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
          <button type="button" className={styles.editBtn} onClick={() => setModal("edit")}>Editar</button>
          <button type="button" className={styles.deleteBtn} onClick={handleDelete}>Eliminar</button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          label="Presupuesto"
          value={summary.budget != null ? formatCurrency(summary.budget) : "Sin presupuesto"}
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          label="Cobrado"
          value={formatCurrency(summary.paid)}
          secondaryValue={summary.paidPct != null ? `${summary.paidPct} %` : undefined}
          icon={CheckSquare}
          variant="success"
          progressPct={summary.paidPct ?? undefined}
        />
        <StatCard
          label="Pendiente de cobro"
          value={formatCurrency(summary.pending)}
          secondaryValue={`${summary.pendingCount} pago(s)`}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          label="Tareas"
          value={`${summary.tasksDone} / ${summary.tasksTotal} hechas`}
          icon={ClipboardList}
          variant="default"
          progressPct={summary.tasksPct ?? undefined}
        />
      </div>

      <div className={styles.sections}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tareas</h2>
            <button type="button" className={styles.sectionAction} onClick={() => setModal("task")}>+ Nueva tarea</button>
          </div>
          {tasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin tareas en este proyecto"
              description="Agregá tareas para hacer seguimiento del trabajo."
              actionLabel="+ Nueva tarea"
              onAction={() => setModal("task")}
            />
          ) : (
            <ul className={styles.taskList}>
              {tasks.map((task) => {
                const isDone = task.status === "hechas"
                return (
                  <li key={task.id} className={styles.taskRow}>
                    {/* Wrapping the checkbox in a <label> grows its tap target
                        to 40px on mobile (via CSS) without changing its
                        visual size or its accessible name (still the
                        checkbox's own aria-label). */}
                    <label className={styles.checkboxWrap}>
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleTaskDone(task)}
                        aria-label={isDone ? "Marcar como pendiente" : "Marcar como hecha"}
                      />
                    </label>
                    <span className={`${styles.taskTitle} ${isDone ? styles.taskTitleDone : ""}`}>{task.title}</span>
                    <span className={styles.priorityBadge}>{priorityLabels[task.priority]}</span>
                    <span className={styles.dueDate}>{formatDate(task.due_date)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Pagos</h2>
            <button type="button" className={styles.sectionAction} onClick={() => setModal("payment")}>+ Registrar pago</button>
          </div>
          {payments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Sin pagos en este proyecto"
              description="Registrá los cobros para hacer seguimiento de los ingresos."
              actionLabel="+ Registrar pago"
              onAction={() => setModal("payment")}
            />
          ) : (
            <>
              <ul className={styles.paymentList}>
                {payments.map((payment) => {
                  const isPagado = payment.status === "pagado"
                  return (
                    <li key={payment.id} className={styles.paymentRow}>
                      <span className={styles.paymentDate}>{formatDate(payment.payment_date)}</span>
                      <span className={styles.paymentAmount}>{formatCurrency(Number(payment.amount))}</span>
                      <span className={`${styles.badge} ${isPagado ? styles.badgePagado : styles.badgePendiente}`}>
                        {isPagado ? "Pagado" : "Pendiente"}
                      </span>
                      <span className={styles.paymentMethod}>{methodLabels[payment.method] ?? payment.method}</span>
                    </li>
                  )
                })}
              </ul>
              <p className={styles.paymentsFooter}>
                Cobrado {formatCurrency(summary.paid)} · Pendiente {formatCurrency(summary.pending)}
              </p>
            </>
          )}
        </section>
      </div>

      <Modal isOpen={modal === "edit"} onClose={closeModal} title="Editar Proyecto">
        <ProjectForm
          register={projectForm.register}
          handleSubmit={projectForm.handleSubmit}
          onSubmit={projectForm.onSubmit}
          errors={projectForm.errors}
          isSubmitting={projectForm.isSubmitting}
          onCancel={closeModal}
          clients={clients}
        />
      </Modal>

      <Modal isOpen={modal === "task"} onClose={closeModal} title="Nueva tarea">
        <TaskForm
          register={taskForm.register}
          handleSubmit={taskForm.handleSubmit}
          onSubmit={taskForm.onSubmit}
          errors={taskForm.errors}
          isSubmitting={taskForm.isSubmitting}
          onCancel={closeModal}
          projects={[]}
          lockedProjectId={id}
        />
      </Modal>

      <Modal isOpen={modal === "payment"} onClose={closeModal} title="Registrar pago">
        <PaymentForm
          register={paymentForm.register}
          handleSubmit={paymentForm.handleSubmit}
          onSubmit={paymentForm.onSubmit}
          errors={paymentForm.errors}
          isSubmitting={paymentForm.isSubmitting}
          onCancel={closeModal}
          projects={[]}
          lockedProjectId={id}
        />
      </Modal>

      <ConfirmDialog
        {...dialogProps}
        description={dialogProps.description ?? "Esta acción no se puede deshacer."}
      />
    </div>
  )
}

export default ProjectHubPage
