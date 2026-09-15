import { useForm } from "react-hook-form"
import type { IPayment } from "../types"
import { createPayment, updatePayment } from "../services"

// lockedProjectId: used by the project hub's "+ Registrar pago" (project
// preselected and its select hidden in PaymentForm) — forces project_id on
// submit regardless of what the form actually registered, since a hidden
// field never gets a value from react-hook-form. Undefined outside the hub
// keeps PaymentsPage's own behavior unchanged.
export function usePaymentForm(onSuccess: (saved: IPayment) => void, defaultValues?: IPayment, lockedProjectId?: string) {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<IPayment>({ values: defaultValues })

  const onSubmit = async (data: IPayment) => {
    try {
      const { proyectos, ...cleanData } = data as IPayment & { proyectos?: unknown }
      if (lockedProjectId) {
        cleanData.project_id = lockedProjectId
      }
      if (defaultValues?.id) {
        await updatePayment(defaultValues.id, cleanData as Partial<IPayment>)
      } else {
        const { id, ...createData } = cleanData as IPayment
        await createPayment(createData as IPayment)
      }
      reset()
      onSuccess(cleanData as IPayment)
    } catch {
      setError("root.serverError", {
        type: "manual",
        message: "Ocurrió un error al guardar el pago. Intentalo de nuevo.",
      })
    }
  }

  return { register, handleSubmit, onSubmit, reset, errors, isSubmitting }
}
