"use client";

import { ViewTransition } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

const ENTER_BY_TYPE = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  "auth-enter": "auth-enter",
  "auth-exit": "auth-exit",
  default: "none",
} as const;

const EXIT_BY_TYPE = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  "auth-enter": "auth-enter",
  "auth-exit": "auth-exit",
  default: "none",
} as const;

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <ViewTransition default="none" enter={ENTER_BY_TYPE} exit={EXIT_BY_TYPE}>
      {children}
    </ViewTransition>
  );
}
