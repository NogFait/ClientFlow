import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { IUser } from "../types";
import { signUpUser, signInUser } from "../services";

export function useRegisterForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IUser>();

  const onSubmit = async (data: IUser) => {
    try {
      await signUpUser(data);
      navigate("/");
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