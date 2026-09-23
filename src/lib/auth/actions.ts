"use server";

import { redirect } from "next/navigation";
import { AuthApiError, AuthError } from "@supabase/supabase-js";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type LoginState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
};

export async function loginAction(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email" || key === "password") fieldErrors[key] = issue.message;
    }
    return { error: "Revisa los campos marcados", fieldErrors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) throw error;
  } catch (err) {
    return { error: messageFromAuthError(err) };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // sesión ya inválida; redirigimos igual
  }
  redirect("/login");
}

function messageFromAuthError(err: unknown): string {
  if (err instanceof AuthApiError) {
    if (err.code === "invalid_credentials") {
      return "Credenciales incorrectas";
    }
    if (err.code === "email_not_confirmed") {
      return "Tu correo aún no ha sido confirmado";
    }
    if (err.code === "over_email_send_rate_limit" || err.status === 429) {
      return "Demasiados intentos. Intenta de nuevo en unos minutos.";
    }
    if (err.status >= 500) {
      return "El servicio de autenticación no está disponible. Intenta más tarde.";
    }
    return err.message || "No se pudo iniciar sesión";
  }
  if (err instanceof AuthError) {
    return err.message || "No se pudo iniciar sesión";
  }
  if (err instanceof Error) return err.message;
  return "No se pudo iniciar sesión";
}
