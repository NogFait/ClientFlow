import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useCurrentLang } from "../../i18n/useCurrentLang"
import { formatDateOnly, todayDateOnly } from "../../i18n/locale"
import type { IPayment } from "../../features/payments/types"
import type { IProject } from "../../features/projects/types"
import { getPaymentsInRange, getPaymentTotals, deletePayment, type PaymentTotals } from "../../features/payments/services"
import { buildPaymentsCsv, csvFilename, type CsvLabels, type CsvPaymentRow } from "../../features/payments/domain/paymentsCsv"
import { downloadTextFile } from "../../utils/download"
import ProFeature from "../../features/billing/components/ProFeature/ProFeature"
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
import { DollarSign, Clock, Calendar, TrendingUp, Download } from "lucide-react"
import StatCard from "../../components/shared/StatCard/StatCard"
import Loader from "../../components/shared/Loader/Loader"
import EmptyState from "../../components/shared/EmptyState/EmptyState"
import { useToast } from "../../components/shared/Toast/useToast"
import { formatCurrency } from "../../utils/currency"
import { currentMonthKey, formatMonth, monthRange, parseMonthKey, shortMonth, yearRange, type MonthKey } from "../../utils/month"
import styles from "./PaymentsPage.module.css"

type PaymentWithRelations = IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null }

const PaymentsPage = () => {
  const { t } = useTranslation("app")
  const lang = useCurrentLang()
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
    yearTotals: PaymentTotals
  } | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const paymentsError = errorKey === requestKey
  const paymentsLoading = !paymentsError && loaded?.key !== requestKey
  const payments = loaded?.key === requestKey ? loaded.payments : []
  const yearTotals: PaymentTotals =
    loaded?.key === requestKey ? loaded.yearTotals : { paid: 0, pending: 0, pendingByMonth: {} }
  const pendingMonths = Object.keys(yearTotals.pendingByMonth ?? {}).sort() as MonthKey[]
  const toast = useToast()
  const [exporting, setExporting] = useState<"month" | "year" | null>(null)

  // Export to CSV (Pro): the month already on screen, or the whole year
  // fetched on demand. Names, not ids — the file is for the accountant.
  const toCsvRows = (list: PaymentWithRelations[]): CsvPaymentRow[] =>
    list.map((p) => ({
      payment_date: p.payment_date,
      client: p.proyectos?.clientes?.name ?? "",
      project: p.proyectos?.name ?? "",
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      notes: p.notes ?? "",
    }))
  const csvLabels: CsvLabels = {
    header: [
      t("payments.export.columns.date"), t("payments.export.columns.client"), t("payments.export.columns.project"),
      t("payments.export.columns.amount"), t("payments.export.columns.method"), t("payments.export.columns.status"),
      t("payments.export.columns.notes"),
    ],
    method: {
      efectivo: t("status.method.efectivo"), transferencia: t("status.method.transferencia"),
      tarjeta: t("status.method.tarjeta"), other: t("status.method.other"),
    },
    status: { pendiente: t("status.payment.pendiente"), pagado: t("status.payment.pagado") },
  }
  const handleExport = async (scope: "month" | "year") => {
    setExporting(scope)
    try {
      const list = scope === "month" ? payments : await getPaymentsInRange(yearRange(month))
      const filename = csvFilename(scope, month)
      downloadTextFile(filename, buildPaymentsCsv(toCsvRows(list), { lang, labels: csvLabels }), "text/csv;charset=utf-8")
      toast.success(t("payments.export.done", { filename }))
    } catch {
      toast.error(t("payments.export.error"))
    } finally {
      setExporting(null)
    }
  }

  const handleFormSuccess = (saved: IPayment) => {
    const wasEdit = editingPayment !== null
    setModalOpen(false)
    setEditingPayment(null)

    if (!wasEdit) {
      const effectiveDate = saved.payment_date || todayDateOnly()
      const savedMonth = effectiveDate.slice(0, 7) as MonthKey
      if (savedMonth !== month) {
        setSearchParams({ month: savedMonth })
        toast.success(t("payments.registeredIn", { month: formatMonth(savedMonth, lang) }))
        return
      }
    }

    setRefreshTick(t => t + 1)
    toast.success(wasEdit ? t("payments.updated") : t("payments.registered"))
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
    const confirmed = await confirm({ title: t("payments.confirmDelete", { amount: formatCurrency(Number(payment.amount)) }) })
    if (!confirmed) return
    try {
      await deletePayment(payment.id!)
      setRefreshTick(t => t + 1)
      toast.success(t("payments.deleted"))
    } catch {
      setDeleteError(t("payments.deleteError"))
    }
  }

  const proximoPago = payments
    .filter(p => p.status === "pendiente" && p.payment_date)
    .sort((a, b) => a.payment_date!.localeCompare(b.payment_date!))[0]

  const proximoPagoValue = proximoPago
    ? `${formatDateOnly(proximoPago.payment_date!, lang)} — ${formatCurrency(Number(proximoPago.amount))}`
    : "—"

  const totalGanado = payments
    .filter(p => p.status === "pagado")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const totalPendiente = payments
    .filter(p => p.status === "pendiente")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const yearLabel = month.slice(0, 4)
  // Month-scoped cards say WHICH month, so "Pendiente" can't be misread as
  // an all-time figure (the year card next to it carries the yearly one).
  // Lowercased mid-sentence in Spanish ("Cobrado en septiembre 2026");
  // English month names are proper nouns and keep their capital.
  const monthLabel = lang === "es" ? formatMonth(month, lang).toLowerCase() : formatMonth(month, lang)

  return (
    <div>
      <PageHeader
        title={t("payments.title")}
        description={t("payments.description")}
        actionLabel={t("payments.register")}
        onAction={() => { setEditingPayment(null); setModalOpen(true) }}
      >
        <div className={styles.toolbar}>
          <MonthSelector value={month} onChange={handleMonthChange} markedMonths={pendingMonths} />
          <ProFeature variant="inline" title={t("payments.export.title")} description={t("payments.export.description")}>
            <div className={styles.exportGroup} role="group" aria-label={t("payments.export.title")}>
              <button type="button" className={styles.exportBtn} disabled={exporting !== null} onClick={() => handleExport("month")}>
                <Download size={14} aria-hidden="true" />
                {exporting === "month" ? t("payments.export.exporting") : t("payments.export.month", { month: monthLabel })}
              </button>
              <button type="button" className={styles.exportBtn} disabled={exporting !== null} onClick={() => handleExport("year")}>
                <Download size={14} aria-hidden="true" />
                {exporting === "year" ? t("payments.export.exporting") : t("payments.export.year", { year: month.slice(0, 4) })}
              </button>
            </div>
          </ProFeature>
        </div>
      </PageHeader>

      {deleteError && (
        <div className={styles.errorBanner}>
          <span>{deleteError}</span>
          <button className={styles.errorClose} onClick={() => setDeleteError(null)}>&times;</button>
        </div>
      )}

      {paymentsError && (
        <div className={styles.errorBanner}>
          <span>{t("payments.loadError")}</span>
        </div>
      )}

      {paymentsLoading ? (
        <div className={styles.loaderSection}><Loader /></div>
      ) : (
        <>
          <div className={styles.kpiGrid}>
            <StatCard label={t("payments.stats.collectedIn", { month: monthLabel })} value={formatCurrency(totalGanado)} icon={DollarSign} variant="success" />
            <StatCard label={t("payments.stats.pendingIn", { month: monthLabel })} value={formatCurrency(totalPendiente)} icon={Clock} variant="warning" />
            <StatCard label={t("payments.stats.nextProjected")} value={proximoPagoValue} icon={Calendar} variant="primary" />
            <StatCard
              label={t("payments.stats.accumulated", { year: yearLabel })}
              value={formatCurrency(yearTotals.paid)}
              secondaryValue={formatCurrency(yearTotals.pending)}
              secondaryLabel={
                pendingMonths.length > 0
                  ? t("payments.stats.pendingMonths", { months: pendingMonths.map(key => shortMonth(key, lang)).join(", ") })
                  : t("payments.stats.pending")
              }
              icon={TrendingUp}
              variant="primary"
            />
          </div>

          {payments.length === 0 && (
            <EmptyState
              icon={DollarSign}
              title={t("payments.empty.title", { month: formatMonth(month, lang) })}
              description={t("payments.empty.description")}
              actionLabel={t("payments.register")}
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
                  <th>{t("payments.fields.date")}</th>
                  <th>{t("payments.fields.client")}</th>
                  <th>{t("payments.fields.project")}</th>
                  <th>{t("payments.fields.amount")}</th>
                  <th>{t("payments.fields.status")}</th>
                  <th>{t("payments.fields.method")}</th>
                  <th>{t("payments.fields.actions")}</th>
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingPayment ? t("payments.edit") : t("payments.register")}>
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

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={t("payments.detail")}>
        {viewingPayment && <PaymentView payment={viewingPayment} />}
      </Modal>

      <ConfirmDialog
        {...dialogProps}
        description={dialogProps.description ?? t("shared.irreversible")}
      />
    </div>
  )
}

export default PaymentsPage
