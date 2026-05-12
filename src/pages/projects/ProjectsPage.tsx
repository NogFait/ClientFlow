import { useState, useEffect } from "react"
import type { IProject } from "../../features/projects/types"
import type { IClient } from "../../features/clients/types"
import type { IPayment } from "../../features/payments/types"
import { getProjects, deleteProject } from "../../features/projects/services"
import { getClients } from "../../features/clients/services"
import { getPayments } from "../../features/payments/services"
import { useProjectForm } from "../../features/projects/hooks/useProjectForm"
import ProjectCard from "../../features/projects/components/ProjectCard/ProjectCard"
import ProjectForm from "../../features/projects/components/ProjectForm/ProjectForm"
import Modal from "../../components/shared/Modal/Modal"
import PageHeader from "../../components/shared/PageHeader/PageHeader"
import { Briefcase, PauseCircle, CheckCircle, DollarSign } from "lucide-react"
import StatCard from "../../components/shared/StatCard/StatCard"
import Loader from "../../components/shared/Loader/Loader"
import styles from "./ProjectsPage.module.css"

type ModalMode = "create" | "edit" | "view" | null

const ProjectsPage = () => {
  const [projects, setProjects] = useState<(IProject & { clientes?: { name: string } | null })[]>([])
  const [clients, setClients] = useState<IClient[]>([])
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null)
  const [payments, setPayments] = useState<IPayment[]>([])
  const [loading, setLoading] = useState(true)

  const refreshProjects = async () => {
    const updated = await getProjects()
    setProjects(updated)
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedProject(null)
    reset()
  }

  const { register, handleSubmit, onSubmit, reset, errors, isSubmitting } = useProjectForm(() => {
    closeModal()
    refreshProjects()
  }, selectedProject ?? undefined)

  useEffect(() => {
    Promise.all([
      refreshProjects(),
      getClients().then(setClients).catch(() => {}),
      getPayments().then(setPayments).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleView = (project: IProject & { clientes?: { name: string } | null }) => {
    setSelectedProject(project)
    setModalMode("view")
  }

  const handleEdit = (project: IProject & { clientes?: { name: string } | null }) => {
    setSelectedProject(project)
    setModalMode("edit")
  }

  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (project: IProject) => {
    if (window.confirm(`¿Eliminar el proyecto "${project.name}"?`)) {
      try {
        await deleteProject(project.id!)
        refreshProjects()
      } catch {
        setDeleteError("No se pudo eliminar el proyecto. Intentalo de nuevo.")
      }
    }
  }

  const modalTitle = modalMode === "create" ? "Nuevo Proyecto"
    : modalMode === "edit" ? "Editar Proyecto"
    : modalMode === "view" ? "Detalle del Proyecto"
    : ""

  const selectedWithClient = selectedProject
    ? projects.find(p => p.id === selectedProject.id)
    : null

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
        title="Proyectos"
        description="Gestiona tu trabajo activo y tus relaciones con los clientes."
        actionLabel="Nuevo Proyecto"
        onAction={() => { setSelectedProject(null); setModalMode("create") }}
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
            <StatCard label="Activos" value={projects.filter(p => p.status === "activo").length} icon={Briefcase} variant="success" />
            <StatCard label="Pausados" value={projects.filter(p => p.status === "pausado").length} icon={PauseCircle} variant="warning" />
            <StatCard label="Completados" value={projects.filter(p => p.status === "completo").length} icon={CheckCircle} variant="success" />
            <StatCard label="Ingreso Mensual" value={`$${monthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} variant="primary" />
          </div>

          <div className={styles.projectsGrid}>
          {projects.length === 0 && <p className={styles.emptyState}>No hay proyectos registrados.</p>}
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
          </div>
        </>
      )}

      <Modal isOpen={modalMode !== null} onClose={closeModal} title={modalTitle}>
        {modalMode === "view" && selectedWithClient && (
          <div className={styles.viewMode}>
            <div className={styles.field}>
              <span className={styles.label}>Nombre</span>
              <span className={styles.value}>{selectedWithClient.name}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Cliente</span>
              <span className={styles.value}>{selectedWithClient.clientes?.name ?? "Sin cliente"}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Estado</span>
              <span className={`${styles.badge} ${styles[`badge${selectedWithClient.status.charAt(0).toUpperCase() + selectedWithClient.status.slice(1)}`]}`}>
                {selectedWithClient.status === "activo" ? "Activo" : selectedWithClient.status === "pausado" ? "Pausado" : "Completado"}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Presupuesto</span>
              <span className={styles.valueAmount}>
                {selectedWithClient.budget != null ? `$${selectedWithClient.budget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Inicio</span>
              <span className={styles.value}>{selectedWithClient.start_date ?? "—"}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Fin</span>
              <span className={styles.value}>{selectedWithClient.end_date ?? "—"}</span>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Descripción</span>
              <span className={`${styles.value} ${styles.valueMuted}`}>{selectedWithClient.description ?? "—"}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Creado</span>
              <span className={styles.value}>{new Date(selectedWithClient.created_at!).toLocaleDateString()}</span>
            </div>
            <button className={styles.closeBtn} onClick={closeModal}>Cerrar</button>
          </div>
        )}

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
    </div>
  )
}

export default ProjectsPage
