import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { IUser } from "../types";
import { signUpUser, signInUser, resendSignupConfirmation, AuthError } from "../services";
import { storePendingPlan } from "../pendingPlan";

export type ResendStatus =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string }

// "Didn't get the email?" — shared by the post-register notice and by the
// login form when Supabase answers "email not confirmed". Supabase's own
// refusal (e.g. its 60s minimum interval) is shown as it comes.
export function useResendConfirmation() {
  const [status, setStatus] = useState<ResendStatus>({ kind: "idle" });

  const resend = async (email: string) => {
    setStatus({ kind: "sending" });
    try {
      await resendSignupConfirmation(email);
      setStatus({ kind: "sent" });
    } catch (error) {
      setStatus({ kind: "error", message: (error as Error).message });
    }
  };

  return { resend, status };
}

export function useRegisterForm() {
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  // Set once signUp succeeds. With "Confirm email" ON in Supabase the user
  // has no session yet — they must click the emailed link — so the page
  // switches to a "check your inbox" notice for this address instead of
  // sending them to /login, where they'd only hit "email not confirmed".
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IUser>();

  const onSubmit = async (data: IUser) => {
    try {
      await signUpUser(data);
      // Preserve the plan chosen on /pricing across the register -> confirm
      // -> first session hop — see pendingPlan.ts. Silently ignored when
      // absent/invalid.
      const plan = searchParams.get("plan");
      if (plan) storePendingPlan(plan);
      setRegisteredEmail(data.email);
    } catch (error) {
      // Our own AuthError carries a code → translated here; Supabase's
      // errors carry their (English) message and are shown as they come.
      setError("root.serverError", {
        type: "manual",
        message: error instanceof AuthError ? t(`errors.${error.code}`) : (error as Error).message,
      });
    }
  };

  return { register, handleSubmit, onSubmit, errors, isSubmitting, registeredEmail };
}

export function useLoginForm() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<IUser>();

  const onSubmit = async (data: IUser) => {
    try {
      await signInUser(data);
      navigate("/dashboard");
    } catch (error) {
      // The error's `type` carries our code so the page can react to it
      // (offer a resend for an unconfirmed account) without string-matching
      // the translated message.
      setError("root.serverError", {
        type: error instanceof AuthError ? error.code : "manual",
        message: error instanceof AuthError ? t(`errors.${error.code}`) : (error as Error).message,
      });
    }
  };

  // The address the failed attempt was made with — what a resend targets.
  const submittedEmail = () => getValues("email");

  return { register, handleSubmit, onSubmit, errors, isSubmitting, submittedEmail };
}
