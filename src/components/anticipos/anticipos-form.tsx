"use client";

import { useEffect, useState } from "react";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
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
import { Controller } from "react-hook-form";
import {
  ANTICIPOS_FALTA_OPTIONS,
  ANTICIPOS_OBSERVACION_1_OPTIONS,
  anticipoCreateSchema,
  todayIsoDate,
  type AnticipoCreateInput,
} from "@/lib/anticipos/schema";
import { createAnticipo, type CreateAnticipoState } from "@/lib/anticipos/actions";

type SharedFields = {
  nombre?: { message?: string };
  requerimiento?: { message?: string };
  falta?: { message?: string };
  observacion_1?: { message?: string };
  observacion_2?: { message?: string };
  fecha_rq?: { message?: string };
  fecha_gestion?: { message?: string };
};

type AnticiposFormErrorShape = FieldValues & SharedFields;

function AnticiposFormFields<T extends AnticipoCreateInput & FieldValues>({
  form,
  onCancel,
  onSubmit,
  submitLabel = "Guardar registro",
  submittingLabel = "Guardando…",
  formId,
}: {
  form: UseFormReturn<T>;
  onCancel: () => void;
  onSubmit: (values: T) => void;
  submitLabel?: string;
  submittingLabel?: string;
  formId: string;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const errs = errors as unknown as AnticiposFormErrorShape;

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-4 px-5 pb-4">
        <div className="space-y-1.5">
          <Label htmlFor="anticipo-nombre">Nombre de colaborador</Label>
          <Input
            id="anticipo-nombre"
            autoComplete="off"
            aria-invalid={Boolean(errs.nombre)}
            {...register("nombre" as Path<T>)}
          />
          {errs.nombre?.message && (
            <p className="text-xs text-destructive">{errs.nombre.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="anticipo-requerimiento">Requerimiento</Label>
          <Input
            id="anticipo-requerimiento"
            autoComplete="off"
            aria-invalid={Boolean(errs.requerimiento)}
            {...register("requerimiento" as Path<T>)}
          />
          {errs.requerimiento?.message && (
            <p className="text-xs text-destructive">
              {errs.requerimiento.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="anticipo-falta">Falta</Label>
          <Controller
            control={control}
            name={"falta" as Path<T>}
            render={({ field }) => (
              <Select
                value={(field.value as string) ?? ""}
                onValueChange={field.onChange}
              >
                <SelectTrigger id="anticipo-falta" className="w-full">
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
          {errs.falta?.message && (
            <p className="text-xs text-destructive">{errs.falta.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="anticipo-observacion-1">Observación 1</Label>
          <Controller
            control={control}
            name={"observacion_1" as Path<T>}
            render={({ field }) => (
              <Select
                value={(field.value as string) ?? ""}
                onValueChange={field.onChange}
              >
                <SelectTrigger id="anticipo-observacion-1" className="w-full">
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
          {errs.observacion_1?.message && (
            <p className="text-xs text-destructive">
              {errs.observacion_1.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="anticipo-observacion-2">
            Observación 2{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id="anticipo-observacion-2"
            rows={3}
            aria-invalid={Boolean(errs.observacion_2)}
            {...register("observacion_2" as Path<T>)}
          />
          {errs.observacion_2?.message && (
            <p className="text-xs text-destructive">
              {errs.observacion_2.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="anticipo-fecha-rq">Fecha de RQ</Label>
            <Input
              id="anticipo-fecha-rq"
              type="date"
              aria-invalid={Boolean(errs.fecha_rq)}
              {...register("fecha_rq" as Path<T>)}
            />
            {errs.fecha_rq?.message && (
              <p className="text-xs text-destructive">
                {errs.fecha_rq.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anticipo-fecha-gestion">
              Fecha de gestión{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="anticipo-fecha-gestion"
              type="date"
              aria-invalid={Boolean(errs.fecha_gestion)}
              {...register("fecha_gestion" as Path<T>)}
            />
            {errs.fecha_gestion?.message && (
              <p className="text-xs text-destructive">
                {errs.fecha_gestion.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border bg-background px-5 py-3 sm:flex-row sm:justify-end sm:gap-2">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo registro</DialogTitle>
            <DialogDescription>
              Diligencia la información del anticipo. La fecha de gestión se
              inicializa con la fecha de hoy.
            </DialogDescription>
          </DialogHeader>
          <AnticiposFormFields {...fieldsProps} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Nuevo registro</DrawerTitle>
          <DrawerDescription>
            Diligencia la información del anticipo. La fecha de gestión se
            inicializa con la fecha de hoy.
          </DrawerDescription>
        </DrawerHeader>
        <AnticiposFormFields {...fieldsProps} />
      </DrawerContent>
    </Drawer>
  );
}

export { AnticiposFormFields, DEFAULT_VALUES as ANTICIPOS_DEFAULT_VALUES };
