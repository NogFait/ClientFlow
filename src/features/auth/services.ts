import { supabase } from "../../services/supabaseClient";
import type { IUser } from "./types";

export async function signUpUser(data: IUser) {
  const { data: result, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.contrasena, /* contraseña */
  });
  if (error) throw new Error(error.message);
  if (!result.user) throw new Error("El usuario no pudo crearse. Probá con otro email.");
}

export async function signInUser(data: IUser) {
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.contrasena, /* contraseña */
  });
  if (error) throw new Error(error.message);
}