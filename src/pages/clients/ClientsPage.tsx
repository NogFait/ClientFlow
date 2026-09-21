import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useCurrentLang } from "../../i18n/useCurrentLang"
import { formatDate } from "../../i18n/locale"
import type { IClient } from "../../features/clients/types"
import { getClients, deleteClient } from "../../features/clients/services"
import { countProjectsByClient, getProjects } from "../../features/projects/services"
import { getPayments } from "../../features/payments/services"
import { rankClients, type ClientRankRow } from "../../features/clients/domain/clientRanking"
import ClientRanking from "../../features/clients/components/ClientRanking/ClientRanking"
import ProFeature from "../../features/billing/components/ProFeature/ProFeature"
import { todayDateOnly } from "../../i18n/locale"
import { ForeignKeyViolationError } from "../../services/supabaseErrors"
import { useClientForm } from "../../features/clients/hooks/useClientForm"
import ClientCard from "../../features/clients/components/ClientCard/ClientCard"
import ClientMobileCard from "../../features/clients/components/ClientCard/ClientMobileCard"
import ClientForm from "../../features/clients/components/ClientForm/ClientForm"
import ClientNotes from "../../features/clients/notes/components/ClientNotes/ClientNotes"
import { getLatestNoteByClient } from "../../features/clients/notes/services"
import type { IClientNote } from "../../features/clients/notes/types"
import Modal from "../../components/shared/Modal/Modal"
import ConfirmDialog from "../../components/shared/ConfirmDialog/ConfirmDialog"
import { useConfirm } from "../../hooks/useConfirm"
import { useMediaQuery } from "../../hooks/useMediaQuery"
import PageHeader from "../../components/shared/PageHeader/PageHeader"
import { UserCheck, Clock, UserX, Users } from "lucide-react"
import StatCard from "../../components/shared/StatCard/StatCard"
import Loader from "../../components/shared/Loader/Loader"
import EmptyState from "../../components/shared/EmptyState/EmptyState"
import { useToast } from "../../components/shared/Toast/useToast"
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
  const { t } = useTranslation("app")
  const lang = useCurrentLang()
  const navigate = useNavigate()
  const [clients, setClients] = useState<IClient[]>([])
  // Newest note per client id — the "last activity" line in each row.
  const [latestNotes, setLatestNotes] = useState<Record<string, IClientNote>>({})
  // "¿Quién te deja más plata?" (Pro) — rolled up from projects + payments.
  const [ranking, setRanking] = useState<ClientRankRow[]>([])
  const rankingYear = Number(todayDateOnly().slice(0, 4))
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePromptState | null>(null)
  const { entitlements, refresh: refreshEntitlements } = useEntitlementsContext()
  const toast = useToast()

  const refreshClients = async () => {
    const updated = await getClients()
    setClients(updated)
  }

  // Best effort: a failure here must not hide the client list.
  const refreshLatestNotes = () => {
    getLatestNoteByClient().then(setLatestNotes).catch(() => {})
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
    toast.success(t("clients.saved"))
  }, selectedClient ?? undefined, handleLimitExceeded)

  const closeModal = () => {
    setModalMode(null)
    setSelectedClient(null)
    reset()
  }

  useEffect(() => {
    getClients().then(setClients).catch(() => {}).finally(() => setLoading(false))
    getLatestNoteByClient().then(setLatestNotes).catch(() => {})
  }, [])

  // Best effort, like the notes: the ranking failing must not hide the list.
  useEffect(() => {
    Promise.all([getProjects(), getPayments()])
      .then(([projects, payments]) => setRanking(rankClients({ clients, projects, payments, year: rankingYear })))
      .catch(() => {})
  }, [clients, rankingYear])

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
        title: t("clients.cannotDeleteTitle", { name: client.name }),
        description: t("clients.cannotDeleteDescription", { count: projectCount }),
        confirmLabel: t("shared.understood"),
        cancelLabel: null,
        danger: false,
      })
      return
    }

    const confirmed = await confirm({ title: t("clients.confirmDelete", { name: client.name }) })
    if (!confirmed) return
    try {
      await deleteClient(client.id!)
      refreshClients()
      refreshEntitlements()
      toast.success(t("clients.deleted"))
    } catch (error) {
      setDeleteError(
        error instanceof ForeignKeyViolationError
          ? t("clients.deleteFkError")
          : t("clients.deleteError"),
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

  const modalTitle = modalMode === "create" ? t("clients.new")
    : modalMode === "edit" ? t("clients.edit")
    : modalMode === "view" ? t("clients.detail")
    : ""

  return (
    <div>
      <PageHeader
        title={t("clients.title")}
        description={t("clients.description")}
        actionLabel={t("clients.new")}
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
            <StatCard label={t("clients.stats.active")} value={clients.filter(c => c.status === "activo").length} icon={UserCheck} variant="success" />
            <StatCard label={t("clients.stats.pending")} value={clients.filter(c => c.status === "pendiente").length} icon={Clock} variant="warning" />
            <StatCard label={t("clients.stats.inactive")} value={clients.filter(c => c.status === "inactivo").length} icon={UserX} variant="error" />
          </div>

          {clients.length > 0 && (
            <div className={styles.rankingSection}>
              <ProFeature title={t("clients.ranking.title")} description={t("clients.ranking.description")}>
                <ClientRanking year={rankingYear} rows={ranking} />
              </ProFeature>
            </div>
          )}

          {clients.length === 0 && (
            <EmptyState
              icon={Users}
              title={t("clients.empty.title")}
              description={t("clients.empty.description")}
              actionLabel={t("clients.empty.action")}
              onAction={handleNewClientAction}
            />
          )}
          {clients.length > 0 && (
            isMobile ? (
              <div className={styles.mobileList}>
                {clients.map(c => (
                  <ClientMobileCard key={c.id} client={c} latestNote={latestNotes[c.id!]} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <div className={styles.tableWrapper}><table className={styles.clientsTable}>
          <thead>
            <tr>
              <th>{t("clients.fields.name")}</th>
              <th>{t("clients.fields.email")}</th>
              <th>{t("clients.fields.phone")}</th>
              <th>{t("clients.fields.company")}</th>
              <th>{t("clients.fields.status")}</th>
              <th>{t("clients.fields.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <ClientCard key={c.id} client={c} latestNote={latestNotes[c.id!]} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
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
              <span className={styles.label}>{t("clients.fields.name")}</span>
              <span className={styles.value}>{selectedClient.name}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t("clients.fields.email")}</span>
              <span className={styles.value}>{selectedClient.email}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t("clients.fields.phone")}</span>
              <span className={styles.value}>{selectedClient.celular}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t("clients.fields.company")}</span>
              <span className={styles.value}>{selectedClient.company}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t("clients.fields.status")}</span>
              <span className={`${styles.badge} ${styles[`badge${selectedClient.status.charAt(0).toUpperCase() + selectedClient.status.slice(1)}`]}`}>
                {t(`status.client.${selectedClient.status}`)}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t("clients.fields.created")}</span>
              <span className={styles.value}>{formatDate(selectedClient.created_at!, lang)}</span>
            </div>
            <ClientNotes key={selectedClient.id} clientId={selectedClient.id!} onChange={refreshLatestNotes} />
            <button className={styles.closeBtn} onClick={closeModal}>{t("shared.close")}</button>
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
        description={dialogProps.description ?? t("shared.irreversible")}
      />
    </div>
  )
}

export default ClientsPage
