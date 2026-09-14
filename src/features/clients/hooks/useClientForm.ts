import { useForm } from "react-hook-form"
import type { IClient } from "../types"
import { createClient, updateClient } from "../services"
import { LimitExceededError } from "../../billing/domain/errors"

export function useClientForm(
  onSuccess: () => void,
  defaultValues?: IClient,
  onLimitExceeded?: (error: LimitExceededError) => void,
) {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<IClient>({ values: defaultValues })

  const onSubmit = async (data: IClient) => {
    try {
      if (defaultValues?.id) {
        await updateClient(defaultValues.id, data)
      } else {
        await createClient(data)
      }
      reset()
      onSuccess()
    } catch (error) {
      if (error instanceof LimitExceededError && onLimitExceeded) {
        onLimitExceeded(error)
        return
      }
      setError("root.serverError", {
        type: "manual",
        message: "Ocurrió un error al guardar el cliente. Intentalo de nuevo.",
      })
    }
  }

  return { register, handleSubmit, onSubmit, reset, errors, isSubmitting }
}
