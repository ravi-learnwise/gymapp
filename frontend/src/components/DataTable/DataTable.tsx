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
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Columns
          </button>
          {showPicker && (
            <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-slate-600">
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
                          className={`inline-flex items-center gap-1 ${canSort ? 'hover:text-slate-900' : ''}`}
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
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages != null && pages > 1 && onPageChange && page != null && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-500">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
