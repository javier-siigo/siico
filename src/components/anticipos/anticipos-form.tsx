"use client";

import { useEffect, useState } from "react";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
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

function AnticiposFormFields({
  form,
  onCancel,
  onSubmit,
}: {
  form: UseFormReturn<AnticipoCreateInput>;
  onCancel: () => void;
  onSubmit: (values: AnticipoCreateInput) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form
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
            aria-invalid={Boolean(errors.nombre)}
            {...register("nombre")}
          />
          {errors.nombre && (
            <p className="text-xs text-destructive">{errors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="anticipo-requerimiento">Requerimiento</Label>
          <Input
            id="anticipo-requerimiento"
            autoComplete="off"
            aria-invalid={Boolean(errors.requerimiento)}
            {...register("requerimiento")}
          />
          {errors.requerimiento && (
            <p className="text-xs text-destructive">
              {errors.requerimiento.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="anticipo-falta">Falta</Label>
          <Controller
            control={control}
            name="falta"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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
          {errors.falta && (
            <p className="text-xs text-destructive">{errors.falta.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="anticipo-observacion-1">Observación 1</Label>
          <Controller
            control={control}
            name="observacion_1"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="anticipo-observacion-1"
                  className="w-full"
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
          {errors.observacion_1 && (
            <p className="text-xs text-destructive">
              {errors.observacion_1.message}
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
            aria-invalid={Boolean(errors.observacion_2)}
            {...register("observacion_2")}
          />
          {errors.observacion_2 && (
            <p className="text-xs text-destructive">
              {errors.observacion_2.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="anticipo-fecha-rq">Fecha de RQ</Label>
            <Input
              id="anticipo-fecha-rq"
              type="date"
              aria-invalid={Boolean(errors.fecha_rq)}
              {...register("fecha_rq")}
            />
            {errors.fecha_rq && (
              <p className="text-xs text-destructive">
                {errors.fecha_rq.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anticipo-fecha-gestion">Fecha de gestión</Label>
            <Input
              id="anticipo-fecha-gestion"
              type="date"
              aria-invalid={Boolean(errors.fecha_gestion)}
              {...register("fecha_gestion")}
            />
            {errors.fecha_gestion && (
              <p className="text-xs text-destructive">
                {errors.fecha_gestion.message}
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
              Guardando…
            </>
          ) : (
            <>
              <Save className="size-4" />
              Guardar registro
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
  fecha_gestion: todayIsoDate(),
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
