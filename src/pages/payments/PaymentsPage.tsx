import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import type { IPayment } from "../../features/payments/types"
import type { IProject } from "../../features/projects/types"
import { getPaymentsInRange, getPaymentTotals, deletePayment } from "../../features/payments/services"
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
import MonthSelector from "../../components/shared/MonthSelector/MonthSelector"
import { DollarSign, Clock, Calendar, TrendingUp } from "lucide-react"
import StatCard from "../../components/shared/StatCard/StatCard"
import Loader from "../../components/shared/Loader/Loader"
import EmptyState from "../../components/shared/EmptyState/EmptyState"
import { useToast } from "../../components/shared/Toast/useToast"
import { formatCurrency } from "../../utils/currency"
import { currentMonthKey, formatMonthEsAr, monthRange, parseMonthKey, yearRange, type MonthKey } from "../../utils/month"
import styles from "./PaymentsPage.module.css"

type PaymentWithRelations = IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }

const PaymentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const monthParam = searchParams.get("month")
  const month: MonthKey = (monthParam && parseMonthKey(monthParam)) || currentMonthKey()

  const [projects, setProjects] = useState<IProject[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<IPayment | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingPayment, setViewingPayment] = useState<PaymentWithRelations | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  // Loading/error are DERIVED from which request the data belongs to, so the
  // effect never needs a synchronous setState (react-hooks/set-state-in-effect)
  // and a stale response for a previous month can never overwrite the current one.
  const requestKey = `${month}:${refreshTick}`
  const [loaded, setLoaded] = useState<{
    key: string
    payments: PaymentWithRelations[]
    yearTotals: { paid: number; pending: number }
  } | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const paymentsError = errorKey === requestKey
  const paymentsLoading = !paymentsError && loaded?.key !== requestKey
  const payments = loaded?.key === requestKey ? loaded.payments : []
  const yearTotals = loaded?.key === requestKey ? loaded.yearTotals : { paid: 0, pending: 0 }
  const toast = useToast()

  const handleFormSuccess = (saved: IPayment) => {
    const wasEdit = editingPayment !== null
    setModalOpen(false)
    setEditingPayment(null)

    if (!wasEdit) {
      const effectiveDate = saved.payment_date || new Date().toISOString().split("T")[0]
      const savedMonth = effectiveDate.slice(0, 7) as MonthKey
      if (savedMonth !== month) {
        setSearchParams({ month: savedMonth })
        toast.success(`Pago registrado en ${formatMonthEsAr(savedMonth)}`)
        return
      }
    }

    setRefreshTick(t => t + 1)
    toast.success(wasEdit ? "Pago actualizado" : "Pago registrado")
  }

  const { register, handleSubmit, onSubmit, reset, errors, isSubmitting } = usePaymentForm(
    handleFormSuccess,
    editingPayment ?? undefined,
  )

  const closeModal = () => {
    setModalOpen(false)
    setEditingPayment(null)
    reset()
  }

  useEffect(() => {
    getProjects().then(setProjects).catch(() => {})
  }, [])

  useEffect(() => {
    const key = `${month}:${refreshTick}`
    Promise.all([getPaymentsInRange(monthRange(month)), getPaymentTotals(yearRange(month))])
      .then(([paymentsData, totals]) => setLoaded({ key, payments: paymentsData, yearTotals: totals }))
      .catch(() => setErrorKey(key))
  }, [month, refreshTick])

  const handleMonthChange = (next: MonthKey) => {
    setSearchParams({ month: next }, { replace: false })
  }

  const handleView = (payment: PaymentWithRelations) => {
    setViewingPayment(payment)
    setViewModalOpen(true)
  }

  const handleEdit = (payment: PaymentWithRelations) => {
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
      setRefreshTick(t => t + 1)
      toast.success("Pago eliminado")
    } catch {
      setDeleteError("No se pudo eliminar el pago. Intentalo de nuevo.")
    }
  }

  const proximoPago = payments
    .filter(p => p.status === "pendiente" && p.payment_date)
    .sort((a, b) => new Date(a.payment_date!).getTime() - new Date(b.payment_date!).getTime())[0]

  const proximoPagoValue = proximoPago
    ? `${new Date(proximoPago.payment_date!).toLocaleDateString()} — ${formatCurrency(Number(proximoPago.amount))}`
    : "—"

  const totalGanado = payments
    .filter(p => p.status === "pagado")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const totalPendiente = payments
    .filter(p => p.status === "pendiente")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const yearLabel = month.slice(0, 4)

  return (
    <div>
      <PageHeader
        title="Pagos e Ingresos"
        description="Administra tus finanzas y realiza un seguimiento de los ingresos de tus proyectos"
        actionLabel="Registrar pago"
        onAction={() => { setEditingPayment(null); setModalOpen(true) }}
      >
        <MonthSelector value={month} onChange={handleMonthChange} max={currentMonthKey()} />
      </PageHeader>

      {deleteError && (
        <div className={styles.errorBanner}>
          <span>{deleteError}</span>
          <button className={styles.errorClose} onClick={() => setDeleteError(null)}>&times;</button>
        </div>
      )}

      {paymentsError && (
        <div className={styles.errorBanner}>
          <span>No se pudieron cargar los pagos de este mes. Intentalo de nuevo.</span>
        </div>
      )}

      {paymentsLoading ? (
        <div className={styles.loaderSection}><Loader /></div>
      ) : (
        <>
          <div className={styles.kpiGrid}>
            <StatCard label="Total Ganados" value={formatCurrency(totalGanado)} icon={DollarSign} variant="success" />
            <StatCard label="Total Pendiente" value={formatCurrency(totalPendiente)} icon={Clock} variant="warning" />
            <StatCard label="Próximo pago proyectado" value={proximoPagoValue} icon={Calendar} variant="primary" />
            <StatCard
              label={`Acumulado ${yearLabel}`}
              value={formatCurrency(yearTotals.paid)}
              secondaryValue={formatCurrency(yearTotals.pending)}
              secondaryLabel="pendiente"
              icon={TrendingUp}
              variant="primary"
            />
          </div>

          {payments.length === 0 && (
            <EmptyState
              icon={DollarSign}
              title={`No registraste pagos en ${formatMonthEsAr(month)}`}
              description="Anotá cada cobro para ver tus ingresos y lo que falta cobrar."
              actionLabel="Registrar pago"
              onAction={() => { setEditingPayment(null); setModalOpen(true) }}
            />
          )}
          {payments.length > 0 && (
            isMobile ? (
              <div className={styles.mobileList}>
                {payments.map(p => (
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
                {payments.map(p => (
                  <PaymentTableRow key={p.id} payment={p} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </tbody>
            </table></div>
            )
          )}
        </>
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
