"use client";

import { Toaster as SonnerToaster } from "sonner";

export { toast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: "var(--font-geist-sans)",
          fontSize: "14px",
          border: "1px solid var(--color-border)",
        },
      }}
    />
  );
}
