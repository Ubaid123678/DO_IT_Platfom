"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";

interface StructuredEvidenceViewerProps {
  evidencePayload: Record<string, unknown>;
  evidenceType?: string;
}

const humanize = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasUri = (value: unknown): value is Record<string, unknown> =>
  isPlainObject(value) && typeof value.uri === "string";

const isUriArray = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.length > 0 && value.every((item) => hasUri(item));

function Thumbnail({
  src,
  label,
  onOpen,
}: {
  src: string;
  label?: string;
  onOpen: (src: string) => void;
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Images may be `data:` base64 URIs (mobile camera capture) — must use a
  // plain <img> (NOT next/image) so the browser can render them directly.
  return (
    <button
      type="button"
      onClick={() => onOpen(src ?? "")}
      className="group w-full overflow-hidden rounded-xl border border-border bg-bg text-left transition-colors hover:border-primary"
    >
      <div className="relative flex aspect-square items-center justify-center bg-bg">
        {!src ? (
          <p className="px-3 text-center text-xs text-text-hint">Not required for this document type</p>
        ) : error ? (
          <div className="flex items-center justify-center h-full w-full px-3 text-center text-xs text-text-hint">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Image unavailable
          </div>
        ) : !loaded ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <img
            src={src}
            alt={label ?? "Evidence image"}
            className="h-full w-full object-cover"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
      </div>
      <p className="truncate px-2 py-1.5 text-[12px] font-medium text-text-secondary">{label}</p>
    </button>
  );
}

function ValueRow({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") {
    return (
      <div className="flex justify-between gap-4 py-1.5">
        <span className="text-[13px] text-text-secondary">{label}</span>
        <span className="text-[13px] font-medium text-text-primary">{value ? "Yes" : "No"}</span>
      </div>
    );
  }
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className="text-right text-[13px] font-medium text-text-primary">{String(value)}</span>
    </div>
  );
}

function SubBlock({ title, value }: { title: string; value: Record<string, unknown> }) {
  return (
    <div className="rounded-xl border border-border bg-bg/40 p-3">
      <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-text-secondary">{title}</p>
      <div className="divide-y divide-border/60">
        {Object.entries(value).map(([key, val]) => (
          <ValueRow key={key} label={humanize(key)} value={val} />
        ))}
      </div>
    </div>
  );
}

interface StructuredEvidenceViewerProps {
  evidencePayload: Record<string, unknown>;
  evidenceType?: string;
  autoCheckResult?: Record<string, unknown> | null;
}

export function StructuredEvidenceViewer({ evidencePayload, evidenceType, autoCheckResult }: StructuredEvidenceViewerProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const content = (
    <>
      {evidenceType && (
        <p className="text-[12px] font-semibold uppercase tracking-wide text-text-hint">
          Evidence type: {humanize(evidenceType)}
        </p>
      )}

      {autoCheckResult && Object.keys(autoCheckResult).length > 0 && (
        <div className="rounded-xl border border-primary/40 bg-primary-light p-4">
          <p className="mb-2 text-[13px] font-semibold text-primary-dark">Auto-check result</p>
          <div className="divide-y divide-primary/20">
            {Object.entries(autoCheckResult).map(([key, value]) => (
              <ValueRow key={key} label={humanize(key)} value={value} />
            ))}
          </div>
        </div>
      )}

      {Object.entries(evidencePayload).map(([key, value]) => {
        // Handle URI arrays (photos, certificates, etc.)
        if (Array.isArray(value) && value.length > 0 && value.every(hasUri)) {
          const keyLower = key.toLowerCase();
          const isPhotos = keyLower.includes("photo") || keyLower.includes("image") || keyLower.includes("picture");

          return (
            <div key={key} className="rounded-xl border border-border bg-bg/40 p-4">
              <p className="mb-3 text-[13px] font-semibold text-text-primary flex items-center gap-2">
                {key}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {value.map((item, index) => (
                  <Thumbnail
                    key={`${key}-${index}`}
                    src={String(item.uri)}
                    label={(typeof item.name === "string" ? item.name : (typeof item.caption === "string" ? item.caption : undefined))}
                    onOpen={(src) => setLightboxSrc(src)}
                  />
                ))}
              </div>
            </div>
          );
        }

        if (isPlainObject(value) && typeof value.uri === "string") {
          return (
            <div key={key} className="rounded-xl border border-border bg-bg/40 p-3 flex items-start gap-3">
              <div className="w-28 shrink-0">
                <Thumbnail src={String(value.uri)} label={typeof value.name === "string" ? value.name : undefined} onOpen={(src) => setLightboxSrc(src)} />
              </div>
              <div className="flex-1">
                {Object.entries(value)
                  .filter(([k]) => k !== "uri" && k !== "name")
                  .map(([k, v]) => (
                    <ValueRow key={k} label={humanize(k)} value={v} />
                  ))}
              </div>
            </div>
          );
        }

        if (Array.isArray(value) && !isUriArray(value)) {
          const items = value.map((item) => (isPlainObject(item) ? JSON.stringify(item) : String(item)));
          return (
            <div key={key} className="border-b border-border/60 py-1.5 last:border-0">
              <ValueRow label={humanize(key)} value={items.join(", ")} />
            </div>
          );
        }

        if (isPlainObject(value)) {
          return (
            <SubBlock key={key} title={humanize(key)} value={value} />
          );
        }

        return (
          <div key={key} className="border-b border-border/60 py-1.5 last:border-0">
            <ValueRow label={humanize(key)} value={value} />
          </div>
        );
      })}
    </>
  );

  return (
    <div>
      <div className="space-y-4">{content}</div>
      <div>
        <ImageLightbox src={lightboxSrc ?? ""} open={lightboxSrc !== null} onClose={() => setLightboxSrc(null)} />
      </div>
    </div>
  );
}