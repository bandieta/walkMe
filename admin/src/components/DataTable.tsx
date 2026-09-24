import React from 'react';
import { Page } from '../api/types';

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
}

interface Props<T> {
  columns: Column<T>[];
  data: Page<T> | null;
  loading: boolean;
  error: string | null;
  page: number;
  onPageChange: (page: number) => void;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  emptyLabel?: string;
}

export function DataTable<T>({ columns, data, loading, error, page, onPageChange, onRowClick, rowKey, emptyLabel = 'Nothing here yet.' }: Props<T>) {
  return (
    <div className="table-wrap">
      {error ? (
        <div className="state-message" style={{ color: 'var(--error)' }}>
          {error}
        </div>
      ) : loading && !data ? (
        <div className="state-message">Loading…</div>
      ) : !data || data.items.length === 0 ? (
        <div className="empty-state">{emptyLabel}</div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} style={c.align === 'right' ? { textAlign: 'right' } : undefined}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={rowKey(row)} className={onRowClick ? 'clickable' : undefined} onClick={() => onRowClick?.(row)}>
                  {columns.map((c) => (
                    <td key={c.key} style={c.align === 'right' ? { textAlign: 'right' } : undefined}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <span>
              {data.total} total · page {data.page} of {data.pageCount}
            </span>
            <div className="pagination-controls">
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                Prev
              </button>
              <button className="btn btn-sm" disabled={page >= data.pageCount} onClick={() => onPageChange(page + 1)}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
