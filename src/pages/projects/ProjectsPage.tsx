import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { IProject } from "../../features/projects/types"
import type { IClient } from "../../features/clients/types"
import type { IPayment } from "../../features/payments/types"
import { getProjects, deleteProject, countPaymentsByProject } from "../../features/projects/services"
import { getClients } from "../../features/clients/services"
import { getPayments } from "../../features/payments/services"
import { useProjectForm } from "../../features/projects/hooks/useProjectForm"
import ProjectCard from "../../features/projects/components/ProjectCard/ProjectCard"
import ProjectForm from "../../features/projects/components/ProjectForm/ProjectForm"
import Modal from "../../components/shared/Modal/Modal"
import ConfirmDialog from "../../components/shared/ConfirmDialog/ConfirmDialog"
import { useConfirm } from "../../hooks/useConfirm"
import PageHeader from "../../components/shared/PageHeader/PageHeader"
import { Briefcase, PauseCircle, CheckCircle, DollarSign } from "lucide-react"
import StatCard from "../../components/shared/StatCard/StatCard"
import Loader from "../../components/shared/Loader/Loader"
import EmptyState from "../../components/shared/EmptyState/EmptyState"
import { useToast } from "../../components/shared/Toast/useToast"
import { useEntitlementsContext } from "../../features/billing/context/entitlementsContext"
import { canCreate } from "../../features/billing/domain/entitlements"
import type { LimitExceededError } from "../../features/billing/domain/errors"
import UpgradePrompt from "../../features/billing/components/UpgradePrompt/UpgradePrompt"
import { formatCurrency } from "../../utils/currency"
import styles from "./ProjectsPage.module.css"

type ModalMode = "create" | "edit" | null

interface UpgradePromptState {
  limit: number
  current: number
}

const ProjectsPage = () => {
  const { t } = useTranslation("app")
  const navigate = useNavigate()
  const [projects, setProjects] = useState<(IProject & { clientes?: { name: string } | null })[]>([])
  const [clients, setClients] = useState<IClient[]>([])
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null)
  const [payments, setPayments] = useState<IPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePromptState | null>(null)
  const { entitlements, refresh: refreshEntitlements } = useEntitlementsContext()
  const toast = useToast()

  const refreshProjects = async () => {
    const updated = await getProjects()
    setProjects(updated)
  }

  const handleLimitExceeded = (error: LimitExceededError) => {
    setModalMode(null)
    setSelectedProject(null)
    setUpgradePrompt({ limit: error.limit, current: error.current })
  }

  const { register, handleSubmit, onSubmit, reset, errors, isSubmitting } = useProjectForm(() => {
    setModalMode(null)
    setSelectedProject(null)
    refreshProjects()
    refreshEntitlements()
    toast.success(t("projects.saved"))
  }, selectedProject ?? undefined, handleLimitExceeded)

  const closeModal = () => {
    setModalMode(null)
    setSelectedProject(null)
    reset()
  }

  useEffect(() => {
    Promise.all([
      getProjects().then(setProjects).catch(() => {}),
      getClients().then(setClients).catch(() => {}),
      getPayments().then(setPayments).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleEdit = (project: IProject & { clientes?: { name: string } | null }) => {
    setSelectedProject(project)
    setModalMode("edit")
  }

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { confirm, dialogProps } = useConfirm()

  const handleDelete = async (project: IProject) => {
    // Block & explain (mirrors ClientsPage's handleDelete for clientes with
    // proyectos) — pagos.project_id has no ON DELETE action, so a project
    // with pagos would otherwise hit Postgres' 23503 and surface a
    // confusing failure. Check first and, if blocked, show an
    // acknowledge-only dialog instead of the delete confirm.
    const paymentsCount = await countPaymentsByProject(project.id!)
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
      await deleteProject(project.id!)
      refreshProjects()
      refreshEntitlements()
      toast.success(t("projects.deleted"))
    } catch {
      setDeleteError(t("projects.deleteError"))
    }
  }

  const handleNewProjectAction = () => {
    // Soft pre-check (design §5 / spec plan-catalog-entitlements) — mirrors
    // ClientsPage. Postgres' check_plan_limit() trigger stays authoritative.
    if (!canCreate(entitlements, "proyectos")) {
      setUpgradePrompt({
        limit: entitlements?.limits.proyectos ?? 0,
        current: entitlements?.usage.proyectos ?? 0,
      })
      return
    }
    setSelectedProject(null)
    setModalMode("create")
  }

  const modalTitle = modalMode === "create" ? t("projects.new")
    : modalMode === "edit" ? t("projects.edit")
    : ""

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const monthlyIncome = payments
    .filter(p => {
      if (p.status !== "pagado") return false
      const d = new Date(p.payment_date!)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div>
      <PageHeader
        title={t("projects.title")}
        description={t("projects.description")}
        actionLabel={t("projects.new")}
        onAction={handleNewProjectAction}
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
        <>
          <div className={styles.kpiGrid}>
            <StatCard label={t("projects.stats.active")} value={projects.filter(p => p.status === "activo").length} icon={Briefcase} variant="success" />
            <StatCard label={t("projects.stats.paused")} value={projects.filter(p => p.status === "pausado").length} icon={PauseCircle} variant="warning" />
            <StatCard label={t("projects.stats.completed")} value={projects.filter(p => p.status === "completo").length} icon={CheckCircle} variant="success" />
            <StatCard label={t("projects.stats.monthlyIncome")} value={formatCurrency(monthlyIncome)} icon={DollarSign} variant="primary" />
          </div>

          {projects.length === 0 && (
            <EmptyState
              icon={Briefcase}
              title={t("projects.empty.title")}
              description={t("projects.empty.description")}
              actionLabel={t("projects.empty.action")}
              onAction={handleNewProjectAction}
            />
          )}
          <div className={styles.projectsGrid}>
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
          </div>
        </>
      )}

      <Modal isOpen={modalMode !== null} onClose={closeModal} title={modalTitle}>
        {(modalMode === "create" || modalMode === "edit") && (
          <ProjectForm
            register={register}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            errors={errors}
            isSubmitting={isSubmitting}
            onCancel={closeModal}
            clients={clients}
          />
        )}
      </Modal>

      {upgradePrompt && (
        <UpgradePrompt
          isOpen
          resource="proyectos"
          limit={upgradePrompt.limit}
          current={upgradePrompt.current}
          onClose={() => setUpgradePrompt(null)}
          onUpgrade={() => navigate("/settings/billing")}
        />
      )}

      <ConfirmDialog
        {...dialogProps}
        description={dialogProps.description ?? t("shared.irreversible")}
      />
    </div>
  )
}

export default ProjectsPage
