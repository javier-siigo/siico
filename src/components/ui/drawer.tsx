"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";

import { cn } from "@/lib/utils";

const Drawer = DrawerPrimitive.Root;

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerBackdrop = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Backdrop>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Backdrop
    ref={ref}
    data-slot="drawer-backdrop"
    className={cn(
      "fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DrawerBackdrop.displayName = DrawerPrimitive.Backdrop.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerBackdrop />
    <DrawerPrimitive.Viewport
      data-slot="drawer-viewport"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-center"
    >
      <DrawerPrimitive.Popup
        ref={ref}
        data-slot="drawer-content"
        className={cn(
          "flex w-full max-w-md flex-col rounded-t-lg border bg-card shadow-lg outline-none max-h-[85vh] data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 sm:rounded-lg sm:border",
          className,
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Popup>
    </DrawerPrimitive.Viewport>
  </DrawerPortal>
));
DrawerContent.displayName = DrawerPrimitive.Content.displayName;

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="drawer-header"
    className={cn("flex flex-col space-y-1.5 px-5 py-4", className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="drawer-footer"
    className={cn(
      "mt-auto flex flex-col-reverse gap-2 border-t border-border bg-card px-5 py-3 sm:flex-row sm:justify-end sm:gap-2",
      className,
    )}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    data-slot="drawer-title"
    className={cn("text-base font-semibold text-foreground", className)}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    data-slot="drawer-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerBackdrop,
  DrawerPortal,
};
