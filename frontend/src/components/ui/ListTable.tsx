import type { ReactNode } from 'react';

type ListTableProps = {
  children: ReactNode;
  className?: string;
};

export function ListTable({ children, className = '' }: ListTableProps) {
  return (
    <div className={`list-table-wrap ${className}`.trim()}>
      <table className="list-table">{children}</table>
    </div>
  );
}

export function ListTableCols({ widths }: { widths: string[] }) {
  return (
    <colgroup>
      {widths.map((width, index) => (
        <col key={index} style={{ width }} />
      ))}
    </colgroup>
  );
}

export function ListTableHead({ children }: { children: ReactNode }) {
  return <thead className="list-table-head">{children}</thead>;
}

export function ListTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function ListTableEmpty({ colSpan, message = 'No records found' }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="list-table-empty">
        {message}
      </td>
    </tr>
  );
}

/** Standard column widths for name / description / status / actions tables */
export const LIST_TABLE_4_COL = ['24%', '46%', '14%', '16%'] as const;
export const LIST_TABLE_DISCOUNT_COL = ['20%', '32%', '12%', '14%', '22%'] as const;
export const LIST_TABLE_USERS_COL = ['40%', '18%', '42%'] as const;
export const LIST_TABLE_DURATION_COL = ['28%', '14%', '18%', '14%', '26%'] as const;
