import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export default function DocumentoNoEncontrado() {
  return (
    <EmptyState
      icon={<FileQuestion className="size-7" aria-hidden />}
      title="Este documento no existe o no tienes acceso"
      description="Puede que el enlace esté mal escrito o que el documento sea de un proceso que no tienes asignado."
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/documentacion">Ver la documentación disponible</Link>
        </Button>
      }
    />
  );
}
