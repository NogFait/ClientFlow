import { useForm } from "react-hook-form"
import type { IPayment } from "../types"
import { createPayment, updatePayment } from "../services"

export function usePaymentForm(onSuccess: () => void, defaultValues?: IPayment) {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<IPayment>({ values: defaultValues })

  const onSubmit = async (data: IPayment) => {
    try {
      const { proyectos, ...cleanData } = data as IPayment & { proyectos?: unknown }
      if (defaultValues?.id) {
        await updatePayment(defaultValues.id, cleanData as Partial<IPayment>)
      } else {
        const { id, ...createData } = cleanData as IPayment
        await createPayment(createData as IPayment)
      }
      reset()
      onSuccess()
    } catch {
      setError("root.serverError", {
        type: "manual",
        message: "Ocurrió un error al guardar el pago. Intentalo de nuevo.",
      })
    }
  }

  return { register, handleSubmit, onSubmit, reset, errors, isSubmitting }
}
