import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { IUser } from "../types";
import { signUpUser, signInUser } from "../services";
import { storePendingPlan } from "../pendingPlan";

export function useRegisterForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IUser>();

  const onSubmit = async (data: IUser) => {
    try {
      await signUpUser(data);
      // Preserve the plan chosen on /pricing across the register -> login
      // hop (this app never auto-authenticates right after signUp) — see
      // pendingPlan.ts. Silently ignored when absent/invalid.
      const plan = searchParams.get("plan");
      if (plan) storePendingPlan(plan);
      navigate("/login");
    } catch (error) {
      setError("root.serverError", {
        type: "manual",
        message: (error as Error).message,
      });
    }
  };

  return { register, handleSubmit, onSubmit, errors, isSubmitting };
}

export function useLoginForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IUser>();

  const onSubmit = async (data: IUser) => {
    try {
      await signInUser(data);
      navigate("/dashboard");
    } catch (error) {
      setError("root.serverError", {
        type: "manual",
        message: (error as Error).message,
      });
    }
  };

  return { register, handleSubmit, onSubmit, errors, isSubmitting };
}