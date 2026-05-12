import { useState, useEffect } from "react"
import type { IPayment } from "../../features/payments/types"
import type { IProject } from "../../features/projects/types"
import { getPayments, deletePayment } from "../../features/payments/services"
import { getProjects } from "../../features/projects/services"
import { usePaymentForm } from "../../features/payments/hooks/usePaymentForm"
import PaymentTableRow from "../../features/payments/components/PaymentTableRow/PaymentTableRow"
import PaymentForm from "../../features/payments/components/PaymentForm/PaymentForm"
import PaymentView from "../../features/payments/components/PaymentView/PaymentView"
import Modal from "../../components/shared/Modal/Modal"
import PageHeader from "../../components/shared/PageHeader/PageHeader"
import { DollarSign, Clock, Calendar } from "lucide-react"
import StatCard from "../../components/shared/StatCard/StatCard"
import Loader from "../../components/shared/Loader/Loader"
import styles from "./PaymentsPage.module.css"

const PaymentsPage = () => {
  const [payments, setPayments] = useState<(IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null })[]>([])
  const [projects, setProjects] = useState<IProject[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<IPayment | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingPayment, setViewingPayment] = useState<IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null } | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshPayments = async () => {
    const updated = await getPayments()
    setPayments(updated)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingPayment(null)
    reset()
  }

  const { register, handleSubmit, onSubmit, reset, errors, isSubmitting } = usePaymentForm(() => {
    closeModal()
    refreshPayments()
  }, editingPayment ?? undefined)

  useEffect(() => {
    Promise.all([
      refreshPayments(),
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

  const handleDelete = async (payment: IPayment) => {
    if (window.confirm(`¿Eliminar pago de $${Number(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}?`)) {
      try {
        await deletePayment(payment.id!)
        refreshPayments()
      } catch {
        setDeleteError("No se pudo eliminar el pago. Intentalo de nuevo.")
      }
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
    ? `${new Date(proximoPago.payment_date!).toLocaleDateString()} — $${Number(proximoPago.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
        actionLabel="Nueva Factura"
        onAction={() => { setEditingPayment(null); setModalOpen(true) }}
      />

      {deleteError && (
        <div className={styles.errorBanner}>
          <span>{deleteError}</span>
          <button className={styles.errorClose} onClick={() => setDeleteError(null)}>&times;</button>
        </div>
      )}

      <div className={styles.kpiGrid}>
        <StatCard label="Total Ganados" value={`$${totalGanado.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} variant="success" />
        <StatCard label="Total Pendiente" value={`$${totalPendiente.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Clock} variant="warning" />
        <StatCard label="Próximo pago proyectado" value={proximoPagoValue} icon={Calendar} variant="primary" />
      </div>

      {currentMonthPayments.length === 0 && <p className={styles.emptyState}>No hay pagos registrados este mes.</p>}
      {currentMonthPayments.length > 0 && (
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
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingPayment ? "Editar Factura" : "Nueva Factura"}>
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
    </div>
  )
}

export default PaymentsPage
