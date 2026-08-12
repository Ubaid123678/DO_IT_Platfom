"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageMode {
  mode: "page";
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface SkipLimitMode {
  mode: "skip-limit";
  skip: number;
  limit: number;
  total: number;
  onSkipChange: (skip: number) => void;
}

export type PaginationProps = PageMode | SkipLimitMode;

function PageButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-[10px] px-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-40 ${
        active ? "bg-primary text-white" : "text-text-secondary hover:bg-primary-light"
      }`}
    >
      {children}
    </button>
  );
}

export function Pagination(props: PaginationProps) {
  if (props.mode === "page") {
    const { page, totalPages, onPageChange } = props;
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i += 1) pages.push(i);

    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-text-hint">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </PageButton>
          {start > 1 && (
            <>
              <PageButton onClick={() => onPageChange(1)}>1</PageButton>
              {start > 2 && <span className="px-1 text-[13px] text-text-hint">…</span>}
            </>
          )}
          {pages.map((p) => (
            <PageButton key={p} active={p === page} onClick={() => onPageChange(p)}>
              {p}
            </PageButton>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="px-1 text-[13px] text-text-hint">…</span>}
              <PageButton onClick={() => onPageChange(totalPages)}>{totalPages}</PageButton>
            </>
          )}
          <PageButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </PageButton>
        </div>
      </div>
    );
  }

  const { skip, limit, total, onSkipChange } = props;
  const page = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(total, skip + limit);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[13px] text-text-hint">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <PageButton disabled={page <= 1} onClick={() => onSkipChange(Math.max(0, skip - limit))}>
          <ChevronLeft className="h-4 w-4" />
        </PageButton>
        <span className="px-2 text-[13px] text-text-secondary">
          Page {page} of {totalPages}
        </span>
        <PageButton disabled={page >= totalPages} onClick={() => onSkipChange(skip + limit)}>
          <ChevronRight className="h-4 w-4" />
        </PageButton>
      </div>
    </div>
  );
}
