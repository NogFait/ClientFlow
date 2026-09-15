import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import type { IClient } from "../../features/clients/types"
import { getClients, deleteClient } from "../../features/clients/services"
import { countProjectsByClient } from "../../features/projects/services"
import { ForeignKeyViolationError } from "../../services/supabaseErrors"
import { useClientForm } from "../../features/clients/hooks/useClientForm"
import ClientCard from "../../features/clients/components/ClientCard/ClientCard"
import ClientMobileCard from "../../features/clients/components/ClientCard/ClientMobileCard"
import ClientForm from "../../features/clients/components/ClientForm/ClientForm"
import Modal from "../../components/shared/Modal/Modal"
import ConfirmDialog from "../../components/shared/ConfirmDialog/ConfirmDialog"
import { useConfirm } from "../../hooks/useConfirm"
import { useMediaQuery } from "../../hooks/useMediaQuery"
import PageHeader from "../../components/shared/PageHeader/PageHeader"
import { UserCheck, Clock, UserX } from "lucide-react"
import StatCard from "../../components/shared/StatCard/StatCard"
import Loader from "../../components/shared/Loader/Loader"
import { useEntitlementsContext } from "../../features/billing/context/entitlementsContext"
import { canCreate } from "../../features/billing/domain/entitlements"
import type { LimitExceededError } from "../../features/billing/domain/errors"
import UpgradePrompt from "../../features/billing/components/UpgradePrompt/UpgradePrompt"
import styles from "./ClientsPage.module.css"

type ModalMode = "create" | "edit" | "view" | null

interface UpgradePromptState {
  limit: number
  current: number
}

const ClientsPage = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState<IClient[]>([])
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePromptState | null>(null)
  const { entitlements, refresh: refreshEntitlements } = useEntitlementsContext()

  const refreshClients = async () => {
    const updated = await getClients()
    setClients(updated)
  }

  const handleLimitExceeded = (error: LimitExceededError) => {
    setModalMode(null)
    setSelectedClient(null)
    setUpgradePrompt({ limit: error.limit, current: error.current })
  }

  const { register, handleSubmit, onSubmit, reset, errors, isSubmitting } = useClientForm(() => {
    setModalMode(null)
    setSelectedClient(null)
    refreshClients()
    refreshEntitlements()
  }, selectedClient ?? undefined, handleLimitExceeded)

  const closeModal = () => {
    setModalMode(null)
    setSelectedClient(null)
    reset()
  }

  useEffect(() => {
    getClients().then(setClients).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleView = (client: IClient) => {
    setSelectedClient(client)
    setModalMode("view")
  }

  const handleEdit = (client: IClient) => {
    setSelectedClient(client)
    setModalMode("edit")
  }

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { confirm, dialogProps } = useConfirm()
  const isMobile = useMediaQuery("(max-width: 767px)")

  const handleDelete = async (client: IClient) => {
    // Block & explain (decision: no cascade, no schema change) — proyectos.client_id
    // has no ON DELETE action, so a client with proyectos would otherwise hit
    // Postgres' 23503 and surface a confusing failure. Check first and, if
    // blocked, show an acknowledge-only dialog instead of the delete confirm.
    const projectCount = await countProjectsByClient(client.id!)
    if (projectCount > 0) {
      await confirm({
        title: `No se puede eliminar a ${client.name}`,
        description: `Tiene ${projectCount} proyecto(s) asociado(s). Eliminá o reasigná esos proyectos primero.`,
        confirmLabel: "Entendido",
        cancelLabel: null,
        danger: false,
      })
      return
    }

    const confirmed = await confirm({ title: `¿Eliminar a ${client.name}?` })
    if (!confirmed) return
    try {
      await deleteClient(client.id!)
      refreshClients()
      refreshEntitlements()
    } catch (error) {
      setDeleteError(
        error instanceof ForeignKeyViolationError
          ? "No se puede eliminar: el cliente tiene proyectos asociados."
          : "No se pudo eliminar el cliente. Intentalo de nuevo.",
      )
    }
  }

  const handleNewClientAction = () => {
    // Soft pre-check (design §5 / spec plan-catalog-entitlements): avoid
    // opening the form at all when the Free limit is already reached —
    // Postgres' check_plan_limit() trigger remains the authoritative gate.
    if (!canCreate(entitlements, "clientes")) {
      setUpgradePrompt({
        limit: entitlements?.limits.clientes ?? 0,
        current: entitlements?.usage.clientes ?? 0,
      })
      return
    }
    setSelectedClient(null)
    setModalMode("create")
  }

  const modalTitle = modalMode === "create" ? "Nuevo Cliente"
    : modalMode === "edit" ? "Editar Cliente"
    : modalMode === "view" ? "Detalle del Cliente"
    : ""

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gestione las relaciones con sus clientes, realice un seguimiento de su estado y supervise sus niveles de inversión desde una única vista unificada."
        actionLabel="Nuevo Cliente"
        onAction={handleNewClientAction}
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
            <StatCard label="Total Activos" value={clients.filter(c => c.status === "activo").length} icon={UserCheck} variant="success" />
            <StatCard label="Pendientes" value={clients.filter(c => c.status === "pendiente").length} icon={Clock} variant="warning" />
            <StatCard label="Inactivos" value={clients.filter(c => c.status === "inactivo").length} icon={UserX} variant="error" />
          </div>

          {clients.length === 0 && <p className={styles.emptyState}>No hay clientes registrados.</p>}
          {clients.length > 0 && (
            isMobile ? (
              <div className={styles.mobileList}>
                {clients.map(c => (
                  <ClientMobileCard key={c.id} client={c} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <div className={styles.tableWrapper}><table className={styles.clientsTable}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Celular</th>
              <th>Empresa</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <ClientCard key={c.id} client={c} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </tbody>
                      </table></div>
            )
          )}
        </>
      )}

      <Modal isOpen={modalMode !== null} onClose={closeModal} title={modalTitle}>
        {modalMode === "view" && selectedClient && (
          <div className={styles.viewMode}>
            <div className={styles.field}>
              <span className={styles.label}>Nombre</span>
              <span className={styles.value}>{selectedClient.name}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{selectedClient.email}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Celular</span>
              <span className={styles.value}>{selectedClient.celular}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Empresa</span>
              <span className={styles.value}>{selectedClient.company}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Estado</span>
              <span className={`${styles.badge} ${styles[`badge${selectedClient.status.charAt(0).toUpperCase() + selectedClient.status.slice(1)}`]}`}>
                {selectedClient.status === "activo" ? "Activo" : selectedClient.status === "pendiente" ? "Pendiente" : "Inactivo"}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Creado</span>
              <span className={styles.value}>{new Date(selectedClient.created_at!).toLocaleDateString()}</span>
            </div>
            <button className={styles.closeBtn} onClick={closeModal}>Cerrar</button>
          </div>
        )}

        {(modalMode === "create" || modalMode === "edit") && (
          <ClientForm
            register={register}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            errors={errors}
            isSubmitting={isSubmitting}
            onCancel={closeModal}
          />
        )}
      </Modal>

      {upgradePrompt && (
        <UpgradePrompt
          isOpen
          resource="clientes"
          limit={upgradePrompt.limit}
          current={upgradePrompt.current}
          onClose={() => setUpgradePrompt(null)}
          onUpgrade={() => navigate("/settings/billing")}
        />
      )}

      <ConfirmDialog
        {...dialogProps}
        description={dialogProps.description ?? "Esta acción no se puede deshacer."}
      />
    </div>
  )
}

export default ClientsPage
