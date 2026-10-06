"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { BancoConciliacion } from "./types";

interface BankComboboxProps {
  bancos: BancoConciliacion[];
  value: BancoConciliacion | null;
  onChange: (banco: BancoConciliacion | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function BankCombobox({
  bancos,
  value,
  onChange,
  disabled,
  placeholder = "Buscar banco…",
}: BankComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Seleccionar banco"
          disabled={disabled}
          className={cn(
            "w-full justify-between sm:w-72",
            !value && "text-muted-foreground",
          )}
        >
          {value ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{value.nombre}</span>
              {value.esParticular && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">
                  <Sparkles className="mr-1 size-3" />
                  Particular
                </Badge>
              )}
            </span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 sm:w-80"
        align="start"
      >
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No encontramos bancos.</CommandEmpty>
            <CommandGroup>
              {bancos.map((banco) => {
                const isSelected = value?.slug === banco.slug;
                return (
                  <CommandItem
                    key={banco.slug}
                    value={`${banco.nombre} ${banco.slug}`}
                    onSelect={() => {
                      onChange(isSelected ? null : banco);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm">{banco.nombre}</span>
                      {banco.descripcion && (
                        <span className="truncate text-xs text-muted-foreground">
                          {banco.descripcion}
                        </span>
                      )}
                    </span>
                    {banco.esParticular && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">
                        <Sparkles className="mr-1 size-3" />
                        Particular
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
