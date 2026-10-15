import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddRowButtonProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
}

export function AddRowButton({
  onClick,
  label,
  disabled,
  className,
  size = "sm",
}: AddRowButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full justify-center border-dashed text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Plus className="size-3.5" />
      {label}
    </Button>
  );
}
