import { useForm } from "react-hook-form"
import type { IProject } from "../types"
import { createProject, updateProject } from "../services"
import { LimitExceededError } from "../../billing/domain/errors"

export function useProjectForm(
    onSuccess:()=> void,
    defaultValues?:IProject,
    onLimitExceeded?: (error: LimitExceededError) => void,
){
    const {register, handleSubmit, reset, setError, formState: {errors, isSubmitting}} = useForm<IProject>({values: defaultValues})

    const onSubmit = async (data: IProject) =>{
        try {
            const { clientes, ...cleanData } = data as IProject & { clientes?: unknown }
            if(defaultValues?.id){
                await updateProject(defaultValues.id, cleanData as Partial<IProject>)
            }else{
                const { id, ...createData } = cleanData as IProject
                await createProject(createData as IProject)
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
                message: "Ocurrió un error al guardar el proyecto. Intentalo de nuevo.",
            })
        }
    }
    return {register, handleSubmit, onSubmit, reset, errors, isSubmitting}
}