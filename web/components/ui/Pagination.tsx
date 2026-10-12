"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PageMode = {
  mode: "page";
  page: number;
  onPageChange: (page: number) => void;
} & (
  | { totalPages: number; limit?: number; total?: number }
  | { limit: number; total: number; totalPages?: number }
);

type SkipLimitMode = {
  mode: "skip-limit";
  skip: number;
  limit: number;
  total: number;
  onSkipChange: (skip: number) => void;
};

export type PaginationProps = PageMode | SkipLimitMode;

function PageButton({
  active = false,
  disabled = false,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-40 ${active ? "bg-primary text-white" : "text-text-secondary hover:bg-primary-light"}`}
    >
      {children}
    </button>
  );
}

export function Pagination(props: PaginationProps) {
  const pageMode = props.mode === "page";
  const page = pageMode ? props.page : Math.floor(props.skip / props.limit) + 1;
  const limit = props.limit;
  const totalPages = pageMode
    ? (props.totalPages ?? Math.ceil((props.total ?? 0) / (limit ?? 1)))
    : Math.max(1, Math.ceil(props.total / props.limit));
  const total = props.total;

  if (totalPages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const changePage = (nextPage: number) => {
    if (pageMode) {
      props.onPageChange(nextPage);
    } else {
      props.onSkipChange((nextPage - 1) * props.limit);
    }
  };
  const from = total === undefined ? undefined : total === 0 ? 0 : (page - 1) * (limit ?? 1) + 1;
  const to = total === undefined ? undefined : Math.min(total, page * (limit ?? total));

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3"
      aria-label="Pagination"
    >
      <p className="text-sm text-text-hint" aria-live="polite">
        {from !== undefined && to !== undefined
          ? `Showing ${from}–${to} of ${total}`
          : `Page ${page} of ${totalPages}`}
      </p>
      <div className="flex items-center gap-1">
        <PageButton
          label="Previous page"
          disabled={page <= 1}
          onClick={() => changePage(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </PageButton>
        {start > 1 && (
          <>
            <PageButton label="Page 1" onClick={() => changePage(1)}>1</PageButton>
            {start > 2 && <span className="px-1 text-text-hint" aria-hidden="true">…</span>}
          </>
        )}
        {pages.map((current) => (
          <PageButton
            key={current}
            label={`Page ${current}`}
            active={current === page}
            onClick={() => changePage(current)}
          >
            {current}
          </PageButton>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-text-hint" aria-hidden="true">…</span>}
            <PageButton
              label={`Page ${totalPages}`}
              onClick={() => changePage(totalPages)}
            >
              {totalPages}
            </PageButton>
          </>
        )}
        <PageButton
          label="Next page"
          disabled={page >= totalPages}
          onClick={() => changePage(page + 1)}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </PageButton>
      </div>
    </nav>
  );
}
