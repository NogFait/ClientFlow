import { useState, useEffect } from "react"
import type { IPayment } from "../../features/payments/types"
import type { IProject } from "../../features/projects/types"
import { getPayments, deletePayment } from "../../features/payments/services"
import { getProjects } from "../../features/projects/services"
import { usePaymentForm } from "../../features/payments/hooks/usePaymentForm"
import PaymentTableRow from "../../features/payments/components/PaymentTableRow/PaymentTableRow"
import PaymentMobileCard from "../../features/payments/components/PaymentTableRow/PaymentMobileCard"
import PaymentForm from "../../features/payments/components/PaymentForm/PaymentForm"
import PaymentView from "../../features/payments/components/PaymentView/PaymentView"
import Modal from "../../components/shared/Modal/Modal"
import ConfirmDialog from "../../components/shared/ConfirmDialog/ConfirmDialog"
import { useConfirm } from "../../hooks/useConfirm"
import { useMediaQuery } from "../../hooks/useMediaQuery"
import PageHeader from "../../components/shared/PageHeader/PageHeader"
import { DollarSign, Clock, Calendar } from "lucide-react"
import StatCard from "../../components/shared/StatCard/StatCard"
import Loader from "../../components/shared/Loader/Loader"
import EmptyState from "../../components/shared/EmptyState/EmptyState"
import { useToast } from "../../components/shared/Toast/useToast"
import { formatCurrency } from "../../utils/currency"
import styles from "./PaymentsPage.module.css"

const PaymentsPage = () => {
  const [payments, setPayments] = useState<(IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null })[]>([])
  const [projects, setProjects] = useState<IProject[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<IPayment | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingPayment, setViewingPayment] = useState<IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const refreshPayments = async () => {
    const updated = await getPayments()
    setPayments(updated)
  }

  const { register, handleSubmit, onSubmit, reset, errors, isSubmitting } = usePaymentForm(() => {
    const wasEdit = editingPayment !== null
    setModalOpen(false)
    setEditingPayment(null)
    refreshPayments()
    toast.success(wasEdit ? "Pago actualizado" : "Pago registrado")
  }, editingPayment ?? undefined)

  const closeModal = () => {
    setModalOpen(false)
    setEditingPayment(null)
    reset()
  }

  useEffect(() => {
    Promise.all([
      getPayments().then(setPayments).catch(() => {}),
      getProjects().then(setProjects).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleView = (payment: IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }) => {
    setViewingPayment(payment)
    setViewModalOpen(true)
  }

  const handleEdit = (payment: IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }) => {
    setEditingPayment(payment)
    setModalOpen(true)
  }

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { confirm, dialogProps } = useConfirm()
  const isMobile = useMediaQuery("(max-width: 767px)")

  const handleDelete = async (payment: IPayment) => {
    const confirmed = await confirm({ title: `¿Eliminar pago de ${formatCurrency(Number(payment.amount))}?` })
    if (!confirmed) return
    try {
      await deletePayment(payment.id!)
      refreshPayments()
      toast.success("Pago eliminado")
    } catch {
      setDeleteError("No se pudo eliminar el pago. Intentalo de nuevo.")
    }
  }

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const currentMonthPayments = payments.filter(p => {
    if (!p.payment_date) return false
    const d = new Date(p.payment_date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const proximoPago = currentMonthPayments
    .filter(p => p.status === "pendiente" && p.payment_date)
    .sort((a, b) => new Date(a.payment_date!).getTime() - new Date(b.payment_date!).getTime())[0]

  const proximoPagoValue = proximoPago
    ? `${new Date(proximoPago.payment_date!).toLocaleDateString()} — ${formatCurrency(Number(proximoPago.amount))}`
    : "—"

  const totalGanado = currentMonthPayments
    .filter(p => p.status === "pagado")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const totalPendiente = currentMonthPayments
    .filter(p => p.status === "pendiente")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  if (loading) return <Loader />

  return (
    <div>
      <PageHeader
        title="Pagos e Ingresos"
        description="Administra tus finanzas y realiza un seguimiento de los ingresos de tus proyectos"
        actionLabel="Registrar pago"
        onAction={() => { setEditingPayment(null); setModalOpen(true) }}
      />

      {deleteError && (
        <div className={styles.errorBanner}>
          <span>{deleteError}</span>
          <button className={styles.errorClose} onClick={() => setDeleteError(null)}>&times;</button>
        </div>
      )}

      <div className={styles.kpiGrid}>
        <StatCard label="Total Ganados" value={formatCurrency(totalGanado)} icon={DollarSign} variant="success" />
        <StatCard label="Total Pendiente" value={formatCurrency(totalPendiente)} icon={Clock} variant="warning" />
        <StatCard label="Próximo pago proyectado" value={proximoPagoValue} icon={Calendar} variant="primary" />
      </div>

      {currentMonthPayments.length === 0 && (
        <EmptyState
          icon={DollarSign}
          title="No registraste pagos este mes"
          description="Anotá cada cobro para ver tus ingresos y lo que falta cobrar."
          actionLabel="Registrar pago"
          onAction={() => { setEditingPayment(null); setModalOpen(true) }}
        />
      )}
      {currentMonthPayments.length > 0 && (
        isMobile ? (
          <div className={styles.mobileList}>
            {currentMonthPayments.map(p => (
              <PaymentMobileCard key={p.id} payment={p} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className={styles.tableWrapper}><table className={styles.paymentsTable}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Proyecto</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Método</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentMonthPayments.map(p => (
              <PaymentTableRow key={p.id} payment={p} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </tbody>
        </table></div>
        )
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingPayment ? "Editar pago" : "Registrar pago"}>
        <PaymentForm
          register={register}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          errors={errors}
          isSubmitting={isSubmitting}
          onCancel={closeModal}
          projects={projects}
        />
      </Modal>

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Detalle del Pago">
        {viewingPayment && <PaymentView payment={viewingPayment} />}
      </Modal>

      <ConfirmDialog
        {...dialogProps}
        description={dialogProps.description ?? "Esta acción no se puede deshacer."}
      />
    </div>
  )
}

export default PaymentsPage
