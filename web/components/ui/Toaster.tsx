"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

export { toast };

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      theme="system"
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
