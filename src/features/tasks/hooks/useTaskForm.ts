import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { ITask } from "../types"
import { createTask, updateTask } from "../services"

// lockedProjectId: used by the project hub's "+ Nueva tarea" (project
// preselected and its select hidden in TaskForm) — forces project_id on
// submit regardless of what the form actually registered, since a hidden
// field never gets a value from react-hook-form. Undefined outside the hub
// keeps TaskPage's own behavior unchanged.
export function useTaskForm(onSuccess: () => void, defaultValues?: ITask, lockedProjectId?: string) {
  const { t } = useTranslation("app")
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ITask>({ values: defaultValues })

  const onSubmit = async (data: ITask) => {
    try {
      const { proyectos, ...cleanData } = data as ITask & { proyectos?: unknown }
      if (lockedProjectId) {
        cleanData.project_id = lockedProjectId
      }
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
        message: t("tasks.saveError"),
      })
    }
  }

  return { register, handleSubmit, onSubmit, reset, errors, isSubmitting }
}
