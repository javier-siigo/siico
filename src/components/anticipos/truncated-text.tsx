"use client";

import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string;
  className?: string;
}

function isTruncated(el: HTMLElement): boolean {
  return el.scrollWidth > el.clientWidth + 1;
}

/**
 * Renders text with an ellipsis and shows a tooltip with the full text only
 * when the text is actually clipped. Truncation is measured at the moment the
 * tooltip tries to open, so it always reflects the current column width.
 */
export function TruncatedText({ text, className }: TruncatedTextProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [open, setOpen] = React.useState(false);

  const handleOpenChange = (next: boolean) => {
    if (next && (!ref.current || !isTruncated(ref.current))) return;
    setOpen(next);
  };

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        <span ref={ref} className={cn("block min-w-0 truncate", className)}>
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm whitespace-pre-wrap break-words">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
