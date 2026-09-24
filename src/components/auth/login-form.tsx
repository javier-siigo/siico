"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "@/lib/auth/actions";

const schema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Iniciando sesión…
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" />
          Iniciar sesión
        </>
      )}
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [state, formAction] = useActionState<LoginState | undefined, FormData>(
    async (_prev, formData) => {
      const next = await loginAction(_prev, formData);
      if (next.success) {
        router.push("/dashboard", { transitionTypes: ["auth-enter"] });
      }
      return next;
    },
    undefined,
  );
  const {
    register,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const emailError = errors.email?.message ?? state?.fieldErrors?.email;
  const passwordError = errors.password?.message ?? state?.fieldErrors?.password;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo corporativo</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={Boolean(emailError)}
          {...register("email")}
        />
        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(passwordError)}
          {...register("password")}
        />
        {passwordError && (
          <p className="text-xs text-destructive">{passwordError}</p>
        )}
      </div>

      {state?.error && !state.fieldErrors && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}