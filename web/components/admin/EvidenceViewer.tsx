"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";

interface EvidenceViewerProps {
  evidencePayload: Record<string, unknown>;
  evidenceType?: string;
  autoCheckResult?: Record<string, unknown> | null;
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

  return (
    <button
      type="button"
      onClick={() => onOpen(src)}
      className="group w-full overflow-hidden rounded-xl border border-border bg-bg text-left transition-colors hover:border-primary"
    >
      <div className="relative flex aspect-square items-center justify-center bg-bg">
        {!loaded && !error && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        {error ? (
          <p className="px-2 text-center text-xs text-text-hint">Image unavailable</p>
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
      {label && (
        <p className="truncate px-2 py-1.5 text-[12px] text-text-secondary">{label}</p>
      )}
    </button>
  );
}

function UriThumbnail({
  item,
  onOpen,
}: {
  item: Record<string, unknown>;
  onOpen: (src: string) => void;
}) {
  const label = typeof item.name === "string" ? item.name : typeof item.caption === "string" ? item.caption : undefined;
  const src = String(item.uri);
  return <Thumbnail src={src} label={label} onOpen={onOpen} />;
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

export function EvidenceViewer({ evidencePayload, evidenceType, autoCheckResult }: EvidenceViewerProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <div className="space-y-4">
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
        if (isUriArray(value)) {
          return (
            <div key={key}>
              <p className="mb-2 text-[13px] font-semibold text-text-primary">{humanize(key)}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {value.map((item, index) => (
                  <UriThumbnail key={`${key}-${index}`} item={item} onOpen={(src) => setLightboxSrc(src)} />
                ))}
              </div>
            </div>
          );
        }

        if (Array.isArray(value)) {
          const items = value.map((item) =>
            isPlainObject(item) ? JSON.stringify(item) : String(item),
          );
          return (
            <div key={key}>
              <p className="mb-2 text-[13px] font-semibold text-text-primary">{humanize(key)}</p>
              <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                  <span
                    key={`${key}-${index}`}
                    className="rounded-full bg-bg px-2.5 py-1 text-[12px] text-text-secondary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        }

        if (isPlainObject(value)) {
          if (typeof value.uri === "string") {
            return (
              <div key={key} className="flex items-start gap-3">
                <div className="w-28 shrink-0">
                  <Thumbnail src={String(value.uri)} label={typeof value.name === "string" ? String(value.name) : undefined} onOpen={(src) => setLightboxSrc(src)} />
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

      <ImageLightbox
        src={lightboxSrc ?? ""}
        open={lightboxSrc !== null}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
