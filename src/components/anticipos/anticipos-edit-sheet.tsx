"use client";

import { useEffect, useState } from "react";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import { useMediaQuery } from "@/hooks/use-media-query";
import { AnticiposFormFields } from "@/components/anticipos/anticipos-form";
import {
  anticipoUpdateSchema,
  type AnticipoRow,
  type AnticipoUpdateInput,
} from "@/lib/anticipos/schema";
import { updateAnticipo, type UpdateAnticipoState } from "@/lib/anticipos/actions";

function rowToUpdateDefaults(row: AnticipoRow): AnticipoUpdateInput {
  return {
    id: row.id,
    nombre: row.nombre,
    requerimiento: row.requerimiento,
    falta: row.falta,
    observacion_1: row.observacion_1,
    observacion_2: row.observacion_2 ?? "",
    fecha_rq: row.fecha_rq,
    fecha_gestion: row.fecha_gestion ?? "",
  };
}

export function AnticiposEditSheet({
  row,
  open,
  onOpenChange,
}: {
  row: AnticipoRow | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const [state, formAction] = useActionState<
    UpdateAnticipoState | undefined,
    FormData
  >(updateAnticipo, undefined);

  const form = useForm<AnticipoUpdateInput>({
    resolver: zodResolver(anticipoUpdateSchema),
    mode: "onTouched",
    defaultValues: row ? rowToUpdateDefaults(row) : undefined,
  });

  const { reset, setError } = form;

  useEffect(() => {
    if (!open || !row) return;
    reset(rowToUpdateDefaults(row));
  }, [open, row, reset]);

  useEffect(() => {
    if (!state) return;
    if (state.fieldErrors) {
      for (const [key, message] of Object.entries(state.fieldErrors)) {
        if (message) {
          setError(key as keyof AnticipoUpdateInput, { message });
        }
      }
    }
    if (state.error && !state.fieldErrors) {
      toast.error(state.error);
    }
    if (state.ok) {
      toast.success("Registro actualizado");
      onOpenChange(false);
    }
  }, [state, setError, onOpenChange]);

  function onValidSubmit(values: AnticipoUpdateInput) {
    const fd = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === null) continue;
      fd.set(key, String(value));
    }
    startTransition(() => {
      formAction(fd);
    });
  }

  if (!hydrated || !row) return null;

  const fieldsProps = {
    form,
    onCancel: () => onOpenChange(false),
    onSubmit: onValidSubmit,
    submitLabel: "Guardar cambios",
    submittingLabel: "Guardando…",
    formId: "anticipos-edit-form",
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar registro</DialogTitle>
            <DialogDescription>
              Modifica los campos del anticipo de {row.nombre}. Los cambios se
              guardan al confirmar.
            </DialogDescription>
          </DialogHeader>
          <AnticiposFormFields<AnticipoUpdateInput> {...fieldsProps} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Editar registro</DrawerTitle>
          <DrawerDescription>
            Modifica los campos del anticipo de {row.nombre}. Los cambios se
            guardan al confirmar.
          </DrawerDescription>
        </DrawerHeader>
        <AnticiposFormFields<AnticipoUpdateInput> {...fieldsProps} />
      </DrawerContent>
    </Drawer>
  );
}
