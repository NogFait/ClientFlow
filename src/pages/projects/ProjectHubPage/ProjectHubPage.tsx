import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useCurrentLang } from "../../../i18n/useCurrentLang"
import { formatDateOnly } from "../../../i18n/locale"
import { ChevronRight, DollarSign, Clock, CheckSquare, ClipboardList, Receipt, FolderX } from "lucide-react"
import { useProjectHub } from "../../../features/projects/hooks/useProjectHub"
import { useProjectForm } from "../../../features/projects/hooks/useProjectForm"
import { useTaskForm } from "../../../features/tasks/hooks/useTaskForm"
import { usePaymentForm } from "../../../features/payments/hooks/usePaymentForm"
import { deleteProject, countPaymentsByProject } from "../../../features/projects/services"
import { getClients } from "../../../features/clients/services"
import type { IClient } from "../../../features/clients/types"
import type { ProjectStatus } from "../../../features/projects/types"
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

// DB values, in the order the status <select> lists them; labels come from
// status.project.* in app.json.
const PROJECT_STATUSES: ProjectStatus[] = ["activo", "pausado", "completo"]

const ProjectHubPage = () => {
  const { t } = useTranslation("app")
  const lang = useCurrentLang()
  // start_date/end_date/due_date/payment_date are all DB `date` columns.
  const formatDate = (value?: string) => (value ? formatDateOnly(value, lang) : "—")
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
    toast.success(t("projects.saved"))
  }, project ?? undefined)

  const taskForm = useTaskForm(() => {
    setModal(null)
    refresh()
    toast.success(t("projectHub.taskSaved"))
  }, undefined, id)

  const paymentForm = usePaymentForm(() => {
    setModal(null)
    refresh()
    toast.success(t("projectHub.paymentSaved"))
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
        title: t("projects.cannotDeleteTitle", { name: project.name }),
        description: t("projects.cannotDeleteDescription", { count: paymentsCount }),
        confirmLabel: t("shared.understood"),
        cancelLabel: null,
        danger: false,
      })
      return
    }

    const confirmed = await confirm({ title: t("projects.confirmDelete", { name: project.name }) })
    if (!confirmed) return
    try {
      await deleteProject(project.id)
      toast.success(t("projects.deleted"))
      navigate("/projects")
    } catch (err) {
      toast.error(
        err instanceof ForeignKeyViolationError
          ? t("projects.deleteFkError")
          : t("projects.deleteError"),
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
          title={t("projectHub.notFound.title")}
          description={t("projectHub.notFound.description")}
        />
        <Link className={styles.backLink} to="/projects">{t("projectHub.notFound.back")}</Link>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className={styles.errorState}>
        <p>{t("projectHub.loadError")}</p>
        <button type="button" className={styles.retryBtn} onClick={refresh}>{t("shared.retry")}</button>
      </div>
    )
  }

  return (
    <div>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link to="/projects">{t("projectHub.breadcrumb")}</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <span>{project.name}</span>
      </nav>

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{project.name}</h1>
          <p className={styles.clientName}>{project.clientes?.name ?? t("projects.noClient")}</p>
          <p className={styles.dates}>{formatDate(project.start_date)} → {formatDate(project.end_date)}</p>
        </div>
        <div className={styles.headerActions}>
          <label htmlFor="hub-status" className={styles.statusLabel}>{t("projectHub.statusLabel")}</label>
          <select
            id="hub-status"
            aria-label={t("projectHub.statusLabel")}
            className={styles.statusSelect}
            value={project.status}
            onChange={handleStatusChange}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{t(`status.project.${s}`)}</option>
            ))}
          </select>
          <button type="button" className={styles.editBtn} onClick={() => setModal("edit")}>{t("shared.edit")}</button>
          <button type="button" className={styles.deleteBtn} onClick={handleDelete}>{t("shared.delete")}</button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          label={t("projectHub.budget")}
          value={summary.budget != null ? formatCurrency(summary.budget) : t("projectHub.noBudget")}
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          label={t("projectHub.collected")}
          value={formatCurrency(summary.paid)}
          secondaryValue={summary.paidPct != null ? `${summary.paidPct} %` : undefined}
          icon={CheckSquare}
          variant="success"
          progressPct={summary.paidPct ?? undefined}
        />
        <StatCard
          label={t("projectHub.pendingCollection")}
          value={formatCurrency(summary.pending)}
          secondaryValue={t("projectHub.paymentsCount", { count: summary.pendingCount })}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          label={t("projectHub.tasks")}
          value={t("projectHub.tasksDone", { done: summary.tasksDone, total: summary.tasksTotal })}
          icon={ClipboardList}
          variant="default"
          progressPct={summary.tasksPct ?? undefined}
        />
      </div>

      <div className={styles.sections}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t("projectHub.tasks")}</h2>
            <button type="button" className={styles.sectionAction} onClick={() => setModal("task")}>{t("projectHub.newTask")}</button>
          </div>
          {tasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={t("projectHub.noTasks.title")}
              description={t("projectHub.noTasks.description")}
              actionLabel={t("projectHub.newTask")}
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
                        aria-label={isDone ? t("projectHub.markPending") : t("projectHub.markDone")}
                      />
                    </label>
                    <span className={`${styles.taskTitle} ${isDone ? styles.taskTitleDone : ""}`}>{task.title}</span>
                    <span className={styles.priorityBadge}>{t(`status.priority.${task.priority}`)}</span>
                    <span className={styles.dueDate}>{formatDate(task.due_date)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t("projectHub.payments")}</h2>
            <button type="button" className={styles.sectionAction} onClick={() => setModal("payment")}>{t("projectHub.registerPayment")}</button>
          </div>
          {payments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t("projectHub.noPayments.title")}
              description={t("projectHub.noPayments.description")}
              actionLabel={t("projectHub.registerPayment")}
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
                        {t(`status.payment.${payment.status}`)}
                      </span>
                      <span className={styles.paymentMethod}>{t(`status.method.${payment.method}`)}</span>
                    </li>
                  )
                })}
              </ul>
              <p className={styles.paymentsFooter}>
                {t("projectHub.paymentsFooter", { paid: formatCurrency(summary.paid), pending: formatCurrency(summary.pending) })}
              </p>
            </>
          )}
        </section>
      </div>

      <Modal isOpen={modal === "edit"} onClose={closeModal} title={t("projects.edit")}>
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

      <Modal isOpen={modal === "task"} onClose={closeModal} title={t("projectHub.newTaskTitle")}>
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

      <Modal isOpen={modal === "payment"} onClose={closeModal} title={t("projectHub.registerPaymentTitle")}>
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
        description={dialogProps.description ?? t("shared.irreversible")}
      />
    </div>
  )
}

export default ProjectHubPage
