import { useEffect, useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef as ColumnDef,
} from '@tanstack/react-table/legacy';

type SortingState = { id: string; desc: boolean }[];
type VisibilityState = Record<string, boolean>;

export type DataTableColumn<T> = ColumnDef<T, unknown> & {
  id: string;
  meta?: { fixed?: boolean; label?: string };
};

type Props<T> = {
  tableKey: string;
  columns: DataTableColumn<T>[];
  data: T[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  page?: number;
  pages?: number;
  onPageChange?: (page: number) => void;
  total?: number;
  pageSize?: number;
  emptyMessage?: string;
};

function loadVisibility(tableKey: string): VisibilityState {
  try {
    const raw = localStorage.getItem(`datatable:${tableKey}:columns`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function DataTable<T>({
  tableKey,
  columns,
  data,
  sortBy,
  sortOrder = 'desc',
  onSortChange,
  page,
  pages,
  onPageChange,
  total,
  pageSize = 20,
  emptyMessage = 'No records found',
}: Props<T>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    loadVisibility(tableKey),
  );
  const [showPicker, setShowPicker] = useState(false);

  const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [];

  useEffect(() => {
    localStorage.setItem(`datatable:${tableKey}:columns`, JSON.stringify(columnVisibility));
  }, [tableKey, columnVisibility]);

  const table = useLegacyTable({
    data,
    columns,
    state: { columnVisibility, sorting },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const toggleColumns = useMemo(
    () =>
      columns.filter((c) => !c.meta?.fixed).map((c) => ({
        id: c.id!,
        label: c.meta?.label ?? c.id!,
      })),
    [columns],
  );

  const handleHeaderClick = (columnId: string, canSort: boolean) => {
    if (!canSort || !onSortChange) return;
    const nextOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(columnId, nextOrder);
  };

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-brand-50"
          >
            Columns
          </button>
          {showPicker && (
            <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-line bg-white p-2 shadow-lg">
              {toggleColumns.map((col) => (
                <label key={col.id} className="flex items-center gap-2 px-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={table.getColumn(col.id)?.getIsVisible() ?? true}
                    onChange={() => table.getColumn(col.id)?.toggleVisibility()}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white data-table-wrap">
        <table className="data-table w-full">
          <thead className="data-table-head">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = Boolean(onSortChange && header.column.getCanSort());
                  const isSorted = sortBy === header.column.id;
                  return (
                    <th key={header.id} className="px-4 py-3 font-medium">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 ${canSort ? 'hover:text-ink' : ''}`}
                          onClick={() => handleHeaderClick(header.column.id, canSort)}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {isSorted && (
                            <span className="text-xs">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="data-table-row">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(pages != null && pages > 0 && onPageChange && page != null) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
          <div className="text-ink-muted">
            {total != null && total > 0 ? (
              <>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                <span className="mx-2">·</span>
              </>
            ) : null}
            {pageSize} per page
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="btn btn-secondary !h-9 !px-3 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 text-ink-muted">
              Page {page} of {Math.max(pages, 1)}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
              className="btn btn-secondary !h-9 !px-3 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
