import { useForm } from "react-hook-form"
import type { ITask } from "../types"
import { createTask, updateTask } from "../services"

export function useTaskForm(onSuccess: () => void, defaultValues?: ITask) {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ITask>({ values: defaultValues })

  const onSubmit = async (data: ITask) => {
    try {
      const { proyectos, ...cleanData } = data as ITask & { proyectos?: unknown }
      if (defaultValues?.id) {
        await updateTask(defaultValues.id, cleanData as Partial<ITask>)
      } else {
        const { id, ...createData } = cleanData as ITask
        await createTask(createData as ITask)
      }
      reset()
      onSuccess()
    } catch {
      setError("root.serverError", {
        type: "manual",
        message: "Ocurrió un error al guardar la tarea. Intentalo de nuevo.",
      })
    }
  }

  return { register, handleSubmit, onSubmit, reset, errors, isSubmitting }
}
