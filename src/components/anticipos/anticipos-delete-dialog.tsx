"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AnticipoRow } from "@/lib/anticipos/schema";
import { deleteAnticipo } from "@/lib/anticipos/actions";

export function AnticiposDeleteDialog({
  row,
  open,
  onOpenChange,
}: {
  row: AnticipoRow | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!row) return;
    const id = row.id;
    startTransition(async () => {
      const res = await deleteAnticipo(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Registro eliminado");
      onOpenChange(false);
    });
  }

  if (!hydrated || !row) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar el anticipo de {row.nombre} · {row.requerimiento}.
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost" disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Eliminando…
              </>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
