"use client";

import { useEffect, useState } from "react";

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

import { ImportarRetiradosForm } from "./importar-retirados-form";

export function ImportarRetiradosSheet({
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

  if (!hydrated) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 gap-1 border-b border-border px-5 pb-4 pt-5">
            <DialogTitle>Importar excolaboradores</DialogTitle>
            <DialogDescription>
              Sube el archivo con la lista de excolaborados.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-5">
            <ImportarRetiradosForm />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="overflow-hidden">
        <DrawerHeader className="shrink-0 border-b border-border">
          <DrawerTitle>Importar excolaboradores</DrawerTitle>
          <DrawerDescription>
            Sube el archivo con la lista de excolaborados.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-5">
          <ImportarRetiradosForm />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
