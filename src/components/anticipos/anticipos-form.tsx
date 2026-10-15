"use client";

import { useEffect, useState } from "react";
import { startTransition, useActionState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  ANTICIPOS_FALTA_OPTIONS,
  ANTICIPOS_OBSERVACION_1_OPTIONS,
  anticipoCreateSchema,
  todayIsoDate,
  type AnticipoCreateInput,
} from "@/lib/anticipos/schema";
import { createAnticipo, type CreateAnticipoState } from "@/lib/anticipos/actions";
import { cn } from "@/lib/utils";

type AnticiposFormErrorShape = {
  nombre?: { message?: string };
  requerimiento?: { message?: string };
  falta?: { message?: string };
  observacion_1?: { message?: string };
  observacion_2?: { message?: string };
  fecha_rq?: { message?: string };
  fecha_gestion?: { message?: string };
};

const TEXTAREA_MAX = 500;
const NAME_MAX = 120;
const REQUERIMIENTO_MAX = 120;

function RequiredMark() {
  return (
    <span aria-hidden className="ml-0.5 text-primary">
      *
    </span>
  );
}

function OptionalMark() {
  return (
    <span className="ml-1 font-normal text-muted-foreground">
      (opcional)
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.06em] text-muted-foreground">
      {children}
    </span>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {children}
    </p>
  );
}

type AnticiposFormFieldsProps<T extends AnticipoCreateInput & FieldValues> = {
  form: UseFormReturn<T>;
  onCancel: () => void;
  onSubmit: (values: T) => void;
  submitLabel?: string;
  submittingLabel?: string;
  formId: string;
};

function AnticiposFormFields<T extends AnticipoCreateInput & FieldValues>({
  form,
  onCancel,
  onSubmit,
  submitLabel = "Guardar registro",
  submittingLabel = "Guardando…",
  formId,
}: AnticiposFormFieldsProps<T>) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const errs = errors as unknown as AnticiposFormErrorShape;
  const observacion2Value =
    (watch("observacion_2" as Path<T>) as string | undefined) ?? "";

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="mb-0.5">
              <SectionLabel>Identidad del colaborador</SectionLabel>
            </legend>
            <div className="space-y-1.5">
              <Label htmlFor="anticipo-nombre">
                Nombre del colaborador
                <RequiredMark />
              </Label>
              <Input
                id="anticipo-nombre"
                autoComplete="off"
                placeholder="Como aparece en la solicitud"
                maxLength={NAME_MAX}
                aria-describedby={errs.nombre ? "anticipo-nombre-error" : undefined}
                aria-invalid={Boolean(errs.nombre)}
                {...register("nombre" as Path<T>)}
              />
              {errs.nombre?.message ? (
                <FieldError id="anticipo-nombre-error">
                  {errs.nombre.message}
                </FieldError>
              ) : null}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-0.5">
              <SectionLabel>Requerimiento</SectionLabel>
            </legend>
            <div className="space-y-1.5">
              <Label htmlFor="anticipo-requerimiento">
                Código de requerimiento
                <RequiredMark />
              </Label>
              <Input
                id="anticipo-requerimiento"
                autoComplete="off"
                placeholder="Ej. RQ-12345"
                maxLength={REQUERIMIENTO_MAX}
                className="font-mono tabular-nums"
                aria-describedby={
                  errs.requerimiento
                    ? "anticipo-requerimiento-error"
                    : "anticipo-requerimiento-hint"
                }
                aria-invalid={Boolean(errs.requerimiento)}
                {...register("requerimiento" as Path<T>)}
              />
              {errs.requerimiento?.message ? (
                <FieldError id="anticipo-requerimiento-error">
                  {errs.requerimiento.message}
                </FieldError>
              ) : (
                <span id="anticipo-requerimiento-hint">
                  <FieldHint>
                    Identificador de la solicitud en Siigo o NetSuite.
                  </FieldHint>
                </span>
              )}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-0.5">
              <SectionLabel>Estado del anticipo</SectionLabel>
            </legend>

            <div className="space-y-1.5">
              <Label htmlFor="anticipo-falta">
                Falta
                <RequiredMark />
              </Label>
              <Controller
                control={control}
                name={"falta" as Path<T>}
                render={({ field }) => (
                  <Select
                    value={(field.value as string) ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="anticipo-falta"
                      className="w-full"
                      aria-invalid={Boolean(errs.falta)}
                    >
                      <SelectValue placeholder="Selecciona una falta" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANTICIPOS_FALTA_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errs.falta?.message ? (
                <FieldError id="anticipo-falta-error">
                  {errs.falta.message}
                </FieldError>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="anticipo-observacion-1">
                Observación 1
                <RequiredMark />
              </Label>
              <Controller
                control={control}
                name={"observacion_1" as Path<T>}
                render={({ field }) => (
                  <Select
                    value={(field.value as string) ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="anticipo-observacion-1"
                      className="w-full"
                      aria-invalid={Boolean(errs.observacion_1)}
                    >
                      <SelectValue placeholder="Selecciona una observación" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANTICIPOS_OBSERVACION_1_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errs.observacion_1?.message ? (
                <FieldError id="anticipo-observacion-1-error">
                  {errs.observacion_1.message}
                </FieldError>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor="anticipo-observacion-2">
                  Observación 2
                  <OptionalMark />
                </Label>
                <span
                  className={cn(
                    "font-mono text-[0.6875rem] tabular-nums leading-none",
                    observacion2Value.length >= TEXTAREA_MAX
                      ? "text-destructive"
                      : "text-muted-foreground/80",
                  )}
                  aria-live="polite"
                >
                  {observacion2Value.length} / {TEXTAREA_MAX}
                </span>
              </div>
              <Textarea
                id="anticipo-observacion-2"
                rows={3}
                maxLength={TEXTAREA_MAX}
                placeholder="Notas adicionales, contexto o próximos pasos"
                aria-describedby={
                  errs.observacion_2
                    ? "anticipo-observacion-2-error"
                    : undefined
                }
                aria-invalid={Boolean(errs.observacion_2)}
                {...register("observacion_2" as Path<T>)}
              />
              {errs.observacion_2?.message ? (
                <FieldError id="anticipo-observacion-2-error">
                  {errs.observacion_2.message}
                </FieldError>
              ) : null}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-0.5">
              <SectionLabel>Fechas</SectionLabel>
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="anticipo-fecha-rq">
                  Fecha de RQ
                  <RequiredMark />
                </Label>
                <Input
                  id="anticipo-fecha-rq"
                  type="date"
                  aria-describedby={
                    errs.fecha_rq ? "anticipo-fecha-rq-error" : undefined
                  }
                  aria-invalid={Boolean(errs.fecha_rq)}
                  {...register("fecha_rq" as Path<T>)}
                />
                {errs.fecha_rq?.message ? (
                  <FieldError id="anticipo-fecha-rq-error">
                    {errs.fecha_rq.message}
                  </FieldError>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="anticipo-fecha-gestion">
                  Fecha de gestión
                  <OptionalMark />
                </Label>
                <Input
                  id="anticipo-fecha-gestion"
                  type="date"
                  aria-describedby={
                    errs.fecha_gestion
                      ? "anticipo-fecha-gestion-error"
                      : "anticipo-fecha-gestion-hint"
                  }
                  aria-invalid={Boolean(errs.fecha_gestion)}
                  {...register("fecha_gestion" as Path<T>)}
                />
                {errs.fecha_gestion?.message ? (
                  <FieldError id="anticipo-fecha-gestion-error">
                    {errs.fecha_gestion.message}
                  </FieldError>
                ) : (
                  <span id="anticipo-fecha-gestion-hint">
                    <FieldHint>
                      Déjala en blanco si aún no la has asignado.
                    </FieldHint>
                  </span>
                )}
              </div>
            </div>
          </fieldset>
        </div>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-card px-5 py-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {submittingLabel}
            </>
          ) : (
            <>
              <Save className="size-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

const DEFAULT_VALUES: AnticipoCreateInput = {
  nombre: "",
  requerimiento: "",
  falta: "permisos_de_soportes",
  observacion_1: "no_se_ha_contactado",
  observacion_2: "",
  fecha_rq: todayIsoDate(),
  fecha_gestion: "",
};

export function AnticiposFormSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const [state, formAction] = useActionState<
    CreateAnticipoState | undefined,
    FormData
  >(createAnticipo, undefined);

  const form = useForm<AnticipoCreateInput>({
    resolver: zodResolver(anticipoCreateSchema),
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const { reset, setError } = form;

  useEffect(() => {
    if (!state) return;
    if (state.fieldErrors) {
      for (const [key, message] of Object.entries(state.fieldErrors)) {
        if (message) {
          setError(key as keyof AnticipoCreateInput, { message });
        }
      }
    }
    if (state.error && !state.fieldErrors) {
      toast.error(state.error);
    }
    if (state.ok) {
      toast.success("Registro creado");
      reset(DEFAULT_VALUES);
      onOpenChange(false);
    }
  }, [state, setError, reset, onOpenChange]);

  function onValidSubmit(values: AnticipoCreateInput) {
    const fd = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === null) continue;
      fd.set(key, String(value));
    }
    startTransition(() => {
      formAction(fd);
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset(DEFAULT_VALUES);
    }
    onOpenChange(next);
  }

  if (!hydrated) return null;

  const fieldsProps = {
    form,
    onCancel: () => handleOpenChange(false),
    onSubmit: onValidSubmit,
    formId: "anticipos-create-form",
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 gap-1 border-b border-border px-5 pb-4 pt-5">
            <DialogTitle>Nuevo registro</DialogTitle>
            <DialogDescription>
              Captura la información del anticipo. La fecha de gestión puede
              quedar en blanco y asignarse al legalizarlo.
            </DialogDescription>
          </DialogHeader>
          <AnticiposFormFields {...fieldsProps} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-hidden">
        <DrawerHeader className="shrink-0 border-b border-border">
          <DrawerTitle>Nuevo registro</DrawerTitle>
          <DrawerDescription>
            Captura la información del anticipo. La fecha de gestión puede
            quedar en blanco y asignarse al legalizarlo.
          </DrawerDescription>
        </DrawerHeader>
        <AnticiposFormFields {...fieldsProps} />
      </DrawerContent>
    </Drawer>
  );
}

export { AnticiposFormFields, DEFAULT_VALUES as ANTICIPOS_DEFAULT_VALUES };
