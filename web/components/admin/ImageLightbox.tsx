"use client";

import { useEffect, useState } from "react";

export interface ImageLightboxProps {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt = "Image", open, onClose }: ImageLightboxProps) {
  const [error, setError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setError(false);
  }

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(event) => event.stopPropagation()}>
        {error ? (
          <div className="flex h-64 w-80 flex-col items-center justify-center gap-2 rounded-2xl bg-surface text-text-hint">
            <p className="text-sm">Image unavailable</p>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            onError={() => setError(true)}
          />
        )}
      </div>
    </div>
  );
}
