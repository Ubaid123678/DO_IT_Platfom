"use client";

import { Skeleton } from "./Skeleton";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  skeletonRows?: number;
  rowKey?: (row: T) => string;
}

export function Table<T>({
  columns,
  rows,
  loading = false,
  empty,
  onRowClick,
  skeletonRows = 8,
  rowKey,
}: TableProps<T>) {
  const renderEmpty = () => {
    if (empty) return empty;
    return (
      <div className="py-12 text-center text-[13px] text-text-hint">
        No records found
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full text-left">
          <thead className="sticky top-0 bg-bg">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-text-secondary ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? Array.from({ length: skeletonRows }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {columns.map((column) => (
                      <td key={column.key} className={`px-4 py-3 ${column.className ?? ""}`}>
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.length === 0
                ? (
                    <tr>
                      <td colSpan={columns.length}>{renderEmpty()}</td>
                    </tr>
                  )
                : rows.map((row, index) => (
                    <tr
                      key={rowKey ? rowKey(row) : index}
                      className={`${onRowClick ? "cursor-pointer" : ""} odd:bg-bg/40 transition-colors hover:bg-primary-light/40`}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {columns.map((column) => (
                        <td key={column.key} className={`px-4 py-3 ${column.className ?? ""}`}>
                          {column.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
