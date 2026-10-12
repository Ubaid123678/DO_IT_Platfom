"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { Skeleton } from "./Skeleton";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  emptyState?: ReactNode;
  empty?: ReactNode;
  error?: string | Error | null;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T) => string;
  skeletonRows?: number;
  caption?: string;
}

export function DataTable<T>({
  columns,
  rows,
  loading = false,
  emptyState,
  empty,
  error,
  onRetry,
  onRowClick,
  rowKey,
  skeletonRows = 8,
  caption = "Data table",
}: DataTableProps<T>) {
  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick?.(row);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {error ? (
        <ErrorState
          title="Unable to load data"
          message={error instanceof Error ? error.message : error}
          onRetry={onRetry}
        />
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-full text-left"
            aria-busy={loading}
          >
            <caption className="sr-only">{caption}</caption>
            <thead className="bg-bg">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary ${column.className ?? ""}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? Array.from({ length: skeletonRows }, (_, rowIndex) => (
                    <tr
                      key={`skeleton-${rowIndex}`}
                      aria-hidden="true"
                      className="h-14"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-3 ${column.className ?? ""}`}
                        >
                          <Skeleton className="h-4 w-full max-w-40" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                  ? (
                      <tr>
                        <td colSpan={columns.length}>
                          {emptyState ?? empty ?? (
                            <EmptyState title="No records found" />
                          )}
                        </td>
                      </tr>
                    )
                  : rows.map((row, index) => (
                      <tr
                        key={rowKey?.(row) ?? index}
                        className={`${onRowClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary" : ""} transition-colors hover:bg-primary-light/40`}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        onKeyDown={
                          onRowClick
                            ? (event) => onRowKeyDown(event, row)
                            : undefined
                        }
                        tabIndex={onRowClick ? 0 : undefined}
                        aria-label={onRowClick ? `Open row ${index + 1}` : undefined}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-4 py-3 text-sm text-text-primary ${column.className ?? ""}`}
                          >
                            {column.render(row, index)}
                          </td>
                        ))}
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export { DataTable as Table };
export type { DataTableColumn as Column };
