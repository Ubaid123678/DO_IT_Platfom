"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import {
  getAdminTokenFromCookie,
  useAdminAuthStore,
} from "@/hooks/useAdminAuth";
import { API_ORIGIN } from "@/lib/api";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

/* eslint-disable @next/next/no-img-element -- Supports data URIs and protected upload blobs. */

export interface ImageViewerProps {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  maxHeight?: string;
  authenticated?: boolean;
}

export function ImageViewer({
  src,
  alt,
  className = "",
  imageClassName = "",
  maxHeight = "max-h-80",
  authenticated = false,
}: ImageViewerProps) {
  const [protectedImage, setProtectedImage] = useState<{
    source: string;
    objectUrl?: string;
    failed: boolean;
  } | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const requiresAuth = Boolean(
    authenticated && src?.startsWith("/uploads/kyc/"),
  );

  useEffect(() => {
    if (!src || !requiresAuth) return;

    const controller = new AbortController();
    let objectUrl: string | undefined;
    const token =
      useAdminAuthStore.getState().token ?? getAdminTokenFromCookie();

    const request = token
      ? fetch(`${API_ORIGIN}${src}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
      : Promise.reject(new Error("Admin token is unavailable."));

    void request
      .then((response) => {
        if (!response.ok) throw new Error("Protected image request failed.");
        return response.blob();
      })
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setProtectedImage({ source: src, objectUrl, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setProtectedImage({ source: src, failed: true });
        }
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [requiresAuth, src]);

  const imageSrc = requiresAuth
    ? protectedImage?.source === src
      ? protectedImage?.objectUrl
      : null
    : src;
  const protectedFailed =
    requiresAuth &&
    protectedImage?.source === src &&
    protectedImage?.failed;
  const failed = !src || protectedFailed || (!requiresAuth && failedSrc === src);
  const loading =
    Boolean(src) &&
    !failed &&
    (requiresAuth ? !imageSrc : loadedSrc !== imageSrc);

  return (
    <>
      <div
        className={`relative flex max-w-full items-center justify-center overflow-hidden rounded-xl bg-bg ${className}`}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Spinner label="Loading image" />
          </div>
        )}
        {failed ? (
          <div
            className="flex min-h-32 w-full flex-col items-center justify-center gap-2 p-4 text-sm text-text-hint"
            role="img"
            aria-label={`${alt}: Image unavailable`}
          >
            <ImageOff className="size-6" aria-hidden="true" />
            <span>Image unavailable</span>
          </div>
        ) : imageSrc ? (
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="block max-w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`View ${alt} full size`}
          >
            <img
              src={imageSrc}
              alt={alt}
              className={`block h-auto max-w-full object-contain ${maxHeight} ${imageClassName}`}
              onLoad={() => setLoadedSrc(imageSrc)}
              onError={() => {
                if (requiresAuth && src) {
                  setProtectedImage({ source: src, failed: true });
                } else {
                  setFailedSrc(src ?? null);
                }
              }}
            />
          </button>
        ) : (
          <div className="min-h-32 w-full" aria-hidden="true" />
        )}
      </div>
      <Modal
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        title={alt}
        maxWidth="max-w-6xl"
      >
        {imageSrc && !failed && (
          <img
            src={imageSrc}
            alt={alt}
            className="mx-auto block h-auto max-h-[75vh] max-w-full object-contain"
          />
        )}
      </Modal>
    </>
  );
}
